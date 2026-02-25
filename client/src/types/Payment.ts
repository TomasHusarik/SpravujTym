export interface Payment {
    _id?: string;
    userId?: string;
    amount?: number;
    status?: PaymentStatus;
    dueDate?: Date;
    type?: PaymentType;

}

export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PaymentType = 'membership' | 'fines' | 'other';