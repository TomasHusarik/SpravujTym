import mongoose, { Types } from "mongoose";

export interface IPayment {
    _id?: Types.ObjectId;
    user?: Types.ObjectId;
    amount?: number;
    status?: PaymentStatus;
    dueDate?: Date;
    type?: PaymentType;
    // e.g. "Členský příspěvek podzim 2026"
    description?: string;
    paidAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export enum PaymentStatus {
    Pending = "pending",
    Completed = "completed",
    Failed = "failed"
}

export enum PaymentType {
    Membership = "membership",
    Fines = "fines",
    Other = "other"
}

export const PAYMENT_DESCRIPTION_MAX_LENGTH = 120;

const paymentSchema = new mongoose.Schema<IPayment>({
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.Pending, required: true },
    dueDate: { type: Date, required: true },
    type: { type: String, enum: Object.values(PaymentType), required: true },
    description: { type: String, trim: true, maxlength: PAYMENT_DESCRIPTION_MAX_LENGTH },
    paidAt: { type: Date },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true,
    versionKey: false
});

paymentSchema.index({ user: 1, dueDate: -1 });
paymentSchema.index({ status: 1, dueDate: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
