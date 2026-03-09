import { guestEmail } from '@mails/GuestMail';
import express from 'express';

const router = express.Router();

router.post('/send-email', guestEmail);

export default router;