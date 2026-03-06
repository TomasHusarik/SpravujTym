import { Group, Paper, Text, Grid, Chip, Indicator, Button, Stack, Switch, Badge, Divider } from '@mantine/core';
import React, { useEffect, useState } from 'react'
import { getEventColor, useExtendedPermissions } from '@/utils/helpers';
import type { TeamEvent } from '@/types/TeamEvent';
import { Calendar } from '@mantine/dates';
import dayjs from 'dayjs';
import EventsTable from './EventsTable';
import { getTeamEvents, updateParticipationStatus } from '@/utils/api';
import { useNavigate } from 'react-router';

// Skončené a neskončené události
const statusOptions = [
    { value: 'upcoming', label: 'Nadcházející' },
    { value: 'past', label: 'Minulé' }
] as const;

const Overview = () => {
    const [teamEvents, setTeamEvents] = useState<TeamEvent[]>([]);
    const [filteredTeamEvents, setFilteredTeamEvents] = useState<TeamEvent[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string>('upcoming');
    const [showManagedEvents, setShowManagedEvents] = useState<boolean>(false);
    const navigate = useNavigate();
    const hasExtendedPermissions = useExtendedPermissions();

    const isEventUpcoming = (date: Date | string): boolean => new Date(date) >= new Date();

    const handleStatusChange = async (eventId: string | undefined, newStatus: string) => {
        try {
            await updateParticipationStatus(eventId, newStatus);
            loadData();
        } catch (error) {
            console.error('Error updating participation status:', error);
        }
    };

    const loadData = async () => {
        try {
            const data = await getTeamEvents();
            setTeamEvents(data);
        } catch (error) {
            console.error('Error fetching participant team events:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const filtered = teamEvents
            .filter(event =>
                selectedStatus === 'upcoming'
                    ? isEventUpcoming(event.startDate)
                    : !isEventUpcoming(event.startDate)
            )
            .filter(event => (showManagedEvents ? true : (event.eventParticipations?.length ?? 0) > 0))
            .sort((a, b) => {
                const startA = new Date(a.startDate).getTime();
                const startB = new Date(b.startDate).getTime();
                return selectedStatus === 'upcoming' ? startA - startB : startB - startA;
            });

        setFilteredTeamEvents(filtered);
    }, [selectedStatus, showManagedEvents, teamEvents]);

    return (
        <Grid>
            <Grid.Col span={{ base: 12, md: 8 }} order={{ base: 1, md: 1 }}>
                <Paper radius="lg" p="md" mb="md">
                    <Stack gap="sm">
                        <Group justify="space-between" align="center" wrap="wrap">
                            <Text fz="xl" fw={700}>Události</Text>
                            <Badge variant="light" size="lg">{filteredTeamEvents.length} zobrazeno</Badge>
                        </Group>

                        <Text c="dimmed" size="sm">Filtruj události podle období a účasti.</Text>

                        <Divider />

                        <Chip.Group multiple={false} value={selectedStatus} onChange={(value) => setSelectedStatus(String(value))}>
                            <Group justify="left" gap="sm" wrap="wrap">
                                {statusOptions.map((option) => (
                                    <Chip key={option.value} value={option.value}>{option.label}</Chip>
                                ))}
                            </Group>
                        </Chip.Group>

                        {useExtendedPermissions() && (
                            <Switch
                                checked={showManagedEvents}
                                onChange={(event) => setShowManagedEvents(event.currentTarget.checked)}
                                label="Zobrazit spravované události"
                            />
                        )}

                    </Stack>
                </Paper>

                <EventsTable filteredTeamEvents={filteredTeamEvents} handleStatusChange={handleStatusChange} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }} order={{ base: 2, md: 3 }}>
                <Grid>
                    <Grid.Col span={12} visibleFrom="md">
                        <Group justify="center" mb="md">
                            <Paper radius="lg" p="sm">
                                <Calendar
                                    locale="cs"
                                    renderDay={(date) => {
                                        const day = dayjs(date).date();
                                        const eventsForDay = filteredTeamEvents.filter(event =>
                                            dayjs(event.startDate).isSame(date, 'day')
                                        );

                                        if (eventsForDay.length === 0) {
                                            return <div>{day}</div>;
                                        }

                                        return (
                                            <Indicator
                                                size={7}
                                                color={getEventColor(eventsForDay[0].type)}
                                                offset={-2}
                                                label={eventsForDay.length > 1 ? eventsForDay.length : undefined}
                                                style={{ zIndex: 1 }}
                                            >
                                                <div>{day}</div>
                                            </Indicator>
                                        );
                                    }}
                                />
                            </Paper>
                        </Group>
                    </Grid.Col>

                    {hasExtendedPermissions &&
                        <Grid.Col span={12}>
                            <Group justify="center">
                                <Button variant="filled" onClick={() => navigate('/event-detail')}>Vytvořit novou událost</Button>
                            </Group>
                        </Grid.Col>
                    }
                </Grid>
            </Grid.Col>
        </Grid>
    )
}

export default Overview