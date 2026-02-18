import type { TeamEvent } from '@/types/TeamEvent';
import FullCalendar from '@fullcalendar/react'
import './EventsCalendar.css';
import csLocale from '@fullcalendar/core/locales/cs'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list';
import { getEventColor } from '@/utils/helpers';
import { useComputedColorScheme } from '@mantine/core';

// Mock Data
export const teamEvents: any[] = [
    {
        id: '1',
        title: 'Pondělní trénink',
        type: 'training',
        start: new Date('2026-02-09T18:00:00'),
        end: new Date('2026-02-09T20:00:00'),
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
        start: new Date('2026-02-12T19:30:00'),
        end: new Date('2026-02-12T21:30:00'),
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
        start: new Date('2026-02-15T10:00:00'),
        end: new Date('2026-02-15T11:30:00'),
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
        start: new Date('2026-02-20T09:00:00'),
        end: new Date('2026-02-20T18:00:00'),
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
        start: new Date('2026-02-28T08:00:00'),
        end: new Date('2026-02-28T17:00:00'),
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
        start: new Date('2026-02-11T17:00:00'),
        end: new Date('2026-02-11T18:30:00'),
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
        start: new Date('2026-03-02T18:00:00'),
        end: new Date('2026-03-02T20:00:00'),
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
        start: new Date('2026-03-08T09:00:00'),
        end: new Date('2026-03-08T15:30:00'),
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
        start: new Date('2026-03-12T19:00:00'),
        end: new Date('2026-03-12T21:00:00'),
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
        start: new Date('2025-03-05T16:00:00'),
        end: new Date('2025-03-05T17:15:00'),
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
        start: new Date('2025-03-10T18:30:00'),
        end: new Date('2025-03-10T20:00:00'),
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
        start: new Date('2026-04-01T17:00:00'),
        end: new Date('2026-04-01T19:00:00'),
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
        start: new Date('2026-03-20T20:00:00'),
        end: new Date('2026-03-20T21:00:00'),
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
        start: new Date('2026-04-10T18:00:00'),
        end: new Date('2026-04-10T20:00:00'),
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
        start: new Date('2026-04-15T15:00:00'),
        end: new Date('2026-04-15T22:00:00'),
        location: 'Rekreační areál Šumava',
        description: 'Společné aktivity mimo hřiště',
        participants: 20,
        maxParticipants: 30,
        isRequired: false,
        createdBy: 'Jan Novák'
    }
];

const EventsCalendar = () => {

    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
    console.log('Computed color scheme:', computedColorScheme);


    const calendarEvents = teamEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        color: getEventColor(event.type)
    }));

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
                        const dotColor = getEventColor(teamEvents.find(e => e.id === arg.event.id)?.type || 'other');
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