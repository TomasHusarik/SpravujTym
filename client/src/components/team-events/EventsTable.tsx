import type { TeamEvent } from '@/types/TeamEvent';
import { updateParticipationStatus } from '@/utils/api';
import { formatTeamEventDate, getEventColor, getParticipationStatusColor } from '@/utils/helpers';
import { Group, Paper, Stack, ThemeIcon, Text, Select, Badge } from '@mantine/core';
import { IconBarbell } from '@tabler/icons-react';
import { ParticipationStatus } from '@/utils/const';
import React from 'react'
import { useNavigate } from 'react-router';

interface IEventsTable {
    filteredTeamEvents: TeamEvent[];
    handleStatusChange: (eventId: string | undefined, newStatus: string) => void;
}

const EventsTable = (props: IEventsTable) => {
    const { filteredTeamEvents, handleStatusChange } = props;

    const navigate = useNavigate();

    return (
        <Stack gap="md">
            {filteredTeamEvents?.map((event: TeamEvent) => (
                <Paper
                    key={event._id}
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

                        <Stack gap={4} flex={1}>
                            <Text
                                fw={700}
                                onClick={() => navigate(`/event-detail/${event._id}`)}
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                {event.title}
                            </Text>

                            <Group gap="xs" c="dimmed" fz="sm">
                                <Text span>{`${formatTeamEventDate(event.startDate!, event.endDate!)} ${event.venue.name}`}</Text>
                            </Group>
                        </Stack>

                        <Group gap="xs">
                            <Badge
                                color={getParticipationStatusColor(event.participations?.[0]?.status)}
                                variant="dot"
                                size="lg"
                            />
                            <Select
                                placeholder="Status"
                                data={Object.values(ParticipationStatus)}
                                value={event.participations?.[0]?.status || ParticipationStatus.PENDING.value}
                                onChange={(value) => handleStatusChange(event._id, value)}
                                w={150}
                                size="sm"
                            />
                        </Group>
                    </Group>
                </Paper>
            ))}
        </Stack>
    )
}

export default EventsTable