import type { TeamEvent } from '@/types/TeamEvent';
import { formatTeamEventDate, getEventColor, getParticipationStatusColor } from '@/utils/helpers';
import { Group, Paper, Stack, ThemeIcon, Text, Select, Badge, Box } from '@mantine/core';
import { IconBarbell } from '@tabler/icons-react';
import { ParticipationStatus } from '@/utils/const';
import React from 'react'
import { useNavigate } from 'react-router';

interface IEventsTable {
    filteredTeamEvents: TeamEvent[];
    handleStatusChange: (eventId: string | undefined, newStatus: string) => void;
}

const EventsTable = ({ filteredTeamEvents, handleStatusChange }: IEventsTable) => {

    const navigate = useNavigate();

    if (!filteredTeamEvents?.length) {
        return (
            <Paper withBorder radius="md" p="xl">
                <Stack align="center" gap={4}>
                    <Text fw={600}>Žádné události k zobrazení</Text>
                    <Text size="sm" c="dimmed">
                        Zkus změnit vybraný filtr období nebo účasti.
                    </Text>
                </Stack>
            </Paper>
        );
    }

    return (
        <Stack gap="md">
            {filteredTeamEvents.map((event) => {

                const participation = event.eventParticipations?.[0];

                return (
                    <Paper
                        key={event._id}
                        withBorder
                        radius="md"
                        p="md"
                        bg="light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"
                    >

                        {/* MAIN ROW */}
                        <Group align="flex-start" gap="md">

                            {/* ICON */}
                            <ThemeIcon
                                radius="xl"
                                size={38}
                                variant="filled"
                                color={getEventColor(event.type)}
                            >
                                <IconBarbell size={18} />
                            </ThemeIcon>

                            {/* TEXT */}
                            <Stack gap={2} flex={1}>

                                <Text
                                    fw={700}
                                    onClick={() => navigate(`/event-detail/${event._id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {event.title}
                                </Text>

                                <Text size="sm" c="dimmed">
                                    {formatTeamEventDate(event.startDate!, event.endDate!)} {event.venue?.name ?? ''}
                                </Text>

                                {/* MOBILE STATUS */}
                                {participation && (
                                    <Box hiddenFrom="sm" mt={6}>
                                        <Group gap="xs">
                                            <Badge
                                                color={getParticipationStatusColor(participation.status)}
                                                variant="dot"
                                            />

                                            <Select
                                                data={Object.values(ParticipationStatus)}
                                                value={participation.status}
                                                onChange={(value) => handleStatusChange(event._id, value)}
                                                size="xs"
                                                flex={1}
                                            />
                                        </Group>
                                    </Box>
                                )}

                            </Stack>

                            {/* DESKTOP STATUS */}
                            {participation && (
                                <Group gap="xs" visibleFrom="sm">
                                    <Badge
                                        color={getParticipationStatusColor(participation.status)}
                                        variant="dot"
                                    />

                                    <Select
                                        data={Object.values(ParticipationStatus)}
                                        value={participation.status}
                                        onChange={(value) => handleStatusChange(event._id, value)}
                                        w={150}
                                        size="sm"
                                    />
                                </Group>
                            )}

                        </Group>
                    </Paper>
                );
            })}
        </Stack>
    )
}

export default EventsTable;