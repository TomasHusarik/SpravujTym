import { Group, Paper, Stack, ThemeIcon, Text, Grid, Chip, Indicator } from '@mantine/core';
import React, { useEffect, useState } from 'react'
import { IconBarbell } from '@tabler/icons-react';
import { formatTeamEventDate, getEventColor } from '@/utils/helpers';
import type { TeamEvent } from '@/types/TeamEvent';
import { Calendar } from '@mantine/dates';
import { EventType } from '@/utils/const';
import dayjs from 'dayjs';

// Mock Data
export const teamEvents: TeamEvent[] = [
    {
        id: '1',
        title: 'Pondělní trénink',
        type: 'training',
        date: new Date('2026-02-09'),
        startTime: '18:00',
        endTime: '20:00',
        location: 'Sportovní hala Slovany',
        description: 'Kondiční příprava a taktické cvičení',
        participants: 18,
        maxParticipants: 25,
        isRequired: true,
        createdBy: 'Tomáš Husarik'
    },
    {
        id: '2',
        title: 'Zápas proti HC Vsetín',
        type: 'match',
        date: new Date('2026-02-12'),
        startTime: '19:30',
        endTime: '21:30',
        location: 'Zimní stadion Vsetín',
        description: 'Ligový zápas - odjezd v 17:00',
        participants: 22,
        maxParticipants: 22,
        isRequired: true,
        createdBy: 'Tomáš Husarik'
    },
    {
        id: '3',
        title: 'Týmová schůzka',
        type: 'other',
        date: new Date('2026-02-15'),
        startTime: '10:00',
        endTime: '11:30',
        location: 'Klubovna - Online přes Teams',
        description: 'Rozbor uplynulých zápasů a plán na další měsíc',
        participants: 12,
        maxParticipants: 30,
        isRequired: false,
        createdBy: 'Jan Novák'
    },
    {
        id: '4',
        title: 'Víkendové soustředění',
        type: 'training',
        date: new Date('2026-02-20'),
        startTime: '09:00',
        endTime: '18:00',
        location: 'Sportovní areál Kunětická hora',
        description: 'Dvoudenní soustředění s nocováním. Nutná registrace do 10.2.',
        participants: 15,
        maxParticipants: 20,
        isRequired: false,
        createdBy: 'Tomáš Husarik'
    },
    {
        id: '5',
        title: 'Juniorský turnaj',
        type: 'training',
        date: new Date('2026-02-28'),
        startTime: '08:00',
        endTime: '17:00',
        location: 'Sportovní hala Praha',
        description: 'Účast potvrzena - 6 týmů',
        participants: 20,
        maxParticipants: 20,
        isRequired: true,
        createdBy: 'Petr Svoboda'
    },
    {
        id: '6',
        title: 'Podmítácký trénink',
        type: 'training',
        date: new Date('2026-02-11'),
        startTime: '17:00',
        endTime: '18:30',
        location: 'Sportovní hala Slovany',
        description: 'Technická příprava - práce s míčem',
        participants: 16,
        maxParticipants: 25,
        isRequired: true,
        createdBy: 'Tomáš Husarik'
    },
    {
        id: '7',
        title: 'Přátelský zápas s TJ Svitavy',
        type: 'match',
        date: new Date('2026-03-02'),
        startTime: '18:00',
        endTime: '20:00',
        location: 'Stadion Svitavy',
        description: 'Přípravný zápas před jarní částí',
        participants: 19,
        maxParticipants: 22,
        isRequired: true,
        createdBy: 'Lukáš Dvořák'
    },
    {
        id: '8',
        title: 'Charitativní turnaj mládeže',
        type: 'match',
        date: new Date('2026-03-08'),
        startTime: '09:00',
        endTime: '15:30',
        location: 'Sportovní areál Letná',
        description: 'Výtežek pro dětské centrum',
        participants: 10,
        maxParticipants: 18,
        isRequired: false,
        createdBy: 'Martin Černý'
    },
    {
        id: '9',
        title: 'Pohárové semifinále',
        type: 'match',
        date: new Date('2026-03-12'),
        startTime: '19:00',
        endTime: '21:00',
        location: 'Městská hala Kladno',
        description: 'Domácí zápas',
        participants: 22,
        maxParticipants: 22,
        isRequired: true,
        createdBy: 'Tomáš Husarik'
    },
    {
        id: '10',
        title: 'Regenerační trénink',
        type: 'training',
        date: new Date('2025-03-05'),
        startTime: '16:00',
        endTime: '17:15',
        location: 'Fitness centrum Atlas',
        description: 'Lehký trénink po sezóně',
        participants: 12,
        maxParticipants: 20,
        isRequired: false,
        createdBy: 'Petr Svoboda'
    },
    {
        id: '11',
        title: 'Sezónní bilance',
        type: 'other',
        date: new Date('2025-03-10'),
        startTime: '18:30',
        endTime: '20:00',
        location: 'Klubovna',
        description: 'Schůzka vedení a hráčů',
        participants: 14,
        maxParticipants: 25,
        isRequired: false,
        createdBy: 'Jan Novák'
    },
    {
        id: '12',
        title: 'Výjezdní trénink',
        type: 'training',
        date: new Date('2026-04-01'),
        startTime: '17:00',
        endTime: '19:00',
        location: 'Hřiště Beroun',
        description: 'Trénink na venkovním hřišti',
        participants: 17,
        maxParticipants: 25,
        isRequired: true,
        createdBy: 'Tomáš Husarik'
    },
    {
        id: '13',
        title: 'Porada realizačního týmu',
        type: 'other',
        date: new Date('2026-03-20'),
        startTime: '20:00',
        endTime: '21:00',
        location: 'Online',
        description: 'Strategie na další měsíc',
        participants: 6,
        maxParticipants: 10,
        isRequired: false,
        createdBy: 'Petr Svoboda'
    },
    {
        id: '14',
        title: 'Závěrečný zápas sezóny',
        type: 'match',
        date: new Date('2026-04-10'),
        startTime: '18:00',
        endTime: '20:00',
        location: 'Stadion Plzeň',
        description: 'Rozhodující zápas o postup',
        participants: 22,
        maxParticipants: 22,
        isRequired: true,
        createdBy: 'Tomáš Husarik'
    },
    {
        id: '15',
        title: 'Teambuilding',
        type: 'other',
        date: new Date('2026-04-15'),
        startTime: '15:00',
        endTime: '22:00',
        location: 'Rekreační areál Šumava',
        description: 'Společné aktivity mimo hřiště',
        participants: 20,
        maxParticipants: 30,
        isRequired: false,
        createdBy: 'Jan Novák'
    }
];

