import { v2 as cloudinary } from 'cloudinary';
const { CloudinaryStorage } = require('multer-storage-cloudinary');
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud_name',
    api_key: process.env.CLOUDINARY_API_KEY || 'mock_api_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_api_secret',
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
