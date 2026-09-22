import { v2 as cloudinary } from 'cloudinary';
const { CloudinaryStorage } = require('multer-storage-cloudinary');
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../lib/http';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const isCloudinaryConfigured = !!(cloudName && apiKey && apiSecret);

if (isProduction && !isCloudinaryConfigured) {
    console.warn('[cloudinary] Cloudinary is not fully configured in production. Upload routes will fail until env vars are set.');
}

const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/x-png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
]);

const allowedFormats = ['jpg', 'png', 'jpeg', 'webp', 'gif', 'svg', 'avif'];

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
                allowed_formats: allowedFormats,
            };
        },
    });

    // @ts-ignore
    therapistStorage = new CloudinaryStorage({
        cloudinary,
        params: async (req: any, file: any) => {
            return {
                folder: 'rebalance_therapists',
                allowed_formats: allowedFormats,
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

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']);

const imageFileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
    const mime = (file.mimetype || '').toLowerCase().split(';')[0]?.trim() || '';
    const ext = path.extname(file.originalname || '').toLowerCase();

    if (!allowedMimeTypes.has(mime) && !mime.startsWith('image/') && !allowedExtensions.has(ext)) {
        callback(new ApiError(400, 'Only image files (JPG, PNG, WEBP, GIF, SVG, AVIF) are allowed.', { code: 'INVALID_FILE_TYPE' }));
        return;
    }
    callback(null, true);
};

export const bannerUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: imageFileFilter,
});

export const therapistImageUpload = multer({
    storage: therapistStorage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: imageFileFilter,
});
