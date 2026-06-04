import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes';
import therapistRoutes from './routes/therapistRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import bookingRoutes from './routes/bookingRoutes';
import bannerRoutes from './routes/bannerRoutes';
import offerBannerRoutes from './routes/offerBannerRoutes';
import couponRoutes from './routes/couponRoutes';
import therapistAuthRoutes from './routes/therapistAuthRoutes';
import therapistPortalRoutes from './routes/therapistPortalRoutes';
import adminRoutes from './routes/adminRoutes';
import paymentRoutes from './routes/paymentRoutes';
import config from './config/env';
import { apiLimiter } from './middlewares/rateLimit';
import { ApiError, errorHandler, notFoundHandler, requestContext, requestLogger, sendData } from './lib/http';
import { csrfProtection, ensureCsrfCookie } from './lib/csrf';

dotenv.config();

const getAllowedOrigins = () => new Set([config.frontendUrl, config.adminUrl, config.therapistUrl].filter(Boolean));
const vercelPreviewPattern = /^https:\/\/[a-z0-9-]+(?:-[a-z0-9-]+)*\.vercel\.app$/i;
const rebalanceDomainPattern = /^https:\/\/(?:admin\.|therapists\.|api\.)?rebalancetherapy\.co\.in$/i;
const localDevPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const localLanPattern = /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/;

export const isOriginAllowed = (origin?: string) => {
    if (!origin) return true;

    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.has(origin) || rebalanceDomainPattern.test(origin) || vercelPreviewPattern.test(origin)) {
        return true;
    }

    if (!config.isProduction && (localDevPattern.test(origin) || localLanPattern.test(origin))) {
        return true;
    }

    return false;
};

export const createApp = (): Express => {
    const app = express();

    app.disable('x-powered-by');
    app.use(requestContext);
    app.use(requestLogger);
    app.use('/api/payments', paymentRoutes);
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    app.use(cookieParser());
    app.use(ensureCsrfCookie);
    app.use(apiLimiter);
    app.use(cors({
        credentials: true,
        origin: (origin, callback) => {
            if (isOriginAllowed(origin)) {
                callback(null, true);
                return;
            }

            callback(new ApiError(403, 'Origin is not allowed', { code: 'CORS_NOT_ALLOWED' }));
        },
    }));

    app.get('/api/health', (_req: Request, res: Response) => {
        sendData(res, {
            status: 'ok',
            service: 'rebalance-api',
            env: config.env,
        });
    });

    app.get('/api/health/ready', (_req: Request, res: Response) => {
        const readyState = mongoose.connection.readyState;
        const database = readyState === 1 ? 'connected' : 'disconnected';
        if (readyState !== 1) {
            return res.status(503).json({
                error: 'Service is not ready',
                code: 'SERVICE_NOT_READY',
                data: {
                    status: 'not-ready',
                    database,
                    service: 'rebalance-api',
                },
                requestId: res.locals.requestId,
            });
        }

        sendData(res, {
            status: 'ready',
            database,
            service: 'rebalance-api',
        });
    });

    app.use(csrfProtection);
    app.use('/api/auth', authRoutes);
    app.use('/api/therapists', therapistRoutes);
    app.use('/api/availability', availabilityRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/banners', bannerRoutes);
    app.use('/api/offer-banners', offerBannerRoutes);
    app.use('/api/coupons', couponRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/therapist-auth', therapistAuthRoutes);
    app.use('/api/therapist', therapistPortalRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};

export const app = createApp();
