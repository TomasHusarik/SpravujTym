import type { TeamEvent } from '@/types/TeamEvent';
import { formatTeamEventDate, getEventColor, isEventFinished } from '@/utils/helpers';
import { Badge, Box, Card, Group, Paper, Stack, Text, ThemeIcon, Tooltip, UnstyledButton } from '@mantine/core';
import { IconBallFootball, IconBan, IconBarbell, IconCalendarEvent, IconRepeat } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import RsvpButtons from './RsvpButtons';

interface IEventsTable {
    filteredTeamEvents: TeamEvent[];
    handleStatusChange: (eventId: string | undefined, newStatus: string, note?: string) => Promise<void>;
}

const getEventIcon = (type: string) => {
    if (type === 'match') return IconBallFootball;
    if (type === 'training') return IconBarbell;
    return IconCalendarEvent;
};

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
                const isCanceled = event.status === 'canceled';
                const Icon = getEventIcon(event.type);

                return (
                    <Card
                        key={event._id}
                        padding="md"
                        style={isCanceled ? { opacity: 0.75 } : undefined}
                    >
                        <Group align="flex-start" gap="md" wrap="nowrap">

                            <ThemeIcon
                                radius="xl"
                                size={38}
                                variant="light"
                                color={isCanceled ? 'gray' : getEventColor(event.type)}
                            >
                                {isCanceled ? <IconBan size={18} /> : <Icon size={18} />}
                            </ThemeIcon>

                            <Stack gap={2} flex={1} miw={0}>

                                <UnstyledButton onClick={() => navigate(`/event-detail/${event._id}`)}>
                                    <Group gap={6} wrap="nowrap">
                                        <Text fw={700} td={isCanceled ? 'line-through' : undefined} truncate>
                                            {event.title}
                                        </Text>
                                        {event.series && (
                                            <Tooltip label="Opakovaná událost" withArrow>
                                                <IconRepeat size={14} aria-label="Opakovaná událost" />
                                            </Tooltip>
                                        )}
                                    </Group>
                                </UnstyledButton>

                                <Text size="sm" c="dimmed">
                                    {formatTeamEventDate(event.startDate!, event.endDate!)} {event.venue?.name ?? ''}
                                </Text>

                                {isCanceled && (
                                    <Group gap={6}>
                                        <Badge color="red" variant="light" size="sm">Zrušeno</Badge>
                                        {event.cancelReason && (
                                            <Text size="xs" c="dimmed">{event.cancelReason}</Text>
                                        )}
                                    </Group>
                                )}

                                {/* MOBILE RSVP */}
                                {participation && !isCanceled && (
                                    <Box hiddenFrom="sm" mt={6}>
                                        <RsvpButtons
                                            size="xs"
                                            fullWidth
                                            status={participation.status}
                                            note={participation.note}
                                            disabled={isEventFinished(event)}
                                            onChange={(status, note) => handleStatusChange(event._id, status, note)}
                                        />
                                    </Box>
                                )}

                            </Stack>

                            {/* DESKTOP RSVP */}
                            {participation && !isCanceled && (
                                <Box visibleFrom="sm">
                                    <RsvpButtons
                                        size="xs"
                                        status={participation.status}
                                        note={participation.note}
                                        disabled={isEventFinished(event)}
                                        onChange={(status, note) => handleStatusChange(event._id, status, note)}
                                    />
                                </Box>
                            )}

                        </Group>
                    </Card>
                );
            })}
        </Stack>
    )
}

export default EventsTable;
