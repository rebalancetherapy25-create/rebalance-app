import dotenv from 'dotenv';

dotenv.config();

type Environment = 'development' | 'test' | 'production';

const parseEnvironment = (): Environment => {
    const value = process.env.NODE_ENV;
    if (value === 'production' || value === 'test') return value;
    return 'development';
};

const getRequired = (name: string, options?: { fallbackInDev?: string }): string => {
    const value = process.env[name];
    if (value) return value;

    const currentEnv = parseEnvironment();
    if (currentEnv !== 'production' && options?.fallbackInDev) {
        console.warn(`[env] ${name} is not set. Falling back to development default.`);
        return options.fallbackInDev;
    }

    throw new Error(`Missing required environment variable: ${name}`);
};

const optional = (name: string): string | undefined => {
    const value = process.env[name];
    return value || undefined;
};

const isCrossOrigin = (source?: string, target?: string): boolean => {
    if (!source || !target) return false;
    try {
        return new URL(source).origin !== new URL(target).origin;
    } catch {
        return false;
    }
};

const env = parseEnvironment();

const config = {
    env,
    port: Number(process.env.PORT || 5000),
    mongoUri: getRequired('MONGO_URI', { fallbackInDev: 'mongodb://localhost:27017/rebalance' }),
    jwtSecret: getRequired('JWT_SECRET'),
    jwtRefreshSecret: getRequired('JWT_REFRESH_SECRET'),
    therapistJwtSecret: getRequired('THERAPIST_JWT_SECRET', { fallbackInDev: 'dev_therapist_jwt_secret' }),
    therapistJwtRefreshSecret: getRequired('THERAPIST_JWT_REFRESH_SECRET', { fallbackInDev: 'dev_therapist_jwt_refresh_secret' }),
    razorpayKeyId: optional('RAZORPAY_KEY_ID'),
    razorpayKeySecret: optional('RAZORPAY_KEY_SECRET'),
    frontendUrl: optional('FRONTEND_URL') || 'http://localhost:3000',
    adminUrl: optional('ADMIN_URL') || 'http://localhost:3001',
    therapistUrl: optional('THERAPIST_URL') || 'http://localhost:3002',
    backendUrl: optional('BACKEND_URL'),
    resendApiKey: optional('RESEND_API_KEY'),
    emailFrom: optional('EMAIL_FROM') || 'Rebalance <no-reply@rebalance.health>',
    isProduction: env === 'production',
};

export const cookiePolicy = {
    isCrossSite: isCrossOrigin(config.frontendUrl, config.backendUrl)
        || isCrossOrigin(config.adminUrl, config.backendUrl)
        || isCrossOrigin(config.therapistUrl, config.backendUrl),
    secure: config.isProduction,
    sameSite: (() => {
        if (!config.isProduction) return 'lax' as const;
        if (!config.backendUrl) return 'none' as const;
        if (isCrossOrigin(config.frontendUrl, config.backendUrl)
            || isCrossOrigin(config.adminUrl, config.backendUrl)
            || isCrossOrigin(config.therapistUrl, config.backendUrl)) {
            return 'none' as const;
        }
        return 'lax' as const;
    })(),
};

export default config;