// Skončené a neskončené události
const statusOptions = [
    { value: 'upcoming', label: 'Nadcházející' },
    { value: 'past', label: 'Minulé' }
] as const;
const EventsTable = () => {
    const [filteredTeamEvents, setFilterdTeamEvents] = useState<TeamEvent[]>(teamEvents);
    const [selectedStatus, setSelectedStatus] = useState<string>('upcoming');

    const isEventUpcoming = (date: Date): boolean => date >= new Date();

    useEffect(() => {
        const filtered = teamEvents
            .filter(event =>
                selectedStatus === 'upcoming'
                    ? isEventUpcoming(event.date)
                    : !isEventUpcoming(event.date)
            )
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        setFilterdTeamEvents(filtered);
    }, [selectedStatus, teamEvents]);

    return (
        <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
                <Text fz="xl" fw={700} mb="md">Události</Text>
                <Chip.Group multiple={false} value={selectedStatus} onChange={(value) => setSelectedStatus(value)}>
                    <Group justify="left" gap="sm" wrap="wrap">
                        {statusOptions.map((option) => (
                            <Chip key={option.value} value={option.value}>{option.label}</Chip>
                        ))}
                    </Group>
                </Chip.Group>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 8 }}>
                <Stack gap="md">
                    {filteredTeamEvents.map((event: TeamEvent) => (
                        <Paper
                            key={event.id}
                            withBorder
                            radius="md"
                            p="md"
                            bg="light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"
                        >
                            <Group align="flex-start" wrap="nowrap" gap="md">
                                <ThemeIcon
                                    radius="xl"
                                    size={38}
                                    variant="filled"
                                    color={getEventColor(event.type)}
                                >
                                    <IconBarbell size={18} />
                                </ThemeIcon>

                                <Stack gap={4}>
                                    <Text fw={700}>{event.title}</Text>

                                    <Group gap="xs" c="dimmed" fz="sm">
                                        <Text span>{formatTeamEventDate(event.date, event.startTime, event.endTime)} SH Stochov A Team</Text>
                                    </Group>
                                </Stack>
                            </Group>
                        </Paper>
                    ))}
                </Stack>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }} visibleFrom="md">
                <Group justify="center" mb="md">
                    <Calendar
                        locale="cs"
                        renderDay={(date) => {
                            const day = dayjs(date).date();
                            // Find events for this day
                            const eventsForDay = teamEvents.filter(event =>
                                dayjs(event.date).isSame(date, 'day')
                            );
                            return (
                                <>
                                    {eventsForDay.length > 0 ? (
                                        eventsForDay.map(event => (
                                            <Indicator
                                                key={event.id}
                                                size={6}
                                                color={getEventColor(event.type)}
                                                offset={-2}
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
        </Grid>

    )
}

export default EventsTable