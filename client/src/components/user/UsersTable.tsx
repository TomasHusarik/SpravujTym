import type { User } from '@/types/User';
import { deleteUser } from '@/utils/api';
import { formatDate, getFullName, showErrorNotification, showSuccessNotification, useAdminPermissions } from '@/utils/helpers';
import { ActionIcon, Anchor, Avatar, Badge, Card, Group, Pagination, Select, Stack, Table, Text, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '@/hooks/useConfirm';

interface IUsersTable {
    filteredUsers: User[];
    loadData: () => void;
}

const PAGE_SIZES = ['10', '25', '50'];

const UsersTable = ({ filteredUsers, loadData }: IUsersTable) => {

    const navigate = useNavigate();
    const isAdmin = useAdminPermissions();
    const { confirm, confirmDialog } = useConfirm();

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const handleDelete = async (user: User) => {
        const confirmed = await confirm({
            title: 'Deaktivovat uživatele?',
            message: `${getFullName(user)} se už nebude moci přihlásit a bude odebrán ze všech soupisek. Údaje o platbách zůstanou zachované.`,
            confirmLabel: 'Deaktivovat',
            danger: true,
        });
        if (!confirmed) return;

        try {
            await deleteUser(user._id);
            showSuccessNotification('Uživatel byl deaktivován');
            loadData();
        } catch {
            showErrorNotification('Uživatele se nepodařilo deaktivovat');
        }
    };

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

    const paginatedUsers = [...filteredUsers]
        .sort((a, b) => (a.lastName ?? '').localeCompare(b.lastName ?? '', 'cs'))
        .slice((page - 1) * pageSize, page * pageSize);

    const deleteButton = (user: User) => isAdmin && user.active !== false && (
        <Tooltip label="Deaktivovat">
            <ActionIcon
                variant="subtle"
                color="red"
                aria-label={`Deaktivovat ${getFullName(user)}`}
                onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(user);
                }}
            >
                <IconTrash size={16} />
            </ActionIcon>
        </Tooltip>
    );

    return (
        <Stack>

            {/* DESKTOP TABLE */}
            <Card padding={0} visibleFrom="sm">
                <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Jméno</Table.Th>
                            <Table.Th>E-mail</Table.Th>
                            <Table.Th>Telefon</Table.Th>
                            <Table.Th>Datum narození</Table.Th>
                            {isAdmin && (<Table.Th w={56} />)}
                        </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                        {paginatedUsers.map((u) => (
                            <Table.Tr
                                key={u._id}
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/user/${u._id}`)}
                            >
                                <Table.Td>
                                    <Group gap="sm" wrap="nowrap">
                                        <Avatar radius="xl" size="sm" color="initials" name={getFullName(u)} src={u.imageUrl} />
                                        <Text size="sm" fw={500}>{getFullName(u)}</Text>
                                        {u.isAdmin && <Badge size="xs" variant="light" color="accent">Admin</Badge>}
                                        {u.active === false && <Badge size="xs" variant="light" color="gray">Neaktivní</Badge>}
                                    </Group>
                                </Table.Td>
                                <Table.Td><Text size="sm">{u.email}</Text></Table.Td>
                                <Table.Td><Text size="sm">{u.mobile || '–'}</Text></Table.Td>
                                <Table.Td><Text size="sm">{u.birthDate ? formatDate(u.birthDate) : '–'}</Text></Table.Td>
                                {isAdmin && <Table.Td>{deleteButton(u)}</Table.Td>}
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* MOBILE LIST */}
            <Stack hiddenFrom="sm" gap="xs">
                {paginatedUsers.map((u) => (
                    <Card key={u._id} padding="sm" onClick={() => navigate(`/user/${u._id}`)} style={{ cursor: 'pointer' }}>
                        <Group align="flex-start" wrap="nowrap">
                            <Avatar radius="xl" color="initials" name={getFullName(u)} src={u.imageUrl} />
                            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                <Text fw={600} size="sm">{getFullName(u)}</Text>
                                <Text size="xs" c="dimmed" truncate>{u.email}</Text>
                                {u.mobile && (
                                    <Anchor href={`tel:${u.mobile.replace(/\s/g, '')}`} size="xs" onClick={(e) => e.stopPropagation()}>
                                        {u.mobile}
                                    </Anchor>
                                )}
                            </Stack>
                            {deleteButton(u)}
                        </Group>
                    </Card>
                ))}
            </Stack>

            {/* PAGINATION */}
            {filteredUsers.length > PAGE_SIZES.map(Number)[0] && (
                <Group justify="space-between" mt="xs" wrap="wrap" gap="sm">
                    <Text size="sm" c="dimmed">Celkem {filteredUsers.length}</Text>
                    <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
                    <Select
                        aria-label="Počet na stránku"
                        data={PAGE_SIZES}
                        value={String(pageSize)}
                        onChange={(value) => { setPageSize(Number(value)); setPage(1); }}
                        allowDeselect={false}
                        w={80}
                        size="xs"
                    />
                </Group>
            )}

            {confirmDialog}
        </Stack>
    )
}

export default UsersTable;
