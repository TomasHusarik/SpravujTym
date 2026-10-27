import { Badge, Button, Card, Grid, Group, Indicator, SegmentedControl, Stack, Switch, Text, Title } from '@mantine/core';
import { useMemo, useState } from 'react'
import { formatTeamEventDate, getEventColor, getParticipationStatusColor, isEventFinished, useExtendedPermissions } from '@/utils/helpers';
import type { TeamEvent } from '@/types/TeamEvent';
import type { EventParticipation } from '@/types/EventParticipation';
import { Calendar } from '@mantine/dates';
import dayjs from 'dayjs';
import EventsTable from './EventsTable';
import RsvpButtons from './RsvpButtons';
import { getTeamEvents, updateParticipationStatus } from '@/utils/api';
import { ParticipationStatus } from '@/utils/const';
import { useNavigate } from 'react-router';
import { DonutChart } from '@mantine/charts';
import { IconCalendarOff, IconMapPin, IconPlus } from '@tabler/icons-react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '../ui/PageHeader';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/StateViews';

type Period = 'upcoming' | 'past';

const isEventUpcoming = (event: TeamEvent) => new Date(event.endDate) >= new Date();

const Overview = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const hasExtendedPermissions = useExtendedPermissions();

    const [period, setPeriod] = useState<Period>('upcoming');
    const [showManagedEvents, setShowManagedEvents] = useState(false);

    const { data: teamEvents = [], loading, error, reload, setData } = useAsyncData<TeamEvent[]>(getTeamEvents);

    // Events the user is invited to (managed events of coaches have no own participation)
    const myEvents = useMemo(() => teamEvents.filter((event) => (event.eventParticipations?.length ?? 0) > 0), [teamEvents]);

    const filteredTeamEvents = useMemo(() => (showManagedEvents ? teamEvents : myEvents)
        .filter((event) => (period === 'upcoming' ? isEventUpcoming(event) : !isEventUpcoming(event)))
        .sort((a, b) => {
            const difference = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            return period === 'upcoming' ? difference : -difference;
        }), [teamEvents, myEvents, showManagedEvents, period]);

    // The next event the user should answer or attend
    const nextEvent = useMemo(() => myEvents
        .filter((event) => isEventUpcoming(event) && event.status !== 'canceled')
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0], [myEvents]);

    // My answers for past events that took place
    const attendance = useMemo(() => {
        const statuses = myEvents
            .filter((event) => !isEventUpcoming(event) && event.status !== 'canceled')
            .map((event) => event.eventParticipations?.[0]?.status);
        const confirmed = statuses.filter((status) => status === 'confirmed').length;

        return {
            total: statuses.length,
            rate: statuses.length ? Math.round((confirmed / statuses.length) * 100) : null,
            chart: Object.values(ParticipationStatus).map((option) => ({
                name: option.label,
                value: statuses.filter((status) => status === option.value).length,
                color: getParticipationStatusColor(option.value),
            })),
        };
    }, [myEvents]);

    // Errors are shown by RsvpButtons
    const handleStatusChange = async (eventId: string | undefined, newStatus: string, note?: string) => {
        await updateParticipationStatus(eventId, newStatus, note);
        setData((events = []) => events.map((event) =>
            event._id === eventId
                ? {
                    ...event,
                    eventParticipations: event.eventParticipations?.map((p) => ({ ...p, status: newStatus as EventParticipation['status'], note }))
                }
                : event
        ));
    };

    const renderList = () => {
        if (loading) return <ListSkeleton rows={5} />;
        if (error) return <ErrorState message={error} onRetry={reload} />;
        if (filteredTeamEvents.length === 0) {
            return (
                <EmptyState
                    icon={<IconCalendarOff size={24} />}
                    title={period === 'upcoming' ? 'Žádné nadcházející události' : 'Žádné minulé události'}
                    description={period === 'upcoming'
                        ? 'Jakmile vás trenér pozve na trénink nebo zápas, uvidíte ho tady.'
                        : 'Zatím jste se neúčastnili žádné události.'}
                />
            );
        }
        return <EventsTable filteredTeamEvents={filteredTeamEvents} handleStatusChange={handleStatusChange} />;
    };

    return (
        <>
            <PageHeader
                title="Přehled"
                description={user?.firstName ? `Ahoj, ${user.firstName}! Tady je, co vás čeká.` : 'Vaše události a účast.'}
                actions={hasExtendedPermissions && (
                    <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/event-detail')}>
                        Nová událost
                    </Button>
                )}
            />

            <Grid gutter="lg">
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Stack gap="md">
                        {nextEvent && (
                            <Card
                                p="lg"
                                style={{ borderLeft: `4px solid var(--mantine-color-${getEventColor(nextEvent.type)}-6)` }}
                            >
                                <Text size="xs" tt="uppercase" fw={700} c="dimmed">Nejbližší akce</Text>
                                <Group justify="space-between" align="flex-end" mt={4} gap="sm">
                                    <Stack gap={2} style={{ minWidth: 0 }}>
                                        <Title
                                            order={2}
                                            size="h3"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/event-detail/${nextEvent._id}`)}
                                        >
                                            {nextEvent.title}
                                        </Title>
                                        <Text size="sm">{formatTeamEventDate(nextEvent.startDate, nextEvent.endDate)}</Text>
                                        {nextEvent.venue?.name && (
                                            <Group gap={4}>
                                                <IconMapPin size={14} />
                                                <Text size="sm" c="dimmed">{nextEvent.venue.name}</Text>
                                            </Group>
                                        )}
                                    </Stack>
                                    <RsvpButtons
                                        status={nextEvent.eventParticipations?.[0]?.status}
                                        note={nextEvent.eventParticipations?.[0]?.note}
                                        disabled={isEventFinished(nextEvent)}
                                        onChange={(status, note) => handleStatusChange(nextEvent._id, status, note)}
                                    />
                                </Group>
                            </Card>
                        )}

                        <Group justify="space-between" wrap="wrap" gap="sm">
                            <SegmentedControl
                                value={period}
                                onChange={(value) => setPeriod(value as Period)}
                                data={[
                                    { value: 'upcoming', label: 'Nadcházející' },
                                    { value: 'past', label: 'Minulé' },
                                ]}
                            />
                            <Group gap="sm">
                                {hasExtendedPermissions && (
                                    <Switch
                                        checked={showManagedEvents}
                                        onChange={(event) => setShowManagedEvents(event.currentTarget.checked)}
                                        label="Včetně spravovaných"
                                    />
                                )}
                                {!loading && <Badge variant="light" size="lg">{filteredTeamEvents.length}</Badge>}
                            </Group>
                        </Group>

                        {renderList()}
                    </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Stack gap="md">
                        <Card>
                            <Text fw={700}>Moje docházka</Text>
                            <Text size="xs" c="dimmed">Odpovědi u proběhlých událostí</Text>
                            {attendance.total === 0 ? (
                                <Text size="sm" c="dimmed" mt="md">Zatím žádné proběhlé události.</Text>
                            ) : (
                                <Group mt="md" gap="lg" wrap="nowrap">
                                    <DonutChart
                                        size={120}
                                        thickness={16}
                                        chartLabel={`${attendance.rate} %`}
                                        data={attendance.chart}
                                        withTooltip={false}
                                    />
                                    <Stack gap={4}>
                                        {attendance.chart.map((item) => (
                                            <Group key={item.name} gap={6} wrap="nowrap">
                                                <Badge variant="dot" color={item.color} size="sm">{item.name}</Badge>
                                                <Text size="sm" fw={600}>{item.value}</Text>
                                            </Group>
                                        ))}
                                    </Stack>
                                </Group>
                            )}
                        </Card>

                        <Card visibleFrom="md">
                            <Calendar
                                locale="cs"
                                renderDay={(date) => {
                                    const day = dayjs(date).date();
                                    const eventsForDay = myEvents.filter(event =>
                                        event.status !== 'canceled' && dayjs(event.startDate).isSame(date, 'day')
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
                        </Card>
                    </Stack>
                </Grid.Col>
            </Grid>
        </>
    )
}

export default Overview
