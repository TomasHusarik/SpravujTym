import type { TeamEvent } from '@/types/TeamEvent';
import { formatTeamEventDate, getEventColor } from '@/utils/helpers';
import { Group, Paper, Stack, ThemeIcon, Text } from '@mantine/core';
import { IconBarbell } from '@tabler/icons-react';
import React from 'react'

interface IEventsTable {
    filteredTeamEvents: TeamEvent[];
}

const EventsTable = (props: IEventsTable) => {
    const { filteredTeamEvents } = props;

    return (
        <Stack gap="md">
            {filteredTeamEvents.map((event: TeamEvent) => (
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

                        <Stack gap={4}>
                            <Text fw={700}>{event.title}</Text>

                            <Group gap="xs" c="dimmed" fz="sm">
                                <Text span>{formatTeamEventDate(event.startDate!, event.endDate!)} SH Stochov A Team</Text>
                            </Group>
                        </Stack>
                    </Group>
                </Paper>
            ))}
        </Stack>
    )
}

export default EventsTable