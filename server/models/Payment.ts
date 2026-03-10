import mongoose, { Types } from "mongoose";

export interface IPayment { 
    _id?: Types.ObjectId;
    user?: Types.ObjectId;
    amount?: number;
    status?: PaymentStatus;
    dueDate?: Date;
    type?: PaymentType;
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

const paymentSchema = new mongoose.Schema<IPayment>({
    amount: { type: Number, required: true },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.Pending, required: true },
    dueDate: { type: Date, required: true },
    type: { type: String, enum: Object.values(PaymentType), required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true,
    versionKey: false
});

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;