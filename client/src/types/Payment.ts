export interface Payment {
    _id?: string;
    userId?: string;
    amount?: number;
    status?: PaymentStatus;
    dueDate?: Date;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed';