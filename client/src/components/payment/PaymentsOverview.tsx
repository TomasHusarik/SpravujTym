import { useMemo, useState } from 'react';
import {
    ActionIcon, Avatar, Badge, Box, Button, Card, Group, Menu, SegmentedControl, Select, SimpleGrid, Stack, Table, Text, TextInput, Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
    IconAlertTriangle, IconCash, IconCheck, IconDotsVertical, IconEdit, IconPlus, IconReceiptOff, IconRotate, IconSearch, IconTrash,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import type { Payment } from '@/types/Payment';
import type { Squad } from '@/types/Squad';
import type { User } from '@/types/User';
import { deletePayment, getAllPayments, getSquads, updatePayment } from '@/utils/api';
import { PaymentStatus, PaymentType } from '@/utils/const';
import { formatDate, getFullName, matchesSearch, showErrorNotification, showSuccessNotification } from '@/utils/helpers';
import {
    PAYMENT_STATUS_COLORS, formatAmount, getPaymentStatusLabel, getPaymentTitle, getPaymentTypeLabel, isPaymentOverdue,
} from '@/utils/payments';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useConfirm } from '@/hooks/useConfirm';
import { useApp } from '@/context/AppContext';
import PageHeader from '../ui/PageHeader';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/StateViews';
import PaymentFormModal from './PaymentFormModal';

type StatusFilter = 'all' | 'pending' | 'overdue' | 'completed';

const PAGE_SIZE = 50;

const paymentUser = (payment: Payment) => (payment.user && typeof payment.user === 'object' ? payment.user as User : null);

const matchesStatus = (payment: Payment, filter: StatusFilter) => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return isPaymentOverdue(payment);
    if (filter === 'pending') return payment.status === PaymentStatus.PENDING.value;
    return payment.status === PaymentStatus.COMPLETED.value;
};

const StatCard = ({ label, amount, count, color, icon, currency }: { label: string; amount: number; count: number; color: string; icon: React.ReactNode; currency: string }) => (
    <Card p={{ base: 'xs', sm: 'md' }}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={2} style={{ minWidth: 0 }}>
                <Text fz={{ base: 10, sm: 'xs' }} tt="uppercase" fw={700} c="dimmed">{label}</Text>
                <Text fw={800} fz={{ base: 'sm', xs: 'lg', sm: 24 }} c={color} style={{ whiteSpace: 'nowrap' }}>
                    {formatAmount(amount, currency)}
                </Text>
                <Text fz={{ base: 10, sm: 'xs' }} c="dimmed">{count} {count === 1 ? 'platba' : count >= 2 && count <= 4 ? 'platby' : 'plateb'}</Text>
            </Stack>
            <Box visibleFrom="sm">{icon}</Box>
        </Group>
    </Card>
);

