import type { Request, Response } from 'express';

import { sendData, sendError } from '../lib/http';
import {
    confirmBookingPaymentByOrderId,
    markBookingPaymentFailed,
    verifyRazorpayWebhookSignature,
} from '../services/paymentService';

type RazorpayWebhookEvent = {
    event?: string;
    payload?: {
        payment?: {
            entity?: {
                id?: string;
                order_id?: string;
                error_description?: string;
            };
        };
        order?: {
            entity?: {
                id?: string;
                payment_id?: string;
            };
        };
    };
};

const getWebhookEntity = (event: RazorpayWebhookEvent) => {
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    return {
        orderId: paymentEntity?.order_id || orderEntity?.id,
        paymentId: paymentEntity?.id || orderEntity?.payment_id,
        failureReason: paymentEntity?.error_description,
    };
};

export const handleRazorpayWebhook = async (req: Request, res: Response) => {
    try {
        const signature = req.get('x-razorpay-signature');
        const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');

        if (!verifyRazorpayWebhookSignature(payload, signature)) {
            return sendError(res, 401, 'Invalid webhook signature', { code: 'PAYMENT_WEBHOOK_INVALID_SIGNATURE' });
        }

        const event = JSON.parse(payload.toString('utf8')) as RazorpayWebhookEvent;
        const { orderId, paymentId, failureReason } = getWebhookEntity(event);

        switch (event.event) {
            case 'payment.captured':
            case 'order.paid': {
                if (!orderId || !paymentId) {
                    return sendError(res, 400, 'Webhook payload is missing payment identifiers', { code: 'PAYMENT_WEBHOOK_INVALID_PAYLOAD' });
                }

                const result = await confirmBookingPaymentByOrderId({ orderId, paymentId });
                if (!result.ok && result.status !== 404) {
                    return sendError(res, result.status, result.error, { code: 'PAYMENT_WEBHOOK_CONFIRM_FAILED' });
                }

                return sendData(res, {
                    received: true,
                    event: event.event,
                    idempotent: result.ok ? Boolean(result.idempotent) : false,
                    bookingId: result.ok ? String(result.booking?._id || '') : undefined,
                });
            }

            case 'payment.failed': {
                const result = await markBookingPaymentFailed({
                    ...(orderId ? { orderId } : {}),
                    ...(paymentId ? { paymentId } : {}),
                    ...(failureReason ? { reason: failureReason } : {}),
                });
                if (!result.ok && result.status !== 404) {
                    return sendError(res, result.status, result.error, { code: 'PAYMENT_WEBHOOK_FAILURE_FAILED' });
                }

                return sendData(res, {
                    received: true,
                    event: event.event,
                    bookingId: result.ok ? String(result.booking?._id || '') : undefined,
                });
            }

            default:
                return sendData(res, {
                    received: true,
                    ignored: true,
                    event: event.event || 'unknown',
                });
        }
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        return sendError(res, 500, 'Server error processing webhook', { code: 'PAYMENT_WEBHOOK_FAILED' });
    }
};
