import { guestEmail } from '@mails/GuestMail';
import { rateLimit } from '@middleware/rateLimit.middleware';
import express from 'express';

const router = express.Router();

// Public contact form - limit messages per IP to prevent spam
const guestEmailRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

router.post('/send-email', guestEmailRateLimit, guestEmail);

export default router;
