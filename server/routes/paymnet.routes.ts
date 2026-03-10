import { createPayments, deletePayment, getPayment, getPayments, updatePayment } from '@controllers/payment.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireAdmin, requireLoggedUser } from '@middleware/permission.rules';
import express from 'express';

const router = express.Router();

router.use(authMiddleware);

// GET /payment/get-payment/:paymentId - Get payment by ID
router.get('/get-payment/:paymentId', requireLoggedUser, getPayment);

// GET /payment/get-payments/:userId - Get payments for a specific user
router.get('/get-payments/:userId', requireLoggedUser, getPayments);

// POST /payment/add-payments - Create new payments
router.post('/add-payments', requireAdmin, createPayments);

// PUT /payment/update-payment/:id - Update payment by ID
router.put('/update-payment/:id', requireAdmin, updatePayment);

// DELETE /payment/delete-payment/:id - Delete payment by ID
router.delete('/delete-payment/:id', requireAdmin, deletePayment);


export default router;