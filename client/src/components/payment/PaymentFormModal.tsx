import { useMemo, useState } from 'react';
import { Alert, Button, Group, Modal, MultiSelect, NumberInput, SegmentedControl, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconCalendar, IconInfoCircle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { Payment, PaymentStatus, PaymentType } from '@/types/Payment';
import type { Squad } from '@/types/Squad';
import type { User } from '@/types/User';
import { createPayments, getSquads, getUsers, updatePayment } from '@/utils/api';
import { PaymentStatus as PaymentStatusConst, PaymentType as PaymentTypeConst } from '@/utils/const';
import { getFullName, showErrorNotification, showSuccessNotification } from '@/utils/helpers';
import { formatAmount } from '@/utils/payments';
import { useAsyncData } from '@/hooks/useAsyncData';

const DESCRIPTION_MAX_LENGTH = 120;

// Stable empty lists - a new [] on every render would re-run the memos below
const NO_USERS: User[] = [];
const NO_SQUADS: Squad[] = [];

interface IPaymentFormModal {
    opened: boolean;
    // Payment to edit; null creates new payments
    payment: Payment | null;
    onClose: () => void;
    onSaved: () => void;
}

const activePlayerIds = (squad: Squad) =>
    (squad.memberships ?? [])
        .filter((m) => m.active !== false && m.roles?.includes('player') && m.user?._id)
        .map((m) => m.user._id);

// Create payments for whole squads and/or members, or edit one payment.
// The parent remounts the component (key) for every opening, so the form always starts fresh.
const PaymentFormModal = ({ opened, payment, onClose, onSaved }: IPaymentFormModal) => {
    const isEdit = Boolean(payment?._id);
    const [isSaving, setIsSaving] = useState(false);

    const { data, loading } = useAsyncData(
        async () => (isEdit ? { users: [], squads: [] } : { users: await getUsers(), squads: await getSquads() }),
        [isEdit]
    );
    const users = data?.users ?? NO_USERS;
    const squads = data?.squads ?? NO_SQUADS;

    const form = useForm({
        initialValues: {
            squadIds: [] as string[],
            userIds: [] as string[],
            description: payment?.description ?? '',
            type: (payment?.type ?? PaymentTypeConst.MEMBERSHIP.value) as PaymentType,
            amount: payment?.amount ?? ('' as number | ''),
            dueDate: payment?.dueDate ? dayjs(payment.dueDate).format('YYYY-MM-DD') : dayjs().add(14, 'day').format('YYYY-MM-DD'),
            status: (payment?.status ?? PaymentStatusConst.PENDING.value) as PaymentStatus,
        },
        validate: {
            amount: (value) => (Number(value) > 0 ? null : 'Zadejte částku větší než 0'),
            dueDate: (value) => (value ? null : 'Vyberte datum splatnosti'),
            description: (value) => (value.length > DESCRIPTION_MAX_LENGTH ? `Nejvýše ${DESCRIPTION_MAX_LENGTH} znaků` : null),
            userIds: (value, values) =>
                isEdit || value.length > 0 || values.squadIds.length > 0 ? null : 'Vyberte alespoň jeden celek nebo člena',
        },
    });

    // Members grouped by their player squad for the searchable select
    const memberOptions = useMemo(() => {
        const squadByUser = new Map<string, string>();
        for (const squad of squads) {
            for (const userId of activePlayerIds(squad)) squadByUser.set(userId, squad.name ?? '');
        }

        const groups = new Map<string, { value: string; label: string }[]>();
        for (const user of users) {
            const group = squadByUser.get(user._id) ?? 'Ostatní';
            groups.set(group, [...(groups.get(group) ?? []), { value: user._id, label: getFullName(user) }]);
        }

        return [...groups]
            .sort(([a], [b]) => (a === 'Ostatní' ? 1 : b === 'Ostatní' ? -1 : a.localeCompare(b, 'cs')))
            .map(([group, items]) => ({ group, items: items.sort((a, b) => a.label.localeCompare(b.label, 'cs')) }));
    }, [users, squads]);

    // Number of members who will get the payment (players of squads + individuals, without duplicates)
    const recipientCount = useMemo(() => {
        const ids = new Set(form.values.userIds);
        for (const squad of squads.filter((s) => form.values.squadIds.includes(s._id))) {
            for (const userId of activePlayerIds(squad)) ids.add(userId);
        }
        return ids.size;
    }, [form.values.userIds, form.values.squadIds, squads]);

    const handleSubmit = form.onSubmit(async (values) => {
        setIsSaving(true);
        try {
            const common = {
                amount: Number(values.amount),
                type: values.type,
                dueDate: values.dueDate,
                description: values.description.trim(),
            };

            if (isEdit) {
                await updatePayment(payment._id, { ...common, status: values.status });
                showSuccessNotification('Platba byla uložena');
            } else {
                const created = await createPayments({ ...common, userIds: values.userIds, squadIds: values.squadIds });
                showSuccessNotification(created.length === 1 ? 'Platba byla vytvořena' : `Vytvořeno ${created.length} plateb`);
            }

            onSaved();
            onClose();
        } catch (error) {
            showErrorNotification((error as Error)?.message || 'Platbu se nepodařilo uložit');
        } finally {
            setIsSaving(false);
        }
    });

    const paymentUser = payment?.user && typeof payment.user === 'object' ? payment.user : null;

    return (
        <Modal opened={opened} onClose={onClose} title={isEdit ? 'Upravit platbu' : 'Nová platba'} size="lg">
            <form onSubmit={handleSubmit}>
                <Stack gap="md">
                    {isEdit ? (
                        paymentUser && (
                            <Text size="sm">
                                Člen: <Text span fw={600}>{getFullName(paymentUser)}</Text>
                            </Text>
                        )
                    ) : (
                        <>
                            <MultiSelect
                                label="Celé celky"
                                description="Platba se vytvoří každému hráči vybraných celků"
                                placeholder={loading ? 'Načítání…' : 'Vyberte celky'}
                                data={squads.map((squad) => ({ value: squad._id, label: `${squad.name} (${activePlayerIds(squad).length})` }))}
                                disabled={loading}
                                searchable
                                clearable
                                // Enter picks the first match instead of submitting the form
                                selectFirstOptionOnChange
                                {...form.getInputProps('squadIds')}
                            />
                            <MultiSelect
                                label="Jednotliví členové"
                                placeholder={loading ? 'Načítání…' : 'Hledat podle jména'}
                                data={memberOptions}
                                disabled={loading}
                                searchable
                                clearable
                                // Enter picks the first match instead of submitting the form
                                selectFirstOptionOnChange
                                nothingFoundMessage="Nikdo nenalezen"
                                maxDropdownHeight={260}
                                {...form.getInputProps('userIds')}
                            />
                        </>
                    )}

                    <TextInput
                        label="Popis"
                        placeholder="Např. Členský příspěvek jaro 2027"
                        maxLength={DESCRIPTION_MAX_LENGTH}
                        {...form.getInputProps('description')}
                    />

                    <Stack gap={4}>
                        <Text size="sm" fw={500}>Typ</Text>
                        <SegmentedControl
                            fullWidth
                            data={Object.values(PaymentTypeConst).map((type) => ({ value: type.value, label: type.label }))}
                            {...form.getInputProps('type')}
                        />
                    </Stack>

                    <SimpleGrid cols={{ base: 1, sm: isEdit ? 3 : 2 }}>
                        <NumberInput
                            label="Částka"
                            placeholder="2500"
                            min={1}
                            suffix=" Kč"
                            thousandSeparator=" "
                            allowDecimal={false}
                            {...form.getInputProps('amount')}
                        />
                        <DatePickerInput
                            label="Splatnost"
                            valueFormat="D. M. YYYY"
                            leftSection={<IconCalendar size={16} />}
                            {...form.getInputProps('dueDate')}
                        />
                        {isEdit && (
                            <Select
                                label="Stav"
                                data={Object.values(PaymentStatusConst).map((status) => ({ value: status.value, label: status.label }))}
                                allowDeselect={false}
                                {...form.getInputProps('status')}
                            />
                        )}
                    </SimpleGrid>

                    {!isEdit && recipientCount > 0 && Number(form.values.amount) > 0 && (
                        <Alert variant="light" color="brand" icon={<IconInfoCircle size={18} />}>
                            Vytvoří se {recipientCount} {recipientCount === 1 ? 'platba' : recipientCount < 5 ? 'platby' : 'plateb'} po{' '}
                            {formatAmount(Number(form.values.amount))}, celkem {formatAmount(recipientCount * Number(form.values.amount))}.
                            Členové dostanou upozornění.
                        </Alert>
                    )}

                    <Group justify="flex-end" gap="sm">
                        <Button variant="default" onClick={onClose} disabled={isSaving}>
                            Zrušit
                        </Button>
                        <Button type="submit" loading={isSaving}>
                            {isEdit ? 'Uložit' : 'Vytvořit platbu'}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default PaymentFormModal;
