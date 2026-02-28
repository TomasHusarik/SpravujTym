import { addPayment, addPayments, deletePayment, getPayments, updatePayment } from '@controllers/payment.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireAdmin, requireLoggedUser } from '@middleware/permission.rules';
import express from 'express';

const router = express.Router();

router.use(authMiddleware);

// GET /payment/get-payments - Get all user payments
router.get('/get-payments/:userId', requireLoggedUser, getPayments);

// POST /payment/add-payment - Create a new payment
router.post('/add-payment', requireAdmin, addPayment);

// POST /payment/add-payment - Create payment
router.post('/add-payments', requireAdmin, addPayments);

// PUT /payment/update-payment/:id - Update payment by ID
router.put('/update-payment/:id', requireAdmin, updatePayment);

// DELETE /payment/delete-payment/:id - Delete payment by ID
router.delete('/delete-payment/:id', requireAdmin, deletePayment);


export default router;