import PaymentUsersDrawer from '@/components/drawers/PaymentUsersDrawer';
import type { User } from '@/types/User';
import { addPayments } from '@/utils/api';
import { PaymentStatus as PaymentStatusConst, PaymentType as PaymentTypeConst } from '@/utils/const';
import { getFullName, showErrorNotification, showSuccessNotification } from '@/utils/helpers';
import { ActionIcon, Button, Divider, Group, NumberInput, Paper, Select, SimpleGrid, Stack, Text, Textarea, Title, Tooltip } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconCalendar, IconCash, IconDeviceFloppy, IconReceipt2, IconRosetteDiscountCheck, IconUser, IconUserPlus } from '@tabler/icons-react';
import { useState } from 'react';


const Payment = () => {

    const [isSaving, setIsSaving] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    const form = useForm({
        initialValues: {
            userIds: [],
            amount: null,
            status: PaymentStatusConst.PENDING.value,
            dueDate: null,
            type: PaymentTypeConst.MEMBERSHIP.value,
        },
        validate: {
            userIds: (value: string[]) => (value.length > 0 ? null : 'Vyberte alespoň jednoho uživatele'),
            amount: (value: number | undefined) => (value && value > 0 ? null : 'Částka musí být větší než 0'),
            status: (value: string) => (value ? null : 'Status je povinný'),
            dueDate: (value: Date | null) => (value ? null : 'Datum splatnosti je povinné'),
            type: (value: string) => (value ? null : 'Typ platby je povinný'),
        },
    });

    const handleUserChange = (users: User[]) => {
        setSelectedUsers(users);
        form.setFieldValue('userIds', users.map((user) => user._id));
    };

    const handleSave = form.onSubmit(async (values) => {
        if (!values.dueDate || !values.amount || selectedUsers.length === 0) {
            form.setFieldError('userId', 'Vyberte alespoň jednoho uživatele');
            return;
        }

        try {
            setIsSaving(true);

            const payload = {
                ...values,
                userIds: selectedUsers.map((user) => user._id),

            };

            await addPayments(payload);


            showSuccessNotification('Platba byla úspěšně vytvořena');
            form.reset();
            setSelectedUsers([]);
        } catch {
            showErrorNotification('Nepodařilo se vytvořit platbu');
        } finally {
            setIsSaving(false);
        }
    });
    return (
        <>
            <form onSubmit={handleSave}>
                <Paper withBorder radius="lg" p="lg">
                    <Stack gap="lg">
                        <Group justify="space-between" align="flex-end">
                            <div>
                                <Title order={2}>Nová platba</Title>
                                <Text size="sm" c="dimmed">Vyplňte informace pro vytvoření nové platby</Text>
                            </div>
                        </Group>

                        <Divider />

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            <Textarea
                                label="Uživatel"
                                placeholder="Vyberte uživatele"
                                leftSection={<IconUser size={16} />}
                                radius="md"
                                required
                                readOnly
                                value={selectedUsers.map((usr) => getFullName(usr)).join(", \n")}
                                error={form.errors.userId}
                                rightSection={
                                    <Tooltip label="Vybrat uživatele" withArrow>
                                        <ActionIcon size={32} radius="xl" variant="subtle" onClick={() => setIsDrawerOpen(true)} >
                                            <IconUserPlus stroke={1.5} />
                                        </ActionIcon>
                                    </Tooltip>
                                }

                            />

                            <NumberInput
                                label="Částka"
                                placeholder="Např. 1500"
                                leftSection={<IconCash size={16} />}
                                radius="md"
                                min={1}
                                required
                                value={form.values.amount}
                                onChange={(value) => form.setFieldValue('amount', typeof value === 'number' ? value : undefined)}
                                error={form.errors.amount}
                            />
                        </SimpleGrid>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            <Select
                                label="Typ platby"
                                placeholder="Vyberte typ"
                                leftSection={<IconReceipt2 size={16} />}
                                radius="md"
                                required
                                data={Object.values(PaymentTypeConst).map((type) => ({ value: type.value, label: type.label }))}
                                value={form.values.type}
                                onChange={(value) => form.setFieldValue('type', value || '')}
                                error={form.errors.type}
                            />

                            <Select
                                label="Status"
                                placeholder="Vyberte status"
                                leftSection={<IconRosetteDiscountCheck size={16} />}
                                radius="md"
                                required
                                data={Object.values(PaymentStatusConst).map((status) => ({ value: status.value, label: status.label }))}
                                value={form.values.status}
                                onChange={(value) => form.setFieldValue('status', value || '')}
                                error={form.errors.status}
                            />
                        </SimpleGrid>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            <DatePickerInput
                                label="Datum splatnosti"
                                placeholder="Vyberte datum"
                                leftSection={<IconCalendar size={16} />}
                                radius="md"
                                required
                                value={form.values.dueDate}
                                onChange={(date) => form.setFieldValue('dueDate', date ? new Date(date) : null)}
                                error={form.errors.dueDate}
                            />
                        </SimpleGrid>

                        <Group justify="flex-end">
                            <Button
                                type="submit"
                                variant="light"
                                radius="md"
                                loading={isSaving}
                                leftSection={<IconDeviceFloppy stroke={1.5} size={20} />}
                            >
                                Uložit
                            </Button>
                        </Group>
                    </Stack>
                </Paper>
            </form>

            <PaymentUsersDrawer
                isDrawerOpen={isDrawerOpen}
                setIsDrawerOpen={setIsDrawerOpen}
                selectedUsers={selectedUsers}
                onSave={handleUserChange}
            />
        </>
    )
}

export default Payment