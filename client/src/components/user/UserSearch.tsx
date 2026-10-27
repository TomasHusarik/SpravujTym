import type { User } from '@/types/User';
import { getUsers } from '@/utils/api';
import { Button, Group, Stack, Switch, TextInput } from '@mantine/core';
import { IconSearch, IconUserPlus, IconUsers } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import UsersTable from './UsersTable';
import NewUserDrawer from '../drawers/NewUserDrawer';
import { matchesSearch, useAdminPermissions } from '@/utils/helpers';
import { useAsyncData } from '@/hooks/useAsyncData';
import PageHeader from '../ui/PageHeader';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/StateViews';

const UserSearch = () => {
    const isAdmin = useAdminPermissions();

    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearchValue] = useDebouncedValue(searchValue, 150);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const { data: users = [], loading, error, reload } = useAsyncData<User[]>(() => getUsers(showInactive), [showInactive]);

    // Search ignores diacritics, so "dvorak" finds "Dvořák"
    const filteredUsers = useMemo(() => {
        if (!debouncedSearchValue.trim()) return users;
        return users.filter((user) =>
            matchesSearch(`${user.firstName ?? ''} ${user.lastName ?? ''} ${user.email ?? ''}`, debouncedSearchValue)
        );
    }, [users, debouncedSearchValue]);

    const handleDrawer = (open: boolean) => {
        setIsDrawerOpen(open);
        if (!open) reload();
    };

    const renderContent = () => {
        if (loading) return <ListSkeleton rows={8} height={52} />;
        if (error) return <ErrorState message={error} onRetry={reload} />;
        if (filteredUsers.length === 0) {
            return (
                <EmptyState
                    icon={<IconUsers size={24} />}
                    title={searchValue ? 'Nikoho jsme nenašli' : 'Zatím žádní uživatelé'}
                    description={searchValue ? 'Zkuste jiné jméno nebo e-mail.' : undefined}
                />
            );
        }
        return <UsersTable key={debouncedSearchValue} filteredUsers={filteredUsers} loadData={reload} />;
    };

    return (
        <>
            <PageHeader
                title="Uživatelé"
                description="Hráči, trenéři a další členové klubu."
                actions={isAdmin && (
                    <Button leftSection={<IconUserPlus size={16} />} onClick={() => setIsDrawerOpen(true)}>
                        Přidat uživatele
                    </Button>
                )}
            />

            <Stack gap="md">
                <Group justify="space-between" wrap="wrap" gap="sm">
                    <TextInput
                        placeholder="Hledat podle jména nebo e-mailu…"
                        aria-label="Hledat uživatele"
                        leftSection={<IconSearch size={16} />}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.currentTarget.value)}
                        w={{ base: '100%', sm: 360 }}
                    />
                    {isAdmin && (
                        <Switch
                            checked={showInactive}
                            onChange={(event) => setShowInactive(event.currentTarget.checked)}
                            label="Jen neaktivní"
                        />
                    )}
                </Group>

                {renderContent()}
            </Stack>

            <NewUserDrawer
                isDrawerOpen={isDrawerOpen}
                setIsDrawerOpen={handleDrawer}
            />
        </>
    );
};

export default UserSearch;
