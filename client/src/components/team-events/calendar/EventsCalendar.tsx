import type { TeamEvent } from '@/types/TeamEvent';
import FullCalendar from '@fullcalendar/react'
import './EventsCalendar.css';
import csLocale from '@fullcalendar/core/locales/cs'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list';
import { getEventColor } from '@/utils/helpers';
import { useComputedColorScheme } from '@mantine/core';
import { useEffect, useState } from 'react';
import { getParticipantTeamEvents } from '@/utils/api';

const EventsCalendar = () => {
    const [teamEvents, setTeamEvents] = useState<TeamEvent[]>([]);
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    const calendarEvents = teamEvents.map(event => ({
        id: event._id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        color: getEventColor(event.type)
    }));

    const loadData = async () => {
        try {
            const events = await getParticipantTeamEvents();
            setTeamEvents(events);
        } catch (error) {
            console.error('Error fetching team events:', error);
        }
    };

    useEffect(() => {
      loadData();
    }, []);

    return (
        <div className={computedColorScheme === 'dark' ? 'calendar-dark-mode' : ''}>
            <FullCalendar
                locale={csLocale}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                initialView="listMonth"
                initialDate={new Date().toISOString().split('T')[0]} // Start from current month
                allDaySlot={false}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,listMonth'
                }}
                events={calendarEvents}
                eventContent={(arg) => {
                    // Only show the colored dot in dayGridMonth view
                    if (arg.view.type === 'dayGridMonth') {
                        const dotColor = getEventColor(teamEvents.find(e => e._id === arg.event.id)?.type || 'other');
                        return (
                            <div style={{ padding: '2px', fontSize: '0.85em', overflow: "", }}>
                                <span>{arg.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {arg.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span style={{
                                    display: 'inline-block',
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    backgroundColor: dotColor,
                                    marginLeft: 6,
                                    flexShrink: 0
                                }} /><br />
                                <strong style={{wordBreak: 'break-word', whiteSpace: 'normal' }}>{arg.event.title}</strong>
                            </div>
                        );
                    } else {
                        return (
                            <div style={{ padding: '2px' }}>
                            <strong style={{ wordBreak: 'break-word' }}>{arg.event.title}</strong>
                            </div>
                        );
                    }
                }}
            />
        </div>
    )

};

export default EventsCalendar;