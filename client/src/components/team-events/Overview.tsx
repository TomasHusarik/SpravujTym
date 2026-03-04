import { Group, Paper, Stack, ThemeIcon, Text, Grid, Chip, Indicator, Button } from '@mantine/core';
import React, { useEffect, useState } from 'react'
import { IconBarbell } from '@tabler/icons-react';
import { extendedPemissions, formatTeamEventDate, getEventColor } from '@/utils/helpers';
import type { TeamEvent } from '@/types/TeamEvent';
import { Calendar } from '@mantine/dates';
import { EventType } from '@/utils/const';
import dayjs from 'dayjs';
import EventsTable from './EventsTable';
import { getParticipantTeamEvents, updateParticipationStatus } from '@/utils/api';
import { permission } from 'process';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router';

// Skončené a neskončené události
const statusOptions = [
    { value: 'upcoming', label: 'Nadcházející' },
    { value: 'past', label: 'Minulé' }
] as const;

const Overview = () => {
    const [teamEvents, setTeamEvents] = useState<TeamEvent[]>([]);
    const [filteredTeamEvents, setFilterdTeamEvents] = useState<TeamEvent[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string>('upcoming');
    const navigate = useNavigate();

    const isEventUpcoming = (date: Date): boolean => date >= new Date();

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
            const data = await getParticipantTeamEvents();
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
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        setFilterdTeamEvents(filtered);
    }, [selectedStatus, teamEvents]);

    return (
        <Grid>
            <Grid.Col span={{ base: 12, md: 8 }} order={{ base: 1, md: 1 }}>
                <Text fz="xl" fw={700} mb="md">Události</Text>
                <Chip.Group multiple={false} value={selectedStatus} onChange={(value) => setSelectedStatus(value)}>
                    <Group justify="left" gap="sm" wrap="wrap">
                        {statusOptions.map((option) => (
                            <Chip key={option.value} value={option.value}>{option.label}</Chip>
                        ))}
                    </Group>
                </Chip.Group>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 8 }} order={{ base: 3, md: 2 }}>
                <EventsTable filteredTeamEvents={filteredTeamEvents} handleStatusChange={handleStatusChange} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }} order={{ base: 2, md: 3 }}>
                <Grid>
                    <Grid.Col span={12} visibleFrom="md">
                        <Group justify="center" mb="md">
                            <Calendar
                                locale="cs"
                                renderDay={(date) => {
                                    const day = dayjs(date).date();
                                    // Find events for this day
                                    const eventsForDay = teamEvents.filter(event =>
                                        dayjs(event.startDate).isSame(date, 'day')
                                    );
                                    return (
                                        <>
                                            {eventsForDay.length > 0 ? (
                                                eventsForDay.map(event => (
                                                    <Indicator
                                                        key={event._id}
                                                        size={6}
                                                        color={getEventColor(event.type)}
                                                        offset={-2}
                                                        style={{ zIndex: 1 }}
                                                    >
                                                        <div>{day}</div>
                                                    </Indicator>
                                                ))
                                            ) : (
                                                <div>{day}</div>
                                            )}
                                        </>
                                    );
                                }}
                            />
                        </Group>
                    </Grid.Col>

                    {extendedPemissions() &&
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