import type { User } from '@/types/User';
import { formatDate, getFullName } from '@/utils/helpers';
import { ActionIcon, NumberInput, Pagination, Table } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconTrash } from '@tabler/icons-react';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

interface IUsersTable {
    filteredUsers: User[];
    loadData: () => void;
}

const UsersTable = (props: IUsersTable) => {
    const { filteredUsers, loadData } = props;

    const navigate = useNavigate(); 
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    // debounce pageSize so table recalculation happens after user stops changing the input
    const [debouncedPageSize] = useDebouncedValue(pageSize, 700);

    const handleDelete = async (userId: string) => {
        // implement delete user functionality here, e.g. call API to delete user and then reload data
        console.log('Delete user with id:', userId);
    };

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / debouncedPageSize));
    const paginatedUsers = filteredUsers
        .sort((a, b) => a.lastName!.localeCompare(b.lastName!))
        .slice((page - 1) * debouncedPageSize, page * debouncedPageSize)

    return (
        <div className="table-container">
            <Table className='table' striped highlightOnHover highlightOnHoverColor='var(--mantine-color-blue-light)'>
                <Table.Thead >
                    <Table.Tr c="var(--mantine-color-blue-light-color)" fs={'bold'}>
                        <Table.Th>Jméno</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Telefon</Table.Th>
                        <Table.Th>Datum narození</Table.Th>
                        <Table.Th></Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {paginatedUsers?.map((u) => (
                        <Table.Tr key={u._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/user/${u._id}`)}>
                            <Table.Td>{getFullName(u)}</Table.Td>
                            <Table.Td>{u.email}</Table.Td>
                            <Table.Td>{u.mobile}</Table.Td>
                            <Table.Td>{formatDate(u.birthDate)}</Table.Td>
                            <Table.Td>
                                <ActionIcon size={32} radius="xl" variant="subtle" onClick={(e) => { e.stopPropagation(); handleDelete(u._id!); }}>
                                    <IconTrash stroke={1.5} />
                                </ActionIcon>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 20, marginTop: 16 }}>
                <div>
                    <Pagination
                        value={page}
                        onChange={setPage}
                        total={totalPages}
                    />
                </div>

                <div>
                    <NumberInput
                        radius="md"
                        size="md"
                        name="pageSize"
                        min={1}
                        max={paginatedUsers.length}
                        value={pageSize}
                        onChange={(value) => setPageSize(value as number)}
                        style={{ width: 100 }}
                    />
                </div>
            </div>
        </div >
    )
}

export default UsersTable