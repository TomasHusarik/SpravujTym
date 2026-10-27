import { useMemo, useState } from 'react';
import { ActionIcon, Badge, Button, Card, Group, Menu, Stack, Text, Title } from '@mantine/core';
import { IconCheck, IconDotsVertical, IconEdit, IconQrcode, IconReceiptOff, IconRotate, IconTrash } from '@tabler/icons-react';
import type { Payment } from '@/types/Payment';
import { useApp } from '@/context/AppContext';
import { deletePayment, getPayments, updatePayment } from '@/utils/api';
import { PaymentStatus } from '@/utils/const';
import { formatDate, showErrorNotification, showSuccessNotification, useAdminPermissions } from '@/utils/helpers';
import {
  PAYMENT_STATUS_COLORS, formatAmount, getPaymentStatusLabel, getPaymentTitle, getPaymentTypeLabel, isPaymentOverdue,
} from '@/utils/payments';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useConfirm } from '@/hooks/useConfirm';
import { CardGridSkeleton, EmptyState, ErrorState } from '../ui/StateViews';
import PayModal from '../payment/PayModal';
import PaymentFormModal from '../payment/PaymentFormModal';

interface IUserPayments {
  userId: string;
}

const byDueDate = (a: Payment, b: Payment) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

const UserPayments = ({ userId }: IUserPayments) => {
  const { team } = useApp();
  const currency = team?.currency || 'CZK';
  const isAdmin = useAdminPermissions();
  const { confirm, confirmDialog } = useConfirm();

  const [paymentToPay, setPaymentToPay] = useState<Payment | null>(null);
  const [form, setForm] = useState<{ key: number; payment: Payment } | null>(null);

  const { data, loading, error, reload, setData } = useAsyncData<Payment[]>(() => getPayments(userId), [userId]);

  // Memoized from `data` so the lists keep their identity between renders
  const { unpaid, history, toPay } = useMemo(() => {
    const payments = data ?? [];
    const unpaidPayments = payments.filter((p) => p.status !== PaymentStatus.COMPLETED.value).sort(byDueDate);
    return {
      unpaid: unpaidPayments,
      history: payments.filter((p) => p.status === PaymentStatus.COMPLETED.value).sort((a, b) => byDueDate(b, a)),
      toPay: unpaidPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0),
    };
  }, [data]);

  const setStatus = async (payment: Payment, status: Payment['status']) => {
    try {
      const updated = await updatePayment(payment._id, { status });
      setData((current = []) => current.map((p) => (p._id === updated._id ? { ...updated, user: p.user } : p)));
      showSuccessNotification(status === 'completed' ? 'Platba označena jako zaplacená' : 'Platba vrácena mezi nezaplacené');
    } catch {
      showErrorNotification('Stav platby se nepodařilo změnit');
    }
  };

  const handleDelete = async (payment: Payment) => {
    const confirmed = await confirm({
      title: 'Smazat platbu?',
      message: `${getPaymentTitle(payment)} – ${formatAmount(payment.amount, currency)} bude trvale odstraněna.`,
      confirmLabel: 'Smazat',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await deletePayment(payment._id);
      setData((current = []) => current.filter((p) => p._id !== payment._id));
      showSuccessNotification('Platba byla smazána');
    } catch {
      showErrorNotification('Platbu se nepodařilo smazat');
    }
  };

  if (loading) return <CardGridSkeleton cards={2} height={120} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const adminMenu = (payment: Payment) => isAdmin && (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" aria-label="Další akce">
          <IconDotsVertical size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {payment.status !== PaymentStatus.COMPLETED.value ? (
          <Menu.Item leftSection={<IconCheck size={14} />} onClick={() => setStatus(payment, 'completed')}>
            Označit jako zaplacené
          </Menu.Item>
        ) : (
          <Menu.Item leftSection={<IconRotate size={14} />} onClick={() => setStatus(payment, 'pending')}>
            Vrátit mezi nezaplacené
          </Menu.Item>
        )}
        <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => setForm({ key: Date.now(), payment })}>
          Upravit
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(payment)}>
          Smazat
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  const renderPayment = (payment: Payment) => {
    const isPaid = payment.status === PaymentStatus.COMPLETED.value;

    return (
      <Card key={payment._id} padding="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
            <Group gap="xs">
              <Text fw={700}>{getPaymentTitle(payment)}</Text>
              {isPaymentOverdue(payment)
                ? <Badge variant="filled" color="red">Po splatnosti</Badge>
                : <Badge variant="light" color={PAYMENT_STATUS_COLORS[payment.status] ?? 'gray'}>{getPaymentStatusLabel(payment.status)}</Badge>}
            </Group>
            <Text size="sm" c="dimmed">
              {payment.description ? `${getPaymentTypeLabel(payment.type)} · ` : ''}
              {isPaid && payment.paidAt ? `zaplaceno ${formatDate(payment.paidAt)}` : `splatnost ${payment.dueDate ? formatDate(payment.dueDate) : '–'}`}
            </Text>
          </Stack>

          <Group gap="sm" wrap="nowrap">
            <Text fw={800} fz="lg" style={{ whiteSpace: 'nowrap' }}>{formatAmount(payment.amount, currency)}</Text>
            {!isPaid && (
              <Button leftSection={<IconQrcode size={16} />} onClick={() => setPaymentToPay(payment)}>
                Zaplatit
              </Button>
            )}
            {adminMenu(payment)}
          </Group>
        </Group>
      </Card>
    );
  };

  return (
    <Stack gap="lg">
      {(data ?? []).length === 0 ? (
        <EmptyState icon={<IconReceiptOff size={24} />} title="Žádné platby" description="Zatím tu nejsou žádné předepsané platby." />
      ) : (
        <>
          <Card padding="md" style={{ borderLeft: `4px solid var(--mantine-color-${toPay > 0 ? 'accent' : 'green'}-6)` }}>
            <Group justify="space-between">
              <Stack gap={0}>
                <Text fw={600}>{toPay > 0 ? 'K úhradě celkem' : 'Vše je zaplaceno'}</Text>
                <Text size="xs" c="dimmed">{unpaid.length} nezaplacených plateb</Text>
              </Stack>
              <Text fw={800} fz={26} c={toPay > 0 ? 'accent.7' : 'green.7'}>{formatAmount(toPay, currency)}</Text>
            </Group>
          </Card>

          {unpaid.length > 0 && (
            <Stack gap="sm">
              <Title order={2} size="h4">Nezaplacené</Title>
              {unpaid.map(renderPayment)}
            </Stack>
          )}

          {history.length > 0 && (
            <Stack gap="sm">
              <Title order={2} size="h4">Zaplacené</Title>
              {history.map(renderPayment)}
            </Stack>
          )}
        </>
      )}

      <PayModal payment={paymentToPay} onClose={() => setPaymentToPay(null)} />
      {confirmDialog}
      {form && (
        <PaymentFormModal key={form.key} opened payment={form.payment} onClose={() => setForm(null)} onSaved={reload} />
      )}
    </Stack>
  );
};

export default UserPayments;
