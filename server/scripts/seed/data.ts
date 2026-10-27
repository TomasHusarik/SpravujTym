// Static fake data used by the seed script. All people, e-mails and phone numbers are fictional.
import { LeagueCategory } from '@models/League';
import { PlayerPosition } from '@models/SquadMembership';

export const SEED_PASSWORD = 'Test1234!';

// Reserved .test domain - the mailer never sends e-mails to these addresses
export const EMAIL_DOMAIN = 'spravujtym.test';

// Same id as the default `teamId` in client/src/config/config.ts, so the client works without changes
export const TEAM_ID = '699ec4679a3aebfee8e290c5';

export const TEAM = {
    name: 'Blue Horses Stochov',
    shortName: 'BHS',
    city: 'Stochov',
    // Example IBAN from Czech banking documentation (not a real account)
    iban: 'CZ6508000000192000145399',
    currency: 'CZK',
};

export const VENUES = [
    { key: 'hall', name: 'Sportovní hala Stochov', city: 'Stochov', address: 'Sportovní 101, 273 03 Stochov', capacity: 300 },
    { key: 'school', name: 'Tělocvična ZŠ Stochov', city: 'Stochov', address: 'Školní 202, 273 03 Stochov', capacity: 80 },
    { key: 'away', name: 'Městská hala Horní Dolní', city: 'Horní Dolní', address: 'Na Výsluní 7, 999 01 Horní Dolní', capacity: 500 },
] as const;

export type VenueKey = typeof VENUES[number]['key'];

export const SEASON = '2026/2027';

type TrainingSlot = {
    weekday: number; // 0 = Sunday ... 6 = Saturday
    start: string;
    end: string;
    venue: VenueKey;
};

export type SquadSeed = {
    key: string;
    name: string;
    league: string;
    category: LeagueCategory;
    birthYears: [number, number];
    playerCount: number;
    membershipFee: number;
    trainings: TrainingSlot[];
    matchStart: string;
};

export const SQUADS: SquadSeed[] = [
    {
        key: 'menA', name: 'Muži A', league: 'Divize mužů', category: LeagueCategory.Men,
        birthYears: [1988, 2005], playerCount: 16, membershipFee: 2500,
        trainings: [
            { weekday: 2, start: '19:00', end: '20:30', venue: 'hall' },
            { weekday: 4, start: '19:00', end: '20:30', venue: 'hall' },
        ],
        matchStart: '17:00',
    },
    {
        key: 'menB', name: 'Muži B', league: 'Regionální liga mužů', category: LeagueCategory.Men,
        birthYears: [1980, 2005], playerCount: 13, membershipFee: 2000,
        trainings: [{ weekday: 1, start: '20:00', end: '21:30', venue: 'hall' }],
        matchStart: '19:00',
    },
    {
        key: 'juniors', name: 'Junioři', league: 'Liga juniorů', category: LeagueCategory.Juniors,
        birthYears: [2007, 2008], playerCount: 14, membershipFee: 2000,
        trainings: [
            { weekday: 1, start: '17:30', end: '19:00', venue: 'hall' },
            { weekday: 3, start: '17:30', end: '19:00', venue: 'hall' },
        ],
        matchStart: '13:00',
    },
    {
        key: 'cadets', name: 'Dorost', league: 'Liga dorostenců', category: LeagueCategory.Cadets,
        birthYears: [2009, 2010], playerCount: 13, membershipFee: 1800,
        trainings: [
            { weekday: 2, start: '17:00', end: '18:30', venue: 'hall' },
            { weekday: 4, start: '17:00', end: '18:30', venue: 'hall' },
        ],
        matchStart: '11:00',
    },
    {
        key: 'olderPupils', name: 'Starší žáci', league: 'Krajská liga starších žáků', category: LeagueCategory.OlderPupils,
        birthYears: [2011, 2012], playerCount: 14, membershipFee: 1500,
        trainings: [
            { weekday: 3, start: '16:00', end: '17:15', venue: 'school' },
            { weekday: 5, start: '16:00', end: '17:15', venue: 'school' },
        ],
        matchStart: '09:00',
    },
    {
        key: 'youngerPupils', name: 'Mladší žáci', league: 'Krajská liga mladších žáků', category: LeagueCategory.YoungerPupils,
        birthYears: [2013, 2014], playerCount: 12, membershipFee: 1500,
        trainings: [
            { weekday: 2, start: '15:30', end: '16:30', venue: 'school' },
            { weekday: 4, start: '15:30', end: '16:30', venue: 'school' },
        ],
        matchStart: '10:00',
    },
];

