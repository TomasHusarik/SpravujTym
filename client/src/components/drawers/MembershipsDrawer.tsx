import { Drawer, Checkbox, Stack, Group, Text, Divider, ActionIcon, Collapse, Paper, TextInput, Button, Loader, Badge } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { getFullName, showErrorNotification } from '@/utils/helpers';
import React, { useEffect, useMemo, useState } from 'react';
import { getSquads } from '@/utils/api';
import type { User } from '@/types/User';
import { get } from 'http';
import type { Squad } from '@/types/Squad';
import { SquadRole } from '@/utils/const';
import type { EventParticipation } from '@/types/EventParticipation';

interface IMembershipsDrawer {
    eventParticipations: EventParticipation[];
    isDrawerOpen: boolean;
    setIsDrawerOpen: (open: boolean) => void;
    onSave: (users: User[]) => void;
}

const MembershipsDrawer = (props: IMembershipsDrawer) => {
    const { eventParticipations, isDrawerOpen, setIsDrawerOpen, onSave } = props;

    const [squads, setSquads] = useState<Squad[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [openSquads, setOpenSquads] = useState<string[]>([]);
    const [search, setSearch] = useState("");

    const existingUserIds = useMemo(
        () => eventParticipations.map((p) => p.user._id),
        [eventParticipations]
    );

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSquads();
            setSquads(data);
        } catch (error) {
            showErrorNotification("Chyba při načítání soupisky");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isDrawerOpen) {
            loadData();
            setSelectedUsers([]);
        }
    }, [isDrawerOpen]);

    const filteredSquads = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return squads
            .map((squad) => {
                const filteredMembers = (squad.memberships ?? []).filter((member) => {
                    const isPlayer = member.roles?.includes('player');
                    const fullName = getFullName(member.user).toLowerCase();
                    return isPlayer && fullName.includes(normalizedSearch);
                });

                return { ...squad, memberships: filteredMembers };
            })
            .filter((squad) => squad.memberships.length > 0);
    }, [squads, search]);

    const handleMemberToggle = (user: User) => {
        if (existingUserIds.includes(user._id)) return;

        setSelectedUsers((prev) =>
            prev.some((u) => u._id === user._id)
                ? prev.filter((u) => u._id !== user._id)
                : [...prev, user]
        );
    };

    const handleSquadCollapse = (squadId: string) => {
        setOpenSquads((prev) =>
            prev.includes(squadId)
                ? prev.filter((id) => id !== squadId)
                : [...prev, squadId]
        );
    };

    const handleSave = () => {
        onSave(selectedUsers);
        setSelectedUsers([]);
        setIsDrawerOpen(false);
    };

    return (
        <Drawer
            opened={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            position="right"
            padding="lg"
            size="md"
            title="Výběr hráčů"
        >
            <Stack gap="md">
                <TextInput
                    placeholder="Vyhledat hráče..."
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                />

                {loading ? (
                    <Group justify="center">
                        <Loader size="sm" />
                    </Group>
                ) : filteredSquads.length === 0 ? (
                    <Text c="dimmed">Žádní hráči nenalezeni.</Text>
                ) : (
                    filteredSquads.map((squad) => {
                        const isOpen = openSquads.includes(squad._id);

                        return (
                            <Paper key={squad._id} withBorder radius="md" p="xs">
                                <Group justify="space-between">
                                    <Group>
                                        <ActionIcon
                                            variant="subtle"
                                            onClick={() => handleSquadCollapse(squad._id)}
                                        >
                                            {isOpen ? (
                                                <IconChevronDown size={18} />
                                            ) : (
                                                <IconChevronRight size={18} />
                                            )}
                                        </ActionIcon>
                                        <Text fw={500}>{squad.name}</Text>
                                    </Group>
                                </Group>

                                <Collapse in={isOpen}>
                                    <Divider my={4} />
                                    <Stack gap={4} pl={24}>
                                        {squad.memberships.map((member) => {
                                            const user = member.user as User;
                                            const userId = user._id;

                                            const isExisting = existingUserIds.includes(userId);
                                            const isSelected = selectedUsers.some(u => u._id === userId);

                                            return (
                                                <Checkbox
                                                    key={userId}
                                                    checked={isExisting || isSelected}
                                                    disabled={isExisting}
                                                    label={
                                                        <Group gap={6}>
                                                            <Text>{getFullName(user)}</Text>
                                                            {isExisting && (
                                                                <Badge size="xs" variant="light" color="gray">
                                                                    již přidán
                                                                </Badge>
                                                            )}
                                                        </Group>
                                                    }
                                                    onChange={() => handleMemberToggle(user)}
                                                />
                                            );
                                        })}
                                    </Stack>
                                </Collapse>
                            </Paper>
                        );
                    })
                )}

                <Button
                    fullWidth
                    onClick={handleSave}
                    disabled={selectedUsers.length === 0}
                >
                    Přidat vybrané hráče
                </Button>
            </Stack>
        </Drawer>
    );
};

export default MembershipsDrawer;