import type { Payment } from '@/types/Payment';
import { Paper } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export const paymentsMock: Payment[] = [
    {
        id: 'contrib-2026-02',
        amount: 500,
        status: 'pending',
        dueDate: new Date('2026-02-25'),
    },
    {
        id: 'fine-2026-01-late',
        amount: 150,
        status: 'completed',
        dueDate: new Date('2026-01-20'),
    },
    {
        id: 'contrib-2026-03',
        amount: 500,
        status: 'failed',
        dueDate: new Date('2026-03-05'),
    },
];

const buildSpayd = (payment: Payment) => {
  const amount = (payment.amount ?? 0).toFixed(2);
  const dueDate = payment.dueDate
    ? payment.dueDate.toISOString().slice(0, 10).replace(/-/g, '')
    : undefined;

  const parts = [
    'SPD*1.0',
    `ACC:${QR_IBAN}`,
    `AM:${amount}`,
    'CC:CZK',
    QR_BIC ? `BIC:${QR_BIC}` : '',
    dueDate ? `DT:${dueDate}` : '',
    `MSG:${QR_MESSAGE_PREFIX} ${payment.id ?? ''}`,
  ];

  return parts.filter(Boolean).join('*');
};

const QR_IBAN = 'CZ6508000000192000145399';
const QR_BIC = 'GIBACZPX';
const QR_MESSAGE_PREFIX = 'Prispevek';

const UserPayments = () => {
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      const entries = await Promise.all(
        paymentsMock.map(async (payment) => {
          const spayd = buildSpayd(payment);
          const url = await QRCode.toDataURL(spayd, { width: 160, margin: 1 });
          return [payment.id ?? '', url] as const;
        })
      );

      if (!cancelled) {
        setQrMap(Object.fromEntries(entries));
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <h2>Moje platby</h2>
      <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
        {paymentsMock.map((payment) => (
          <Paper
            key={payment.id}
            withBorder
            radius="md"
            p="md"
            bg="light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ padding: '10px', borderBottom: '1px solid #eee', flex: 1 }}>
                <p><strong>Částka:</strong> {payment.amount} Kč</p>
                <p><strong>Status:</strong> {payment.status}</p>
                <p><strong>Datum splatnosti:</strong> {payment.dueDate?.toLocaleDateString()}</p>
              </div>

              {payment.status === 'pending' && payment.id && qrMap[payment.id] && (
                <img
                  src={qrMap[payment.id]}
                  alt="QR platba"
                  style={{ width: 140, height: 140 }}
                />
              )}
            </div>
          </Paper>
        ))}
      </div>
    </>
  );
};

export default UserPayments;