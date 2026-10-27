import { Request, Response } from "express";
import mongoose from "mongoose";
import Payment, { PAYMENT_DESCRIPTION_MAX_LENGTH, PaymentStatus, PaymentType } from "@models/Payment";
import ErrorMessages from "@utils/errorMessages";
import { getSquadPlayerIds } from "../services/eventSeries.service";
import { notifyPaymentsCreated, safely } from "../services/notification.service";

const USER_FIELDS = 'firstName lastName email imageUrl';

// Returns an error message or null
const validatePaymentFields = (data: { amount?: unknown; type?: unknown; status?: unknown; dueDate?: unknown; description?: unknown }, partial = false) => {
    const has = (value: unknown) => value !== undefined;

    if ((!partial || has(data.amount)) && !(Number(data.amount) > 0)) return 'Amount must be greater than 0';
    if ((!partial || has(data.type)) && !Object.values(PaymentType).includes(data.type as PaymentType)) return 'Invalid payment type';
    if (has(data.status) && !Object.values(PaymentStatus).includes(data.status as PaymentStatus)) return 'Invalid payment status';
    if ((!partial || has(data.dueDate)) && Number.isNaN(new Date(data.dueDate as string).getTime())) return ErrorMessages.invalidDate;
    if (has(data.description) && String(data.description ?? '').length > PAYMENT_DESCRIPTION_MAX_LENGTH) return 'Description is too long';
    return null;
};

// POST /payment/add-payments - Create payments for users and/or whole squads
// body: userIds?, squadIds?, amount, type, dueDate, description?
export const createPayments = async (req: Request, res: Response) => {
    const { userIds = [], squadIds = [], amount, type, dueDate, description } = req.body;

    if (!Array.isArray(userIds) || !Array.isArray(squadIds)) {
        return res.status(400).json({ error: 'userIds and squadIds must be arrays' });
    }

    const validationError = validatePaymentFields({ amount, type, dueDate, description });
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const squadPlayerIds = await getSquadPlayerIds(squadIds.map(String));
        const recipients = [...new Set([...userIds.map(String), ...squadPlayerIds])]
            .filter((id) => mongoose.isValidObjectId(id));

        if (recipients.length === 0) {
            return res.status(400).json({ error: 'Select at least one member or squad' });
        }

        const payments = await Payment.insertMany(recipients.map((user) => ({
            user,
            amount: Number(amount),
            type,
            dueDate,
            description: description ? String(description).trim() : undefined,
            status: PaymentStatus.Pending,
        })));

        await safely(() => notifyPaymentsCreated(payments, req.loggedUser._id));

        return res.status(201).json(payments);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// GET /payment/get-all-payments?status=&type=&squadId= - All payments for the treasurer (admin)
export const getAllPayments = async (req: Request, res: Response) => {
    const { status, type, squadId } = req.query;
    const filter: Record<string, unknown> = {};

    if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) filter.status = status;
    if (type && Object.values(PaymentType).includes(type as PaymentType)) filter.type = type;

    try {
        if (squadId && mongoose.isValidObjectId(squadId)) {
            filter.user = { $in: await getSquadPlayerIds([String(squadId)]) };
        }

        const payments = await Payment.find(filter)
            .populate('user', USER_FIELDS)
            .sort({ dueDate: -1, createdAt: -1 })
            .lean();

        return res.status(200).json(payments);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// GET /payment/get-payment/:paymentId - Get payment by ID
export const getPayment = async (req: Request, res: Response) => {
    try {
        const payment = await Payment.findById(req.params.paymentId)
            .populate('user', USER_FIELDS)
            .lean();
        if (!payment) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        // Only the payment owner or an admin can see the payment
        const ownerId = String((payment.user as any)?._id ?? payment.user);
        if (!req.loggedUser.isAdmin && ownerId !== req.loggedUser._id.toString()) {
            return res.status(403).json({ error: ErrorMessages.forbidden });
        }

        return res.status(200).json(payment);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// GET /payment/get-payments/:userId - Get payments for a specific user
export const getPayments = async (req: Request, res: Response) => {
    try {
        const payments = await Payment.find({ user: req.params.userId }).sort({ dueDate: -1 }).lean();
        return res.status(200).json(payments);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// PUT /payment/update-payment/:id - Update payment by ID
export const updatePayment = async (req: Request, res: Response) => {
    const { amount, status, dueDate, type, description } = req.body;

    const validationError = validatePaymentFields({ amount, status, dueDate, type, description }, true);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        if (amount !== undefined) payment.amount = Number(amount);
        if (dueDate !== undefined) payment.dueDate = dueDate;
        if (type !== undefined) payment.type = type;
        if (description !== undefined) payment.description = description ? String(description).trim() : undefined;

        if (status !== undefined && status !== payment.status) {
            payment.status = status;
            // Remember when the payment was marked as paid
            payment.paidAt = status === PaymentStatus.Completed ? new Date() : undefined;
        }

        await payment.save();
        await payment.populate('user', USER_FIELDS);
        return res.status(200).json(payment);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};


// DELETE /payment/delete-payment/:id - Delete payment by ID
export const deletePayment = async (req: Request, res: Response) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }
        await payment.deleteOne();
        return res.status(200).json({ message: 'Payment deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};
