import express from 'express';
import { 
    getCoupons, 
    createCoupon, 
    updateCoupon, 
    deleteCoupon, 
    validateCoupon 
} from '../controllers/couponController';
import { protect, adminOnly } from '../middlewares/authMiddleware';
import { validate } from '../lib/http';
import { adminSchemas } from '../validation/schemas';

const router = express.Router();

// Public route to validate a coupon
router.post('/validate', validateCoupon);

// Admin routes for coupon management
router.get('/', protect, adminOnly, getCoupons);
router.post('/', protect, adminOnly, validate(adminSchemas.couponCreate), createCoupon);
router.put('/:id', protect, adminOnly, validate(adminSchemas.couponUpdate), updateCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

export default router;
