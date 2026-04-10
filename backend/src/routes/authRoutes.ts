import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
    getMe,
    updateMe,
    updateMyPassword
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/password', protect, updateMyPassword);

export default router;
