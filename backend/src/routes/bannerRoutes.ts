import express from 'express';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController';
import { upload } from '../config/cloudinary';
import { protect, adminOnly } from '../middlewares/authMiddleware';

const router = express.Router();

// Public route to get active banners
router.get('/', getBanners);

// Admin routes for banner management
router.post('/', protect, adminOnly, upload.single('image'), createBanner);
router.put('/:id', protect, adminOnly, upload.single('image'), updateBanner);
router.delete('/:id', protect, adminOnly, deleteBanner);

export default router;
