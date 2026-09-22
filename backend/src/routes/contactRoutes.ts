import express from 'express';
import { submitContactInquiry } from '../controllers/contactController';
import { contactLimiter } from '../middlewares/rateLimit';
import { validate } from '../lib/http';
import { contactSchemas } from '../validation/schemas';

const router = express.Router();

router.post('/', contactLimiter, validate(contactSchemas.submit), submitContactInquiry);

export default router;
