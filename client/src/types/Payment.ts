import type { User } from "./User";

export interface Payment {
    _id?: string;
    // Populated in the treasurer overview, plain id elsewhere
    user?: User | string;
    amount?: number;
    status?: PaymentStatus;
    dueDate?: Date;
    type?: PaymentType;
    // e.g. "Členský příspěvek podzim 2026"
    description?: string;
    paidAt?: Date;
    createdAt?: Date;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PaymentType = 'membership' | 'fines' | 'other';

export type PaymentInput = {
    userIds?: string[];
    squadIds?: string[];
    amount: number;
    type: PaymentType;
    dueDate: string;
    description?: string;
    status?: PaymentStatus;
};
