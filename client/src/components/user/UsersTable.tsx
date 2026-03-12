import type { User } from '@/types/User';
import { deleteUser } from '@/utils/api';
import { formatDate, getFullName, showErrorNotification, showSuccessNotification } from '@/utils/helpers';
import { ActionIcon, Box, Group, NumberInput, Pagination, Stack, Table, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconTrash } from '@tabler/icons-react';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

interface IUsersTable {
    filteredUsers: User[];
    loadData: () => void;
}

const UsersTable = ({ filteredUsers, loadData }: IUsersTable) => {

    const navigate = useNavigate();

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [debouncedPageSize] = useDebouncedValue(pageSize, 700);

    const handleDelete = async (userId: string) => {

        const confirmed = window.confirm(
            'Opravdu chcete smazat tohoto uživatele?\n\nTuto akci nelze vrátit zpět.'
        );

        if (!confirmed) return;

        try {
            await deleteUser(userId);
            showSuccessNotification('Uživatel byl úspěšně smazán');
        } catch (error) {
            console.error('Error deleting user:', error);
            showErrorNotification('Chyba při mazání uživatele');
        } finally {
            loadData();
        }
    };

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / debouncedPageSize));

    const paginatedUsers = filteredUsers
        .sort((a, b) => a.lastName!.localeCompare(b.lastName!))
        .slice((page - 1) * debouncedPageSize, page * debouncedPageSize);

    return (
        <Stack>

            {/* DESKTOP TABLE */}
            <Table striped highlightOnHover visibleFrom="sm">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Jméno</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Datum narození</Table.Th>
                        <Table.Th></Table.Th>
                    </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                    {paginatedUsers.map((u) => (
                        <Table.Tr
                            key={u._id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/user/${u._id}`)}
                        >
                            <Table.Td>{getFullName(u)}</Table.Td>
                            <Table.Td>{u.email}</Table.Td>
                            <Table.Td>{formatDate(u.birthDate)}</Table.Td>

                            <Table.Td>
                                <ActionIcon
                                    size={32}
                                    radius="xl"
                                    variant="subtle"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(u._id!);
                                    }}
                                >
                                    <IconTrash stroke={1.5} />
                                </ActionIcon>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>

            {/* MOBILE LIST */}
            <Stack hiddenFrom="sm" gap={6}>
                {paginatedUsers.map((u) => (
                    <Box
                        key={u._id}
                        p="xs"
                        style={{
                            border: "1px solid var(--mantine-color-default-border)",
                            borderRadius: "var(--mantine-radius-md)",
                            cursor: "pointer"
                        }}
                        bg="light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"
                        onClick={() => navigate(`/user/${u._id}`)}
                    >

                        <Group justify="space-between" align="flex-start">

                            <Stack gap={2}>

                                <Text fw={600} size="sm">
                                    {getFullName(u)}
                                </Text>

                                <Text size="xs" c="dimmed">
                                    {u.email}
                                </Text>

                                <Text size="xs" c="dimmed">
                                    {formatDate(u.birthDate)}
                                </Text>

                            </Stack>

                            <ActionIcon
                                color="red"
                                variant="subtle"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(u._id!);
                                }}
                            >
                                <IconTrash size={16} />
                            </ActionIcon>

                        </Group>

                    </Box>
                ))}
            </Stack>

            {/* PAGINATION */}
            <Group justify="center" mt="md">

                <Pagination
                    value={page}
                    onChange={setPage}
                    total={totalPages}
                />

                <NumberInput
                    radius="md"
                    size="sm"
                    name="pageSize"
                    min={1}
                    max={filteredUsers.length}
                    value={pageSize}
                    onChange={(value) => setPageSize(value as number)}
                    w={80}
                />

            </Group>

        </Stack>
    )
}

export default UsersTable;