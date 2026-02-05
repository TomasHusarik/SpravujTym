import { Anchor, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconBarbell } from '@tabler/icons-react';
import React, { useState } from 'react'
import { formatTeamEventDate } from '../helpers/helpers';

// Types
export type TeamEventType = 'training' | 'match' | 'other';

export interface TeamEvent {
    id: string;
    title: string;
    type: TeamEventType;
    date: Date;
    startTime: string;
    endTime: string;
    location: string;
    description?: string;
    participants?: number;
    maxParticipants?: number;
    isRequired: boolean;
    createdBy: string;
}

// Mock Data
export const mockEvents: TeamEvent[] = [
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
        title: 'Fotbalový turnaj - charita',
        type: 'match',
        date: new Date('2026-03-05'),
        startTime: '14:00',
        endTime: '18:00',
        location: 'Městský stadion',
        description: 'Charitativní akce - dobrovolná účast',
        participants: 8,
        maxParticipants: 15,
        isRequired: false,
        createdBy: 'Martin Černý'
    },
        {
        id: '8',
        title: 'Fotbalový turnaj - charita',
        type: 'match',
        date: new Date('2026-03-05'),
        startTime: '14:00',
        endTime: '18:00',
        location: 'Městský stadion',
        description: 'Charitativní akce - dobrovolná účast',
        participants: 8,
        maxParticipants: 15,
        isRequired: false,
        createdBy: 'Martin Černý'
    },
        {
        id: '9',
        title: 'Fotbalový turnaj - charita',
        type: 'match',
        date: new Date('2026-03-05'),
        startTime: '14:00',
        endTime: '18:00',
        location: 'Městský stadion',
        description: 'Charitativní akce - dobrovolná účast',
        participants: 8,
        maxParticipants: 15,
        isRequired: false,
        createdBy: 'Martin Černý'
    }
];

const Overview = () => {
    const [teamEvents, setTeamEvents] = useState<TeamEvent[]>(mockEvents);

    return (
        <Stack gap="md">
            {teamEvents.map((event: TeamEvent) => (
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
                            color={"green"}
                        >
                            <IconBarbell size={18} />
                        </ThemeIcon>

                        <Stack gap={4}>
                            <Text fw={700}>{event.title}</Text>

                            <Group gap="xs" c="dimmed" fz="sm">
                                <Text span>{formatTeamEventDate(event.date, event.startTime, event.endTime)}</Text>
                            </Group>
                        </Stack>
                    </Group>
                </Paper>
            ))}
        </Stack>
    )
}

export default Overview