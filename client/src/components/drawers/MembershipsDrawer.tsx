import { Drawer, Checkbox, Stack, Group, Text, Divider, ActionIcon, Collapse, Paper, TextInput, Button } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { getFullName, showErrorNotification } from '@/utils/helpers';
import React, { useEffect, useState } from 'react';
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
}

const MembershipsDrawer = (props: IMembershipsDrawer) => {
    const { isDrawerOpen, setIsDrawerOpen } = props;

    const [squads, setSquads] = useState<Squad[]>([]);
    const [filteredSquads, setFilteredSquads] = useState<Squad[]>([]);
    const [loading, setLoading] = useState<Boolean>(false);
    const [selectedMemberships, setSelectedMemberships] = useState<string[]>([]);
    const [openSquads, setOpenSquads] = useState<string[]>([]);
    const [search, setSearch] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const squads = await getSquads();
            console.log('Loaded squads:', squads);
            setSquads(squads);
        } catch (error) {
            console.error('Error loading squads:', error);
            showErrorNotification('Chyba při načítání soupisky');
        } finally {
            setLoading(false);
        }
    };

    // Helper: get all member IDs for a squad
    const getSquadMemberIds = (squad: Squad) => squad.memberships.map((p) => p._id);

    // Handler: toggle squad selection
    const handleSquadToggle = (squadId: string, memberIds: string[]) => {
        const allSelected = memberIds.every((id) => selectedMemberships.includes(id));
        if (allSelected) {
            setSelectedMemberships(selectedMemberships.filter((id) => !memberIds.includes(id)));
        } else {
            setSelectedMemberships([...new Set([...selectedMemberships, ...memberIds])]);
        }
    };

    // Handler: toggle individual member
    const handleMemberToggle = (memberId: string) => {
        if (selectedMemberships.includes(memberId)) {
            setSelectedMemberships(selectedMemberships.filter((id) => id !== memberId));
        } else {
            setSelectedMemberships([...selectedMemberships, memberId]);
        }
    };

    // Handler: toggle squad collapse
    const handleSquadCollapse = (squadId: string) => {
        setOpenSquads((prev) =>
            prev.includes(squadId)
                ? prev.filter((id) => id !== squadId)
                : [...prev, squadId]
        );
    };



    const handleSave = async () => {
        try {
            setIsDrawerOpen(false);
        } catch (error) {
            console.error('Error saving memberships:', error);
            showErrorNotification('Chyba při ukládání členů');
        }
    };

    // Filter squads and members based on search
    useEffect(() => {
        const normalizedSearch = search.trim().toLowerCase();

        const filteredSquads = squads.map((squad: Squad) => {
            const filteredMembers = (squad.memberships ?? []).filter((member) => {
                const fullName = getFullName(member.user as User).toLowerCase();
                const isPlayer = member.roles?.some((role) => role === SquadRole.PLAYER.value);
                return isPlayer && fullName.includes(normalizedSearch);
            });
            return { ...squad, memberships: filteredMembers };
        }).filter((squad: Squad) => squad.memberships.length > 0);

        setFilteredSquads(filteredSquads);
    }, [search, squads]);


    useEffect(() => {
        if (isDrawerOpen) loadData();
    }, [isDrawerOpen]);

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
                    <Text c="dimmed">Načítám...</Text>
                ) : filteredSquads.length === 0 ? (
                    <Text c="dimmed">Žádní hráči odpovídají hledání.</Text>
                ) : (
                    filteredSquads.map((squad: Squad) => {
                        const memberIds = getSquadMemberIds(squad);
                        const allSelected = memberIds.every((id) => selectedMemberships.includes(id));
                        const someSelected = memberIds.some((id) => selectedMemberships.includes(id));
                        const isOpen = openSquads.includes(squad._id);
                        return (
                            <Paper key={squad._id} withBorder radius="md" p="xs">
                                <Group justify="space-between">
                                    <Group>
                                        <ActionIcon variant="subtle" onClick={() => handleSquadCollapse(squad._id)}>
                                            {isOpen ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                                        </ActionIcon>
                                        <Checkbox
                                            checked={allSelected}
                                            indeterminate={!allSelected && someSelected}
                                            label={<Text fw={500}>{squad.name}</Text>}
                                            onChange={() => handleSquadToggle(squad._id, memberIds)}
                                        />
                                    </Group>
                                </Group>
                                <Collapse in={isOpen} transitionDuration={150}>
                                    <Divider my={4} />
                                    <Stack gap={2} pl={24}>
                                        {squad.memberships.map((member) => (
                                            <Checkbox
                                                key={member.user._id}
                                                checked={selectedMemberships.includes(member.user._id)}
                                                label={getFullName(member.user)}
                                                onChange={() => handleMemberToggle(member.user._id)}
                                            />
                                        ))}
                                    </Stack>
                                </Collapse>
                            </Paper>
                        );
                    })
                )}
                <Button
                    fullWidth
                    onClick={() => handleSave()}
                    disabled={selectedMemberships.length === 0}
                >
                    Přidat vybrané hráče
                </Button>
            </Stack>
        </Drawer>
    );
}

export default MembershipsDrawer