// Treasurer overview of all payments (admin)
const PaymentsOverview = () => {
    const navigate = useNavigate();
    const { team } = useApp();
    const currency = team?.currency || 'CZK';
    const { confirm, confirmDialog } = useConfirm();

    const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
    const [squadId, setSquadId] = useState<string | null>(null);
    const [type, setType] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebouncedValue(search, 150);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [form, setForm] = useState<{ key: number; payment: Payment | null } | null>(null);

    const { data: squads = [] } = useAsyncData<Squad[]>(getSquads);
    const { data: payments = [], loading, error, reload, setData } = useAsyncData<Payment[]>(
        () => getAllPayments({ squadId: squadId ?? undefined, type: type ?? undefined }),
        [squadId, type]
    );

    // Payments matching squad, type and search - the base for the totals
    const searched = useMemo(() => {
        if (!debouncedSearch.trim()) return payments;
        return payments.filter((payment) => {
            const user = paymentUser(payment);
            return matchesSearch(`${getFullName(user)} ${user?.email ?? ''} ${getPaymentTitle(payment)}`, debouncedSearch);
        });
    }, [payments, debouncedSearch]);

    const totals = useMemo(() => {
        const sum = (items: Payment[]) => items.reduce((total, payment) => total + (payment.amount ?? 0), 0);
        const pending = searched.filter((p) => p.status === PaymentStatus.PENDING.value);
        const overdue = pending.filter(isPaymentOverdue);
        const completed = searched.filter((p) => p.status === PaymentStatus.COMPLETED.value);
        return {
            pending: { amount: sum(pending), count: pending.length },
            overdue: { amount: sum(overdue), count: overdue.length },
            completed: { amount: sum(completed), count: completed.length },
        };
    }, [searched]);

    const filtered = useMemo(() => searched
        .filter((payment) => matchesStatus(payment, statusFilter))
        .sort((a, b) => {
            // Unpaid: the oldest due date first; paid: the newest first
            const difference = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            return statusFilter === 'completed' ? -difference : difference;
        }), [searched, statusFilter]);

    const visible = filtered.slice(0, visibleCount);

    const replacePayment = (updated: Payment) =>
        setData((current = []) => current.map((payment) => (payment._id === updated._id ? updated : payment)));

    const setStatus = async (payment: Payment, status: Payment['status']) => {
        try {
            replacePayment(await updatePayment(payment._id, { status }));
            showSuccessNotification(status === 'completed' ? 'Platba označena jako zaplacená' : 'Platba vrácena mezi nezaplacené');
        } catch {
            showErrorNotification('Stav platby se nepodařilo změnit');
        }
    };

    const handleDelete = async (payment: Payment) => {
        const confirmed = await confirm({
            title: 'Smazat platbu?',
            message: `${getPaymentTitle(payment)} – ${formatAmount(payment.amount, currency)} (${getFullName(paymentUser(payment))}) bude trvale odstraněna.`,
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

    // Overdue payments show only the red badge
    const statusBadges = (payment: Payment) => isPaymentOverdue(payment)
        ? <Badge variant="filled" color="red">Po splatnosti</Badge>
        : <Badge variant="light" color={PAYMENT_STATUS_COLORS[payment.status] ?? 'gray'}>{getPaymentStatusLabel(payment.status)}</Badge>;

    const actions = (payment: Payment) => (
        <Group gap={4} wrap="nowrap" justify="flex-end">
            {payment.status !== PaymentStatus.COMPLETED.value && (
                <Tooltip label="Označit jako zaplacené">
                    <Button size="compact-sm" variant="light" color="green" leftSection={<IconCheck size={14} />} onClick={() => setStatus(payment, 'completed')}>
                        Potvrdit úhradu
                    </Button>
                </Tooltip>
            )}
            <Menu position="bottom-end" withinPortal>
                <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" aria-label="Další akce">
                        <IconDotsVertical size={16} />
                    </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => setForm({ key: Date.now(), payment })}>
                        Upravit
                    </Menu.Item>
                    {payment.status === PaymentStatus.COMPLETED.value && (
                        <Menu.Item leftSection={<IconRotate size={14} />} onClick={() => setStatus(payment, 'pending')}>
                            Vrátit mezi nezaplacené
                        </Menu.Item>
                    )}
                    <Menu.Divider />
                    <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(payment)}>
                        Smazat
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </Group>
    );

    const renderList = () => {
        if (loading) return <ListSkeleton rows={6} height={56} />;
        if (error) return <ErrorState message={error} onRetry={reload} />;
        if (filtered.length === 0) {
            return (
                <EmptyState
                    icon={<IconReceiptOff size={24} />}
                    title={payments.length === 0 ? 'Zatím žádné platby' : 'Žádné platby neodpovídají filtru'}
                    description={payments.length === 0 ? 'Předepište první platbu tlačítkem „Nová platba“.' : 'Zkuste změnit filtr nebo hledaný text.'}
                />
            );
        }

        return (
            <>
                {/* DESKTOP TABLE */}
                <Card padding={0} visibleFrom="md">
                    <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Člen</Table.Th>
                                <Table.Th>Platba</Table.Th>
                                <Table.Th ta="right">Částka</Table.Th>
                                <Table.Th>Splatnost</Table.Th>
                                <Table.Th miw={130}>Stav</Table.Th>
                                <Table.Th />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {visible.map((payment) => {
                                const user = paymentUser(payment);
                                return (
                                    <Table.Tr key={payment._id}>
                                        <Table.Td>
                                            <Group gap="sm" wrap="nowrap" style={{ cursor: user ? 'pointer' : undefined }} onClick={() => user && navigate(`/user/${user._id}`)}>
                                                <Avatar size="sm" radius="xl" color="initials" name={getFullName(user)} src={user?.imageUrl} />
                                                <Text size="sm" fw={500}>{getFullName(user)}</Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{getPaymentTitle(payment)}</Text>
                                            {payment.description && <Text size="xs" c="dimmed">{getPaymentTypeLabel(payment.type)}</Text>}
                                        </Table.Td>
                                        <Table.Td ta="right"><Text size="sm" fw={700}>{formatAmount(payment.amount, currency)}</Text></Table.Td>
                                        <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                            <Text size="sm">{payment.dueDate ? formatDate(payment.dueDate) : '–'}</Text>
                                            {payment.paidAt && <Text size="xs" c="dimmed">zaplaceno {formatDate(payment.paidAt)}</Text>}
                                        </Table.Td>
                                        <Table.Td miw={130}>{statusBadges(payment)}</Table.Td>
                                        <Table.Td>{actions(payment)}</Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Card>

                {/* MOBILE / TABLET CARDS */}
                <Stack gap="xs" hiddenFrom="md">
                    {visible.map((payment) => {
                        const user = paymentUser(payment);
                        return (
                            <Card key={payment._id} padding="sm">
                                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                                    <Group gap="sm" wrap="nowrap" align="flex-start" style={{ minWidth: 0 }}>
                                        <Avatar radius="xl" color="initials" name={getFullName(user)} src={user?.imageUrl} />
                                        <Stack gap={2} style={{ minWidth: 0 }}>
                                            <Text size="sm" fw={600} truncate>{getFullName(user)}</Text>
                                            <Text size="xs" c="dimmed" truncate>{getPaymentTitle(payment)}</Text>
                                            <Text size="xs" c="dimmed">Splatnost {payment.dueDate ? formatDate(payment.dueDate) : '–'}</Text>
                                        </Stack>
                                    </Group>
                                    <Text fw={800} style={{ whiteSpace: 'nowrap' }}>{formatAmount(payment.amount, currency)}</Text>
                                </Group>
                                <Group justify="space-between" mt="xs" wrap="nowrap">
                                    {statusBadges(payment)}
                                    {actions(payment)}
                                </Group>
                            </Card>
                        );
                    })}
                </Stack>

                {filtered.length > visibleCount && (
                    <Group justify="center">
                        <Button variant="subtle" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                            Zobrazit další ({filtered.length - visibleCount})
                        </Button>
                    </Group>
                )}
            </>
        );
    };

    return (
        <>
            <PageHeader
                title="Platby"
                description="Příspěvky, pokuty a další platby členů."
                actions={
                    <Button leftSection={<IconPlus size={16} />} onClick={() => setForm({ key: Date.now(), payment: null })}>
                        Nová platba
                    </Button>
                }
            />

            <Stack gap="md">
                <SimpleGrid cols={3} spacing={{ base: 'xs', sm: 'md' }}>
                    <StatCard label="K vybrání" amount={totals.pending.amount} count={totals.pending.count} color="accent.7" currency={currency}
                        icon={<IconCash size={28} color="var(--mantine-color-accent-6)" />} />
                    <StatCard label="Po splatnosti" amount={totals.overdue.amount} count={totals.overdue.count} color="red.7" currency={currency}
                        icon={<IconAlertTriangle size={28} color="var(--mantine-color-red-6)" />} />
                    <StatCard label="Vybráno" amount={totals.completed.amount} count={totals.completed.count} color="green.7" currency={currency}
                        icon={<IconCheck size={28} color="var(--mantine-color-green-6)" />} />
                </SimpleGrid>

                <Group gap="sm" wrap="wrap">
                    <SegmentedControl
                        value={statusFilter}
                        onChange={(value) => { setStatusFilter(value as StatusFilter); setVisibleCount(PAGE_SIZE); }}
                        data={[
                            { value: 'pending', label: 'Nezaplacené' },
                            { value: 'overdue', label: 'Po splatnosti' },
                            { value: 'completed', label: 'Zaplacené' },
                            { value: 'all', label: 'Vše' },
                        ]}
                    />
                    <TextInput
                        placeholder="Hledat člena nebo popis…"
                        aria-label="Hledat platby"
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        w={{ base: '100%', sm: 240 }}
                    />
                    <Select
                        placeholder="Všechny celky"
                        aria-label="Filtr celku"
                        data={squads.map((squad) => ({ value: squad._id, label: squad.name }))}
                        value={squadId}
                        onChange={setSquadId}
                        clearable
                        w={{ base: '100%', sm: 180 }}
                    />
                    <Select
                        placeholder="Všechny typy"
                        aria-label="Filtr typu"
                        data={Object.values(PaymentType).map((item) => ({ value: item.value, label: item.label }))}
                        value={type}
                        onChange={setType}
                        clearable
                        w={{ base: '100%', sm: 160 }}
                    />
                </Group>

                {renderList()}
            </Stack>

            {confirmDialog}

            {form && (
                <PaymentFormModal
                    key={form.key}
                    opened
                    payment={form.payment}
                    onClose={() => setForm(null)}
                    onSaved={reload}
                />
            )}
        </>
    );
};

export default PaymentsOverview;
