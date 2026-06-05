import { Request, Response } from 'express';
import { Coupon } from '../models';
import { sendData, sendError } from '../lib/http';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getCoupons = async (req: AuthRequest, res: Response) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        return sendData(res, coupons);
    } catch (error) {
        return sendError(res, 500, 'Failed to fetch coupons', { code: 'COUPON_FETCH_FAILED' });
    }
};

export const createCoupon = async (req: AuthRequest, res: Response) => {
    try {
        const { code, discountPercentage, isActive, expiresAt, maxUsage } = req.body;
        
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return sendError(res, 400, 'Coupon code already exists', { code: 'COUPON_EXISTS' });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountPercentage: Number(discountPercentage),
            isActive: isActive === 'true' || isActive === true,
            ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
            ...(maxUsage ? { maxUsage: Number(maxUsage) } : {}),
        });

        return sendData(res, coupon);
    } catch (error) {
        return sendError(res, 500, 'Failed to create coupon', { code: 'COUPON_CREATE_FAILED' });
    }
};

export const updateCoupon = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { code, discountPercentage, isActive, expiresAt, maxUsage } = req.body;

        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return sendError(res, 404, 'Coupon not found', { code: 'COUPON_NOT_FOUND' });
        }

        if (code) coupon.code = code.toUpperCase();
        if (discountPercentage !== undefined) coupon.discountPercentage = Number(discountPercentage);
        if (isActive !== undefined) coupon.isActive = isActive === 'true' || isActive === true;
        if (expiresAt !== undefined) {
            if (expiresAt) coupon.expiresAt = new Date(expiresAt);
            else delete coupon.expiresAt;
        }
        if (maxUsage !== undefined) {
            if (maxUsage) coupon.maxUsage = Number(maxUsage);
            else delete coupon.maxUsage;
        }

        await coupon.save();

        return sendData(res, coupon);
    } catch (error) {
        return sendError(res, 500, 'Failed to update coupon', { code: 'COUPON_UPDATE_FAILED' });
    }
};

export const deleteCoupon = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) {
            return sendError(res, 404, 'Coupon not found', { code: 'COUPON_NOT_FOUND' });
        }
        return sendData(res, { success: true });
    } catch (error) {
        return sendError(res, 500, 'Failed to delete coupon', { code: 'COUPON_DELETE_FAILED' });
    }
};

export const validateCoupon = async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        if (!code) {
            return sendError(res, 400, 'Coupon code is required', { code: 'COUPON_CODE_REQUIRED' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (!coupon) {
            return sendError(res, 404, 'Invalid coupon code', { code: 'COUPON_INVALID' });
        }

        if (!coupon.isActive) {
            return sendError(res, 400, 'This coupon is no longer active', { code: 'COUPON_INACTIVE' });
        }

        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
            return sendError(res, 400, 'This coupon has expired', { code: 'COUPON_EXPIRED' });
        }

        if (coupon.maxUsage && coupon.currentUsage >= coupon.maxUsage) {
            return sendError(res, 400, 'This coupon has reached its usage limit', { code: 'COUPON_LIMIT_REACHED' });
        }

        return sendData(res, { 
            valid: true, 
            discountPercentage: coupon.discountPercentage,
            code: coupon.code
        });
    } catch (error) {
        return sendError(res, 500, 'Failed to validate coupon', { code: 'COUPON_VALIDATE_FAILED' });
    }
};
