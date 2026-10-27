import dayjs from 'dayjs';
import type { Payment } from '@/types/Payment';
import type { Team } from '@/types/Team';
import { PaymentStatus, PaymentType } from './const';

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
    [PaymentStatus.COMPLETED.value]: 'green',
    [PaymentStatus.FAILED.value]: 'red',
    [PaymentStatus.PENDING.value]: 'yellow',
};

export const getPaymentStatusLabel = (status?: string) =>
    Object.values(PaymentStatus).find((item) => item.value === status)?.label ?? PaymentStatus.PENDING.label;

export const getPaymentTypeLabel = (type?: string) =>
    Object.values(PaymentType).find((item) => item.value === type)?.label ?? 'Platba';

// Title of a payment shown to people: own description or the type
export const getPaymentTitle = (payment: Payment) => payment.description || getPaymentTypeLabel(payment.type);

export const formatAmount = (amount: number | undefined, currency = 'CZK') =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount ?? 0);

export const isPaymentOverdue = (payment: Payment) =>
    payment.status === PaymentStatus.PENDING.value &&
    Boolean(payment.dueDate) &&
    dayjs(payment.dueDate).isBefore(dayjs(), 'day');

// Numeric variable symbol (max. 10 digits) derived from the payment id - the same in the QR code and in the text
export const getVariableSymbol = (paymentId?: string) =>
    paymentId ? String(parseInt(paymentId.slice(-8), 16)) : '';

// Czech QR payment standard (SPAYD); null when the club has no account
export const buildSpayd = (payment: Payment, team?: Team | null) => {
    if (!team?.iban) return null;

    const message = `${getPaymentTitle(payment)} ${team.shortName ?? ''}`
        .trim()
        .replace(/\*/g, ' ')
        .slice(0, 60);

    return [
        'SPD*1.0',
        `ACC:${team.iban.replace(/\s/g, '')}`,
        `AM:${(payment.amount ?? 0).toFixed(2)}`,
        `CC:${team.currency || 'CZK'}`,
        payment.dueDate ? `DT:${dayjs(payment.dueDate).format('YYYYMMDD')}` : '',
        `X-VS:${getVariableSymbol(payment._id)}`,
        `MSG:${message}`,
    ].filter(Boolean).join('*');
};

// "CZ65 0800 0000 1920 0014 5399"
export const formatIban = (iban?: string) => (iban ?? '').replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
