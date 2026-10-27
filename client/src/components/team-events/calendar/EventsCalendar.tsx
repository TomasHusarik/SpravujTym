import type { TeamEvent } from '@/types/TeamEvent';
import FullCalendar from '@fullcalendar/react'
import './EventsCalendar.css';
import csLocale from '@fullcalendar/core/locales/cs'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list';
import { getEventColor, getEventCssColor } from '@/utils/helpers';
import { EventType } from '@/utils/const';
import { Badge, Group, LoadingOverlay, MultiSelect, Paper, Switch } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useMemo, useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { ErrorState } from '@/components/ui/StateViews';
import { useNavigate } from 'react-router';
import { getTeamEvents } from '@/utils/api';

const CANCELED_COLOR = 'var(--mantine-color-gray-5)';

const EventsCalendar = () => {
    const { data: teamEvents = [], loading, error, reload } = useAsyncData<TeamEvent[]>(getTeamEvents);
    const [selectedSquadIds, setSelectedSquadIds] = useState<string[]>([]);
    const [showCanceled, setShowCanceled] = useState(true);
    const isMobile = useMediaQuery('(max-width: 48em)');
    const navigate = useNavigate();

    // Squads that appear in the user's events
    const squadOptions = useMemo(() => {
        const squads = new Map<string, string>();
        for (const event of teamEvents) {
            for (const squad of event.squads ?? []) {
                if (squad?._id) squads.set(squad._id, squad.name ?? '');
            }
        }
        return [...squads].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'cs'));
    }, [teamEvents]);

    const calendarEvents = teamEvents
        .filter((event) => showCanceled || event.status !== 'canceled')
        .filter((event) =>
            selectedSquadIds.length === 0 || (event.squads ?? []).some((squad) => selectedSquadIds.includes(squad?._id))
        )
        .map(event => {
            const isCanceled = event.status === 'canceled';
            return {
                id: event._id,
                title: isCanceled ? `Zrušeno: ${event.title}` : event.title,
                start: event.startDate,
                end: event.endDate,
                color: isCanceled ? CANCELED_COLOR : getEventCssColor(event.type),
                classNames: isCanceled ? ['event-canceled'] : [],
                extendedProps: { type: event.type, isCanceled },
            };
        });

    if (error) return <ErrorState message={error} onRetry={reload} />;

    return (
        <Paper radius="lg" p={{ base: 'xs', sm: 'md' }} withBorder pos="relative">
            <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />
            <Group justify="space-between" mb="md" gap="sm" wrap="wrap">
                <MultiSelect
                    placeholder={selectedSquadIds.length ? undefined : 'Všechny celky'}
                    aria-label="Filtr celků"
                    data={squadOptions}
                    value={selectedSquadIds}
                    onChange={setSelectedSquadIds}
                    clearable
                    searchable
                    w={{ base: '100%', sm: 320 }}
                />
                <Group gap="xs" wrap="wrap">
                    {Object.values(EventType).map((type) => (
                        <Badge key={type.value} variant="dot" color={getEventColor(type.value)}>
                            {type.label}
                        </Badge>
                    ))}
                    <Switch
                        size="xs"
                        label="Zobrazit zrušené"
                        checked={showCanceled}
                        onChange={(e) => setShowCanceled(e.currentTarget.checked)}
                    />
                </Group>
            </Group>

            <div>
                <FullCalendar
                    key={isMobile ? 'mobile' : 'desktop'}
                    locale={csLocale}
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                    initialView={isMobile ? 'listMonth' : 'dayGridMonth'}
                    initialDate={new Date().toISOString().split('T')[0]} // Start from current month
                    allDaySlot={false}
                    height="auto"
                    headerToolbar={
                        isMobile
                            ? { left: 'prev,next', center: 'title', right: 'listMonth,dayGridMonth' }
                            : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listMonth' }
                    }
                    events={calendarEvents}
                    eventClick={(info) => {
                        info.jsEvent.preventDefault();
                        navigate(`/event-detail/${info.event.id}`);
                    }}
                    eventContent={(arg) => {
                        const isCanceled = arg.event.extendedProps.isCanceled;
                        // Only show the colored dot in dayGridMonth view
                        if (arg.view.type === 'dayGridMonth') {
                            const dotColor = isCanceled ? CANCELED_COLOR : getEventCssColor(arg.event.extendedProps.type || 'other');
                            return (
                                <div style={{ padding: '2px', fontSize: '0.85em', cursor: 'pointer' }}>
                                    <span>{arg.event.start.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })} - {arg.event.end?.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span style={{
                                        display: 'inline-block',
                                        width: 7,
                                        height: 7,
                                        borderRadius: '50%',
                                        backgroundColor: dotColor,
                                        marginLeft: 6,
                                        flexShrink: 0
                                    }} /><br />
                                    <strong style={{ wordBreak: 'break-word', whiteSpace: 'normal', textDecoration: isCanceled ? 'line-through' : undefined }}>
                                        {arg.event.title}
                                    </strong>
                                </div>
                            );
                        } else {
                            return (
                                <div style={{ padding: '2px', cursor: 'pointer' }}>
                                <strong style={{ wordBreak: 'break-word', textDecoration: isCanceled ? 'line-through' : undefined }}>{arg.event.title}</strong>
                                </div>
                            );
                        }
                    }}
                />
            </div>
        </Paper>
    )

};

export default EventsCalendar;
