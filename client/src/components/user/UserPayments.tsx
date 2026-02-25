import type { Payment } from '@/types/Payment';
import { Alert, Badge, Group, Image, Paper, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useApp } from '@/context/AppContext';
import { getPayments } from '@/utils/api';
import { PaymentStatus as PaymentStatusConst, PaymentType as PaymentTypeConst } from '@/utils/const';

interface IUserPayments {
  userId: string;
}

const UserPayments = ({ userId }: IUserPayments) => {
  const { team } = useApp();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  const getStatusColor = (status?: string) => {
    if (status === PaymentStatusConst.COMPLETED.value) return 'green';
    if (status === PaymentStatusConst.FAILED.value) return 'red';
    return 'yellow';
  };

  const getStatusLabel = (status?: string) => {
    if (status === PaymentStatusConst.COMPLETED.value) return PaymentStatusConst.COMPLETED.label;
    if (status === PaymentStatusConst.FAILED.value) return PaymentStatusConst.FAILED.label;
    return PaymentStatusConst.PENDING.label;
  };

  const buildSpayd = (payment: Payment) => {
    const amount = (payment.amount ?? 0).toFixed(2);
    const dueDate = payment.dueDate;
    const iban = team?.iban;

    const parts = [
      'SPD*1.0',
      iban ? `ACC:${iban}` : '',
      `AM:${amount}`,
      `CC:${team?.currency || 'CZK'}`,
      dueDate ? `DT:${dueDate}` : '',
      payment._id ? `MSG:Platba ${payment._id}` : '',
    ];

    return parts.filter(Boolean).join('*');
  };

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      if (!team?.iban) {
        setQrMap({});
        return;
      }

      const pendingPayments = payments.filter((payment) => payment.status === PaymentStatusConst.PENDING.value && payment._id);

      const entries = await Promise.all(
        pendingPayments.map(async (payment) => {
          const spayd = buildSpayd(payment);
          const url = await QRCode.toDataURL(spayd, { width: 160, margin: 1 });
          return [payment._id ?? '', url] as const;
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
  }, [payments, team?.iban, team?.currency]);


  const loadData = async () => {
    try {
      const pay = await getPayments(userId);
      setPayments(pay ?? []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  return (
    <Stack gap="md" mt="md">
      {!team?.iban && (
        <Alert color="yellow" variant="light" title="QR platba není dostupná">
          Tým nemá nastavený IBAN, proto nelze vygenerovat QR kód.
        </Alert>
      )}

      {payments.length === 0 && (
        <Paper withBorder radius="md" p="md" bg="light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))">
          <Text c="dimmed">Uživatel zatím nemá žádné platby.</Text>
        </Paper>
      )}

      {payments.map((payment) => {
        const parsedDueDate = payment.dueDate
        const paymentTypeLabel = Object.values(PaymentTypeConst).find((type) => type.value === payment.type)?.label ?? 'N/A';

        return (
          <Paper
            key={payment._id}
            withBorder
            radius="md"
            p="md"
            bg="light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"
          >
            <Group align="flex-start" justify="space-between" wrap="nowrap" gap="md">
              <Stack gap={4} flex={1}>
                <Group gap="xs">
                  <Text fw={700} fz="lg">{payment.amount ?? 0} Kč</Text>
                  <Badge color={getStatusColor(payment.status)} variant="light">
                    {getStatusLabel(payment.status)}
                  </Badge>
                </Group>

                <Text fz="sm" c="dimmed">
                  {paymentTypeLabel}
                </Text>

                <Text fz="sm" c="dimmed">
                  Splatnost: {parsedDueDate ? parsedDueDate.toLocaleDateString('cs-CZ') : 'N/A'}
                </Text>
              </Stack>

              {payment.status === PaymentStatusConst.PENDING.value && payment._id && qrMap[payment._id] && (
                <Image
                  src={qrMap[payment._id]}
                  alt="QR platba"
                  w={140}
                  h={140}
                  radius="md"
                />
              )}
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default UserPayments;