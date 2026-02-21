import type { TeamEvent } from "@/types/TeamEvent";

// Mock Data
export const mockTeamEvents: TeamEvent[] = [
    {
        _id: '1',
        title: 'Pondělní trénink',
        type: 'training',
        startDate: new Date('2026-02-09T18:00:00'),
        endDate: new Date('2026-02-09T20:00:00'),
        location: 'Sportovní hala Slovany',
        createdBy: 'Tomáš Husarik'
    },
    {
        _id: '2',
        title: 'Zápas proti HC Vsetín',
        type: 'match',
        startDate: new Date('2026-02-12T19:30:00'),
        endDate: new Date('2026-02-12T21:30:00'),
        location: 'Zimní stadion Vsetín',
        createdBy: 'Tomáš Husarik'
    },
    {
        _id: '3',
        title: 'Týmová schůzka',
        type: 'other',
        startDate: new Date('2026-02-15T10:00:00'),
        endDate: new Date('2026-02-15T11:30:00'),
        location: 'Klubovna - Online přes Teams',
        createdBy: 'Jan Novák'
    },
    {
        _id: '4',
        title: 'Víkendové soustředění',
        type: 'training',
        startDate: new Date('2026-02-20T09:00:00'),
        endDate: new Date('2026-02-20T18:00:00'),
        location: 'Sportovní areál Kunětická hora',
        createdBy: 'Tomáš Husarik'
    },
    {
        _id: '5',
        title: 'Juniorský turnaj',
        type: 'training',
        startDate: new Date('2026-02-28T08:00:00'),
        endDate: new Date('2026-02-28T17:00:00'),
        location: 'Sportovní hala Praha',
        createdBy: 'Petr Svoboda'
    },
    {
        _id: '6',
        title: 'Podmítácký trénink',
        type: 'training',
        startDate: new Date('2026-02-11T17:00:00'),
        endDate: new Date('2026-02-11T18:30:00'),
        location: 'Sportovní hala Slovany',
        createdBy: 'Tomáš Husarik'
    },
    {
        _id: '7',
        title: 'Přátelský zápas s TJ Svitavy',
        type: 'match',
        startDate: new Date('2026-03-02T18:00:00'),
        endDate: new Date('2026-03-02T20:00:00'),
        location: 'Stadion Svitavy',
        createdBy: 'Lukáš Dvořák'
    },
    {
        _id: '8',
        title: 'Charitativní turnaj mládeže',
        type: 'match',
        startDate: new Date('2026-03-08T09:00:00'),
        endDate: new Date('2026-03-08T15:30:00'),
        location: 'Sportovní areál Letná',
        createdBy: 'Martin Černý'
    },
    {
        _id: '9',
        title: 'Pohárové semifinále',
        type: 'match',
        startDate: new Date('2026-03-12T19:00:00'),
        endDate: new Date('2026-03-12T21:00:00'),
        location: 'Městská hala Kladno',
        createdBy: 'Tomáš Husarik'
    },
    {
        _id: '10',
        title: 'Regenerační trénink',
        type: 'training',
        startDate: new Date('2025-03-05T16:00:00'),
        endDate: new Date('2025-03-05T17:15:00'),
        location: 'Fitness centrum Atlas',
        createdBy: 'Petr Svoboda'
    },
    {
        _id: '11',
        title: 'Sezónní bilance',
        type: 'other',
        startDate: new Date('2025-03-10T18:30:00'),
        endDate: new Date('2025-03-10T20:00:00'),
        location: 'Klubovna',
        createdBy: 'Jan Novák'
    },
    {
        _id: '12',
        title: 'Výjezdní trénink',
        type: 'training',
        startDate: new Date('2026-04-01T17:00:00'),
        endDate: new Date('2026-04-01T19:00:00'),
        location: 'Hřiště Beroun',
        createdBy: 'Tomáš Husarik'
    },
    {
        _id: '13',
        title: 'Porada realizačního týmu',
        type: 'other',
        startDate: new Date('2026-03-20T20:00:00'),
        endDate: new Date('2026-03-20T21:00:00'),
        location: 'Online',
        createdBy: 'Petr Svoboda'
    },
    {
        _id: '14',
        title: 'Závěrečný zápas sezóny',
        type: 'match',
        startDate: new Date('2026-04-10T18:00:00'),
        endDate: new Date('2026-04-10T20:00:00'),
        location: 'Stadion Plzeň',
        createdBy: 'Tomáš Husarik'
    },
    {
        _id: '15',
        title: 'Teambuilding',
        type: 'other',
        startDate: new Date('2026-04-15T15:00:00'),
        endDate: new Date('2026-04-15T22:00:00'),
        location: 'Rekreační areál Šumava',
        createdBy: 'Jan Novák'
    }
];