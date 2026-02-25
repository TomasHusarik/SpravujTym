import { Request, Response } from "express";
import Payment, { PaymentStatus } from "@models/Payment";
import ErrorMessages from "@utils/errorMessages";

// POST /payment/add-payment - Create a new payment
export const addPayment = async (req: Request, res: Response) => {
    const { amount, userId, dueDate, type, status } = req.body;

    if (!amount || !userId) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const newPayment = {
            amount,
            userId,
            dueDate,
            status,
            type,
        };

        await Payment.create( newPayment );
        return res.status(201).json(newPayment);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /payment/add-payments - Create payment for multiple users
export const addPayments = async (req: Request, res: Response) => {
    const { amount, userIds, dueDate, type } = req.body;

    if (!amount || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const newPayments = userIds.map((userId: string) => ({
            amount,
            userId,
            dueDate,
            status: PaymentStatus.Pending,
            type,
        }));

        await Payment.insertMany(newPayments);
        return res.status(201).json({ payments: newPayments });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// GET /payment/get-payments/:userId - Get payments for a specific user
export const getPayments = async (req: Request, res: Response) => {
    try {
        const payments = await Payment.find({ userId: req.params.userId }).lean();
        return res.status(200).json(payments);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /payment/update-payment/:id - Update payment by ID
export const updatePayment = async (req: Request, res: Response) => {
    const { _id, ...updateData } = req.body;

    try {
        const payment = await Payment.findById(_id);
        if (!payment) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        // Update fields
        Object.assign(payment, updateData);

        await payment.save();

        return res.status(200).json(payment);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    } 
};

// DELETE /payment/delete-payment/:id - Delete payment by ID
export const deletePayment = async (req: Request, res: Response) => {
    try {
        const payment = await Payment.findById(req.params._id);
        if (!payment) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        await Payment.deleteOne({ _id: req.params._id });
        return res.status(200).json({ message: 'Payment deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};