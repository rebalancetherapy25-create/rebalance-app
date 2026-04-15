import express from 'express';
import { therapistLogin, therapistLogout, therapistMe, therapistRefresh, therapistUpdatePassword } from '../controllers/therapistAuthController';
import { protectTherapist } from '../middlewares/therapistAuthMiddleware';
import { authLimiter } from '../middlewares/rateLimit';
import { validate } from '../lib/http';
import { therapistAuthSchemas } from '../validation/schemas';

const router = express.Router();

router.post('/login', authLimiter, validate(therapistAuthSchemas.login), therapistLogin);
router.post('/refresh', therapistRefresh);
router.post('/logout', protectTherapist, therapistLogout);
router.get('/me', protectTherapist, therapistMe);
router.put('/password', protectTherapist, validate(therapistAuthSchemas.updatePassword), therapistUpdatePassword);

export default router;