// Fixed accounts for each role - documented in README.md
export const TEST_ACCOUNTS = {
    admin: { email: `admin@${EMAIL_DOMAIN}`, firstName: 'Jana', lastName: 'Správcová', mobile: '+420 700 000 001', birthDate: '1979-05-14' },
    coach: { email: `trener@${EMAIL_DOMAIN}`, firstName: 'Martin', lastName: 'Trenérský', mobile: '+420 700 000 002', birthDate: '1985-09-02' },
    youthCoach: { email: `trener.mladez@${EMAIL_DOMAIN}`, firstName: 'Lucie', lastName: 'Dvořáková', mobile: '+420 700 000 003', birthDate: '1991-03-21' },
    player: { email: `hrac@${EMAIL_DOMAIN}`, firstName: 'Tomáš', lastName: 'Hráčský', mobile: '+420 700 000 004', birthDate: '1998-11-30' },
    newUser: { email: `novacek@${EMAIL_DOMAIN}`, firstName: '', lastName: '', mobile: '', birthDate: '' },
};

// Additional coaches (some of them also play for Muži A)
export const EXTRA_COACHES = [
    { firstName: 'Pavel', lastName: 'Kratochvíl', birthDate: '1983-01-17' },
    { firstName: 'Ondřej', lastName: 'Beneš', birthDate: '1990-07-08' },
    { firstName: 'Radek', lastName: 'Fiala', birthDate: '1987-12-03' },
];

export const FIRST_NAMES = [
    'Jakub', 'Jan', 'Tomáš', 'Matyáš', 'Adam', 'Filip', 'Vojtěch', 'Lukáš', 'Martin', 'Matěj',
    'Ondřej', 'David', 'Daniel', 'Šimon', 'Petr', 'Michal', 'Dominik', 'Antonín', 'Tobiáš', 'Marek',
    'Václav', 'Josef', 'Štěpán', 'Kryštof', 'Vít', 'Jiří', 'Pavel', 'Lukáš', 'Patrik', 'Richard',
];

// Surnames are listed in the male form (all seeded squads are male)
export const LAST_NAMES = [
    'Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec',
    'Pokorný', 'Marek', 'Pospíšil', 'Hájek', 'Jelínek', 'Král', 'Růžička', 'Beneš', 'Fiala', 'Sedláček',
    'Doležal', 'Zeman', 'Kolář', 'Navrátil', 'Čermák', 'Urban', 'Vaněk', 'Blažek', 'Kříž', 'Kovář',
    'Bartoš', 'Vlček', 'Polák', 'Musil', 'Kopecký', 'Šimek', 'Konečný', 'Malý', 'Holub', 'Štěpánek',
];

export const POSITION_PLAN: PlayerPosition[] = [
    PlayerPosition.Goalkeeper, PlayerPosition.Goalkeeper,
    PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender,
];

export const OPPONENTS = [
    'FbK Orli Horní Dolní', 'SK Modrá Lhota', 'Florbal Dolní Zálesí', 'TJ Sokol Pětidomí',
    'FBC Lvi Nová Ves', 'Florbal Kamenný Most', 'SC Bílý Potok', 'FbŠ Zelená Hora',
];

export const DECLINE_REASONS = ['Nemoc', 'Práce', 'Škola', 'Rodinné důvody', 'Zranění', 'Dovolená'];

export const EVENT_COMMENTS = [
    'Vezmu míčky a rozlišováky.',
    'Dorazím asi o 10 minut později.',
    'Nezapomeňte si světlé i tmavé dresy.',
    'Kdo jede autem? Potřebuji svézt.',
    'Sraz 30 minut před začátkem v šatně.',
    'Dneska prosím všichni včas, budeme fotit týmovou fotku.',
];

export const ANNOUNCEMENTS = [
    {
        title: 'Nábor nových hráčů 2026/2027',
        visibility: 'public',
        pinned: true,
        content: '<p>Hledáme nové hráče do všech mládežnických kategorií. Přijďte si zkusit trénink – <strong>první měsíc zdarma</strong>.</p><p>Tréninky probíhají ve Sportovní hale Stochov.</p>',
        daysAgo: 20,
    },
    {
        title: 'Domácí zápas Muži A v sobotu',
        visibility: 'public',
        pinned: false,
        content: '<p>Přijďte podpořit naše muže v sobotním domácím utkání. Vstup zdarma, občerstvení zajištěno.</p>',
        daysAgo: 3,
    },
    {
        title: 'Členské příspěvky na podzim',
        visibility: 'private',
        pinned: true,
        content: '<p>Připomínáme splatnost členských příspěvků. QR kód pro platbu najdete ve svém profilu v sekci <em>Platby</em>.</p>',
        daysAgo: 30,
    },
    {
        title: 'Nové dresy jsou tady',
        visibility: 'private',
        pinned: false,
        content: '<p>Nové sady dresů si můžete vyzvednout u trenérů na nejbližším tréninku.</p>',
        daysAgo: 12,
    },
    {
        title: 'Změna haly v listopadu',
        visibility: 'private',
        pinned: false,
        content: '<p>Kvůli rekonstrukci podlahy budou některé tréninky žáků v tělocvičně ZŠ. Sledujte prosím kalendář.</p>',
        daysAgo: 6,
    },
    {
        title: 'Vánoční turnaj',
        visibility: 'public',
        pinned: false,
        content: '<p>Tradiční vánoční turnaj rodičů a dětí proběhne v prosinci. Podrobnosti brzy.</p>',
        daysAgo: 1,
    },
] as const;
