import type { User } from '@/types/User';
import { getUsers } from '@/utils/api';
import {
    ActionIcon,
    Chip,
    Group,
    Stack,
    TextInput,
    Tooltip,
} from '@mantine/core';
import { IconUserPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import UsersTable from './UsersTable';
import NewUserDrawer from '../drawers/NewUserDrawer';
import { useAdminPermissions } from '@/utils/helpers';

const UserSearch = () => {
    const isAdmin = useAdminPermissions();

    const [users, setUsers] = useState<User[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [debouncedSearchValue] = useDebouncedValue(searchValue, 150);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const loadData = async () => {
        try {
            const data = await getUsers(showInactive);
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

            return (
                fullName.includes(lowerSearch) ||
                email.includes(lowerSearch)
            );
        });

        setFilteredUsers(filtered);
    }, [debouncedSearchValue, users]);

    useEffect(() => {
        loadData();
    }, [showInactive]);

    return (
        <>
            <Stack gap="md">

                {/* Search + create */}
                <Group align="flex-end" wrap="nowrap">
                    <TextInput
                        radius="md"
                        size="md"
                        placeholder="Vyhledat uživatele..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        rightSection={isAdmin && (
                            <Tooltip label="Vytvořit uživatele" withArrow>
                                <ActionIcon size={32} radius="xl" variant="subtle" onClick={() => setIsDrawerOpen(true)} >
                                    <IconUserPlus stroke={1.5} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        style={{ flex: 1, maxWidth: 450 }}
                    />
                </Group>

                {/* Filters */}
                <Group>
                    <Chip
                        checked={showInactive}
                        onChange={(checked) => setShowInactive(checked)}
                        variant="outline"
                    >
                        Zobrazit neaktivní
                    </Chip>
                </Group>

                {/* Table */}
                <UsersTable
                    filteredUsers={filteredUsers}
                    loadData={loadData}
                />

            </Stack>

            <NewUserDrawer
                isDrawerOpen={isDrawerOpen}
                setIsDrawerOpen={setIsDrawerOpen}
            />
        </>
    );
};

export default UserSearch;