import { useAuth } from '@/context/AuthContext'
import type { User } from '@/types/User'
import { getUser, updateUser } from '@/utils/api'
import { UserRole, UserStatus } from '@/utils/const'
import { Button, Grid, MultiSelect, NumberInput, Select, TextInput, Title } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { IconAt, IconDeviceFloppy, IconPhone, IconUser } from '@tabler/icons-react'
import React, { useEffect, useState } from 'react'

interface IUserDetail {
    userId: string;
}

const UserDetail = (props: IUserDetail) => {
    const { userId } = props;

    const [isSaving, setIsSaving] = useState(false);

    const form = useForm({
        initialValues: {
            _id: undefined,
            firstName: '',
            lastName: '',
            email: '',
            mobile: '',
            roles: [],
            birthDate: null,
            active: false,
        },

        validate: {
            firstName: (val: string) => val.trim() === '' ? 'Jméno je povinné' : null,
            lastName: (val: string) => val.trim() === '' ? 'Příjmení je povinné' : null,
            email: (val: string) => /^\S+@\S+$/.test(val) ? null : 'Neplatný e-mail',
            birthDate: (val: Date) => val ? null : 'Datum narození je povinné',
            mobile: (val: string) => /^\+?[0-9\s\-()]+$/.test(val) ? null : 'Neplatné telefonní číslo',
            roles: (val: string[]) => val.length === 0 ? 'Alespoň jedna role je povinná' : null,
            active: (val: boolean) => typeof val === 'boolean' ? null : 'Stav je povinný',
        },
    });

    const handleSave = async (values: typeof form.values) => {
        try {
            setIsSaving(true);
            await updateUser(values);
        } catch (error) {
            console.error('Error saving user data:', error);
        } finally {
            setIsSaving(false);
            loadData();
        }
    };

    const loadData = async () => {
        try {
            const userData = await getUser(userId);
            form.setValues(userData);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <form onSubmit={form.onSubmit((values) => handleSave(values))}>

            <Grid>
                <Grid.Col span={{ base: 12, md: 12 }}>
                    <Title order={1} c="var(--mantine-color-blue-light-color)" mb="md">Detail uživatele</Title>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                        label="Jméno"
                        placeholder="Jméno"
                        leftSection={<IconUser size={16} />}
                        radius="md"
                        size="md"
                        value={form.values?.firstName || ''}
                        onChange={(value) => form.setFieldValue('firstName', value.currentTarget.value)}
                        error={form.errors.firstName}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                        label="Příjmení"
                        placeholder="Příjmení"
                        leftSection={<IconUser size={16} />}
                        radius="md"
                        size="md"
                        value={form.values?.lastName || ''}
                        onChange={(value) => form.setFieldValue('lastName', value.currentTarget.value)}
                        error={form.errors.lastName}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                        label="E-mail"
                        placeholder="E-mail"
                        leftSection={<IconAt size={16} />}
                        radius="md"
                        size="md"
                        name="email"
                        value={form.values?.email || ''}
                        onChange={(value) => form.setFieldValue('email', value.currentTarget.value)}
                        error={form.errors.email}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <DatePickerInput
                        label="Datum narození"
                        placeholder="Datum narození"
                        locale='cs'
                        leftSection={<IconUser size={16} />}
                        radius="md"
                        size="md"
                        name="age"
                        value={form.values?.birthDate || ''}
                        onChange={(value) => form.setFieldValue('birthDate', value)}
                        error={form.errors.birthDate}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                        label="Telefon"
                        placeholder="Telefon"
                        leftSection={<IconPhone size={16} />}
                        radius="md"
                        size="md"
                        name="mobile"
                        value={form.values?.mobile || ''}
                        onChange={(value) => form.setFieldValue('mobile', value.currentTarget.value)}
                        error={form.errors.mobile}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <MultiSelect
                        label="Role"
                        leftSection={<IconUser size={16} />}
                        radius="md"
                        size="md"
                        name="role"
                        data={Object.values(UserRole)}
                        value={form.values?.roles || []}
                        onChange={(value) => form.setFieldValue('roles', value)}
                        error={form.errors.roles}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                        label="Stav"
                        placeholder="Stav"
                        leftSection={<IconUser size={16} />}
                        radius="md"
                        size="md"
                        name="status"
                        data={Object.values(UserStatus)}
                        value={form.values?.active ? UserStatus.ACTIVE.value : UserStatus.INACTIVE.value}
                    />
                </Grid.Col>

                <Grid.Col span={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="submit"
                        variant="light"
                        radius="md"
                        loading={isSaving}
                        leftSection={
                            <IconDeviceFloppy stroke={1.5} size={20} />
                        }
                    >
                        Uložit
                    </Button>
                </Grid.Col>
            </Grid>
        </form>
    )
}

export default UserDetail