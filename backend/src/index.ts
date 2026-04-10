import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import config from './config/env';

dotenv.config();

const app: Express = express();
const PORT = config.port;

import authRoutes from './routes/authRoutes';
import therapistRoutes from './routes/therapistRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import bookingRoutes from './routes/bookingRoutes';
import bannerRoutes from './routes/bannerRoutes';
import therapistAuthRoutes from './routes/therapistAuthRoutes';
import therapistPortalRoutes from './routes/therapistPortalRoutes';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = new Set([config.frontendUrl, config.adminUrl, config.therapistUrl].filter(Boolean));
        const localDevPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
        const localLanPattern = /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/;

        if (!origin) {
            callback(null, true);
            return;
        }

        if (allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }

        if (!config.isProduction && (localDevPattern.test(origin) || localLanPattern.test(origin))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

import adminRoutes from './routes/adminRoutes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/therapist-auth', therapistAuthRoutes);
app.use('/api/therapist', therapistPortalRoutes);

// Basic route
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'ReBalance Therapy API is running' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
