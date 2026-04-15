import { v2 as cloudinary } from 'cloudinary';
const { CloudinaryStorage } = require('multer-storage-cloudinary');
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (isProduction && (!cloudName || !apiKey || !apiSecret)) {
    console.warn('[cloudinary] Cloudinary is not fully configured in production. Upload routes will fail until env vars are set.');
}

cloudinary.config({
    cloud_name: cloudName || 'mock_cloud_name',
    api_key: apiKey || 'mock_api_key',
    api_secret: apiSecret || 'mock_api_secret',
});

// @ts-ignore
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req: any, file: any) => {
        return {
            folder: 'rebalance_banners',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        };
    },
});

export const upload = multer({ storage });
export { cloudinary };

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const bannerUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            callback(new Error('Only JPG, PNG, and WEBP images are allowed.'));
            return;
        }

        callback(null, true);
    },
});
