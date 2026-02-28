import type { User } from '@/types/User';
import { getUsers } from '@/utils/api';
import { ActionIcon, Grid, TextInput, Title, Tooltip } from '@mantine/core';
import { IconUserPlus } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router';
import UsersTable from './UsersTable';
import { useDebouncedValue } from '@mantine/hooks';
import NewUserDrawer from '../drawers/NewUserDrawer';

const UserSearch = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchValue, setSearchValue] = useState<string>('');
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [debouncedSearchValue] = useDebouncedValue(searchValue, 150);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const loadData = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        const lowerSearch = debouncedSearchValue.toLowerCase();
        const filtered = users.filter((user) => {
            const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
            const email = user.email?.toLowerCase() || '';
            return fullName.includes(lowerSearch) || email.includes(lowerSearch);
        });
        setFilteredUsers(filtered);
    }, [debouncedSearchValue, users]);


    useEffect(() => {
        loadData();
    }, [])

    return (
        <>
            <Grid>
                <Grid.Col span={6}>
                    <TextInput
                        radius="md"
                        size="md"
                        placeholder="Search User"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        rightSection={
                            <Tooltip label="Create new user" withArrow>
                                <ActionIcon size={32} radius="xl" variant="subtle" onClick={() => setIsDrawerOpen(true)} >
                                    <IconUserPlus stroke={1.5} />
                                </ActionIcon>
                            </Tooltip>
                        }
                    />
                </Grid.Col>
                <Grid.Col span={12}>
                    <UsersTable filteredUsers={filteredUsers} loadData={loadData} />
                </Grid.Col>
            </Grid>

            <NewUserDrawer isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} />
        </>
    )
}

export default UserSearch