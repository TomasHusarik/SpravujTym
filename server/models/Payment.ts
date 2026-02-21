import { Types } from "mongoose";

export interface IPayment { 
    id?: Types.ObjectId;
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