import { addPayment, addPayments, deletePayment, getPayments, updatePayment } from '@controllers/payment.controller';
import express from 'express';

const router = express.Router();


// GET /payment/get-payments - Get all user payments
router.get('/get-payments/:userId', getPayments);

// POST /payment/add-payment - Create a new payment
router.post('/add-payment', addPayment);

// POST /payment/add-payment - Create payment
router.post('/add-payments', addPayments);

// PUT /payment/update-payment/:id - Update payment by ID
router.put('/update-payment/:id', updatePayment);

// DELETE /payment/delete-payment/:id - Delete payment by ID
router.delete('/delete-payment/:id', deletePayment);


export default router;