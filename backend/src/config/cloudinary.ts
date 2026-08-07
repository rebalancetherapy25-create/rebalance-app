import { v2 as cloudinary } from 'cloudinary';
const { CloudinaryStorage } = require('multer-storage-cloudinary');
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const isCloudinaryConfigured = !!(cloudName && apiKey && apiSecret);

if (isProduction && !isCloudinaryConfigured) {
    console.warn('[cloudinary] Cloudinary is not fully configured in production. Upload routes will fail until env vars are set.');
}

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

let storage: multer.StorageEngine;
let therapistStorage: multer.StorageEngine;

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });

    // @ts-ignore
    storage = new CloudinaryStorage({
        cloudinary,
        params: async (req: any, file: any) => {
            return {
                folder: 'rebalance_banners',
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            };
        },
    });

    // @ts-ignore
    therapistStorage = new CloudinaryStorage({
        cloudinary,
        params: async (req: any, file: any) => {
            return {
                folder: 'rebalance_therapists',
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            };
        },
    });
} else {
    console.warn('[cloudinary] Falling back to local disk storage because Cloudinary credentials are missing.');
    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const diskStorageEngine = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        }
    });

    // Wrap disk storage to mimic Cloudinary's behavior by overriding `path` to a URL
    storage = {
        _handleFile: (req, file, cb) => {
            diskStorageEngine._handleFile(req, file, (err, info) => {
                if (err) return cb(err);
                if (info) {
                    const host = process.env.BACKEND_URL || 'http://localhost:5000';
                    info.path = `${host}/uploads/${info.filename}`;
                }
                cb(null, info);
            });
        },
        _removeFile: (req, file, cb) => diskStorageEngine._removeFile(req, file, cb)
    };
    therapistStorage = storage;
}

export const upload = multer({ storage });
export { cloudinary };

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

export const therapistImageUpload = multer({
    storage: therapistStorage,
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
