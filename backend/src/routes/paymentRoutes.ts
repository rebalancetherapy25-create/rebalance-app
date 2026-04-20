import express from 'express';

import { handleRazorpayWebhook } from '../controllers/paymentController';

const router = express.Router();

router.post('/razorpay/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

export default router;
