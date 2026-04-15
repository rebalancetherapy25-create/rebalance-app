import express from 'express';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController';
import { bannerUpload } from '../config/cloudinary';
import { protect, adminOnly } from '../middlewares/authMiddleware';
import { validate } from '../lib/http';
import { adminSchemas } from '../validation/schemas';

const router = express.Router();

// Public route to get active banners
router.get('/', getBanners);

// Admin routes for banner management
router.post('/', protect, adminOnly, bannerUpload.single('image'), validate(adminSchemas.bannerCreate), createBanner);
router.put('/:id', protect, adminOnly, bannerUpload.single('image'), validate(adminSchemas.bannerUpdate), updateBanner);
router.delete('/:id', protect, adminOnly, deleteBanner);

export default router;
