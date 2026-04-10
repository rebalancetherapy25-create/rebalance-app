import express from 'express';
import { therapistLogin, therapistLogout, therapistMe, therapistRefresh, therapistUpdatePassword } from '../controllers/therapistAuthController';
import { protectTherapist } from '../middlewares/therapistAuthMiddleware';

const router = express.Router();

router.post('/login', therapistLogin);
router.post('/refresh', therapistRefresh);
router.post('/logout', protectTherapist, therapistLogout);
router.get('/me', protectTherapist, therapistMe);
router.put('/password', protectTherapist, therapistUpdatePassword);

export default router;
