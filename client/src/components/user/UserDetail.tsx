import { useAuth } from '@/context/AuthContext'
import type { User } from '@/types/User'
import { deleteUser, getUser, updateUser } from '@/utils/api'
import { UserStatus } from '@/utils/const'
import { showErrorNotification, showSuccessNotification, useAdminPermissions, usePlayerPermissions } from '@/utils/helpers'
import { Button, Card, Checkbox, Grid, MultiSelect, NumberInput, Select, Switch, TextInput, Title } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { IconDeviceFloppy, IconPhone, IconUser, IconMail, IconCalendar, IconShieldCheck, IconToggleRight, IconPencil, IconTrash } from '@tabler/icons-react'
import React, { useEffect, useState } from 'react'
import ChangePasswordModal from '../modals/ChangePasswordModal'
import { useConfirm } from '@/hooks/useConfirm'
import { useNavigate } from 'react-router-dom'

interface IUserDetail {
    userId: string;
}

const UserDetail = (props: IUserDetail) => {
    const { userId } = props;
    const isAdmin = useAdminPermissions();

    const [isSaving, setIsSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [user, setUser] = useState<User>(null);
    const hasPlayerPermissions = usePlayerPermissions(user);
    const navigate = useNavigate();
    const { user: loggedUser } = useAuth();
    const { confirm, confirmDialog } = useConfirm();
    const isOwnProfile = Boolean(userId) && loggedUser?._id === userId;

    const form = useForm({
        initialValues: {
            _id: undefined,
            firstName: '',
            lastName: '',
            email: '',
            mobile: '',
            isAdmin: false,
            birthDate: null,
            active: false,
            emailNotifications: true,
        },

        validate: {
            firstName: (val: string) => val.trim() === '' ? 'Jméno je povinné' : null,
            lastName: (val: string) => val.trim() === '' ? 'Příjmení je povinné' : null,
            email: (val: string) => /^\S+@\S+$/.test(val) ? null : 'Neplatný e-mail',
            birthDate: (val: Date) => val ? null : 'Datum narození je povinné',
            mobile: (val: string) => /^\+?[0-9\s\-()]+$/.test(val) ? null : 'Neplatné telefonní číslo',
            isAdmin: (val: boolean) => typeof val === 'boolean' ? null : 'Role je povinná',
            active: (val: boolean) => typeof val === 'boolean' ? null : 'Stav je povinný',
        },
    });

    const handleEditMode = () => {
        setEditMode(!editMode);
        if (editMode) {
            loadData();
        }
    };

    const handleUserDelete = async () => {
        if (!userId) return;

        const confirmed = await confirm({
            title: 'Deaktivovat uživatele?',
            message: 'Uživatel se už nebude moci přihlásit a bude odebrán ze všech soupisek.',
            confirmLabel: 'Deaktivovat',
            danger: true,
        });
        if (!confirmed) return;

        try {
            await deleteUser(userId);
            showSuccessNotification('Uživatel byl deaktivován');
            navigate('/users');
        } catch (error) {
            showErrorNotification('Uživatele se nepodařilo deaktivovat');
            console.error('Error deleting user:', error);
        }
    };

    const handleSave = form.onSubmit(async (values) => {
        try {
            setIsSaving(true);
            await updateUser(values);
            showSuccessNotification('Uživatel úspěšně uložen');
        } catch (error) {
            showErrorNotification('Chyba při ukládání uživatele');
            console.error('Error saving user data:', error);
        } finally {
            setIsSaving(false);
            setEditMode(false);
            loadData();
        }
    });

    // Saved immediately, independent of the edit mode
    const handleEmailNotificationsChange = async (checked: boolean) => {
        form.setFieldValue('emailNotifications', checked);
        try {
            await updateUser({ _id: userId, emailNotifications: checked });
            showSuccessNotification(checked ? 'Upozornění budou chodit i e-mailem' : 'E-mailová upozornění jsou vypnutá');
        } catch {
            form.setFieldValue('emailNotifications', !checked);
            showErrorNotification('Nastavení se nepodařilo uložit');
        }
    };

    const loadData = async () => {
        try {
            const userData = await getUser(userId);
            form.setValues(userData);
            setUser(userData);
            if (userData.new) {
                setEditMode(true);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, [userId]);


    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSave(e);
        }}>
            <Card padding="lg">
            <Grid>
                {editMode && userId && isAdmin && !isOwnProfile && (
                    <Grid.Col span={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="light"
                            onClick={() => handleUserDelete()}
                            leftSection={<IconTrash size={16} />}
                            color="red"
                            radius="md"
                        >
                            Deaktivovat
                        </Button>
                    </Grid.Col>
                )}
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
                        readOnly={!editMode}
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
                        readOnly={!editMode && isAdmin}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                        label="E-mail"
                        placeholder="E-mail"
                        leftSection={<IconMail size={16} />}
                        radius="md"
                        size="md"
                        name="email"
                        value={form.values?.email || ''}
                        onChange={(value) => form.setFieldValue('email', value.currentTarget.value)}
                        error={form.errors.email}
                        readOnly={true}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <DatePickerInput
                        valueFormat="D. M. YYYY"
                        label="Datum narození"
                        placeholder="Datum narození"
                        locale='cs'
                        leftSection={<IconCalendar size={16} />}
                        radius="md"
                        size="md"
                        name="age"
                        value={form.values?.birthDate || null}
                        onChange={(value) => form.setFieldValue('birthDate', value)}
                        error={form.errors.birthDate}
                        readOnly={!editMode}
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
                        readOnly={!editMode}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                        label="Administrátor"
                        size="md"
                        name="admin"
                        leftSection={<IconShieldCheck size={16} />}
                        radius="md"
                        data={[
                            { value: 'true', label: 'Ano' },
                            { value: 'false', label: 'Ne' },
                        ]}
                        value={form.values?.isAdmin ? 'true' : 'false'}
                        onChange={(value) => form.setFieldValue('isAdmin', value === 'true')}
                        error={form.errors.isAdmin}
                        disabled={!editMode || !isAdmin}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                        label="Stav"
                        placeholder="Stav"
                        leftSection={<IconToggleRight size={16} />}
                        radius="md"
                        size="md"
                        name="status"
                        data={[
                            { value: 'true', label: 'Aktivní' },
                            { value: 'false', label: 'Neaktivní' },
                        ]}
                        value={form.values?.active ? 'true' : 'false'}
                        onChange={(value) => form.setFieldValue('active', value === 'true')}
                        error={form.errors.active}
                        disabled={!editMode || !isAdmin}
                    />
                </Grid.Col>

                {isOwnProfile && !user?.new && (
                    <Grid.Col span={12}>
                        <Switch
                            label="Posílat upozornění také e-mailem"
                            description="Zrušení a změny událostí, nominace a připomínky. Upozornění v aplikaci (zvoneček) chodí vždy."
                            checked={form.values.emailNotifications !== false}
                            onChange={(event) => handleEmailNotificationsChange(event.currentTarget.checked)}
                        />
                    </Grid.Col>
                )}

                {hasPlayerPermissions && (
                    <Grid.Col span={12} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            variant="light"
                            radius="md"
                            leftSection={<IconPencil stroke={1.5} size={20} />}
                            onClick={() => handleEditMode()}
                        >
                            {editMode ? 'Zrušit' : 'Upravit'}
                        </Button>

                        {!editMode && <ChangePasswordModal userId={userId} />}

                        {editMode && (
                            <Button
                                type="submit"
                                variant="light"
                                radius="md"
                                loading={isSaving}
                                leftSection={<IconDeviceFloppy stroke={1.5} size={20} />}
                            >
                                Uložit
                            </Button>
                        )}
                    </Grid.Col>
                )}
            </Grid>
            </Card>
            {confirmDialog}
        </form>
    )
}

export default UserDetail