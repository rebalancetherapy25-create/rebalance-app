import express from 'express';
import { getOfferBanners, getAllOfferBanners, createOfferBanner, updateOfferBanner, deleteOfferBanner } from '../controllers/offerBannerController';
import { bannerUpload } from '../config/cloudinary';
import { protect, adminOnly } from '../middlewares/authMiddleware';
import { validate } from '../lib/http';
import { adminSchemas } from '../validation/schemas';

const router = express.Router();

// Public route to get active offer banners
router.get('/', getOfferBanners);

// Admin routes for offer banner management
router.get('/all', protect, adminOnly, getAllOfferBanners);

router.post(
    '/',
    protect,
    adminOnly,
    bannerUpload.fields([
        { name: 'mobileImage', maxCount: 1 },
        { name: 'desktopImage', maxCount: 1 }
    ]),
    validate(adminSchemas.offerBannerCreate),
    createOfferBanner
);

router.put(
    '/:id',
    protect,
    adminOnly,
    bannerUpload.fields([
        { name: 'mobileImage', maxCount: 1 },
        { name: 'desktopImage', maxCount: 1 }
    ]),
    validate(adminSchemas.offerBannerUpdate),
    updateOfferBanner
);

router.delete('/:id', protect, adminOnly, deleteOfferBanner);

export default router;
