/**
 * Seed script for the development / test database.
 *
 *   npm run seed       - fills an EMPTY database with demo data
 *   npm run db:reset   - drops all collections of a database created by this script and seeds it again
 *
 * Safety rules:
 *   - never runs with NODE_ENV=production
 *   - never touches a non-empty database unless --reset is used
 *   - --reset only wipes a database that was created by this script (marked in the `seedmeta` collection);
 *     wiping any other database requires --force on top of --reset
 */
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import env from '@utils/validateEnv';
import { generateOccurrences, previousDay } from '@utils/recurrence';
import { formatEventDateTime } from '@utils/dates';

import User from '@models/User';
import Team from '@models/Team';
import Venue from '@models/Venue';
import League from '@models/League';
import Squad from '@models/Squad';
import SquadMembership, { PlayerPosition, SquadRole } from '@models/SquadMembership';
import TeamEvent, { TeamEventStatus, TeamEventType } from '@models/TeamEvent';
import EventSeries, { RecurrenceFrequency } from '@models/EventSeries';
import EventParticipation, { EventParticipationStatus } from '@models/EventParticipation';
import Comment from '@models/Comment';
import Announcement from '@models/Announcement';
import Payment, { PaymentStatus, PaymentType } from '@models/Payment';
import Notification, { NotificationType } from '@models/Notification';

import {
    ANNOUNCEMENTS, DECLINE_REASONS, EMAIL_DOMAIN, EVENT_COMMENTS, EXTRA_COACHES, FIRST_NAMES, LAST_NAMES, OPPONENTS,
    POSITION_PLAN, SEASON, SEED_PASSWORD, SQUADS, SquadSeed, TEAM, TEAM_ID, TEST_ACCOUNTS, VENUES, VenueKey,
} from './seed/data';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Europe/Prague';
const SEED_META_COLLECTION = 'seedmeta';
const SEED_VERSION = 4;
const WEEKS_BACK = 6;
const WEEKS_AHEAD = 8;

const args = new Set(process.argv.slice(2));
const reset = args.has('--reset');
const force = args.has('--force');

//#region Helpers

// Deterministic pseudo-random generator so every seed run produces the same data
const createRandom = (seed: number) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const random = createRandom(20261026);
const randomInt = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;
const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
const chance = (probability: number) => random() < probability;

const removeDiacritics = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const randomMobile = () =>
    `+420 7${randomInt(20, 99)} ${randomInt(100, 999)} ${randomInt(100, 999)}`;

const randomBirthDate = ([fromYear, toYear]: [number, number]) =>
    dayjs.tz(`${randomInt(fromYear, toYear)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`, TZ).toDate();

// Local Prague time -> Date (handles daylight saving time correctly)
const atLocalTime = (day: Dayjs, time: string) => dayjs.tz(`${day.format('YYYY-MM-DD')} ${time}`, TZ);

//#endregion

//#region Database safety

const getCollectionCounts = async () => {
    const db = mongoose.connection.db!;
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const counts: Record<string, number> = {};

    for (const { name } of collections) {
        if (name.startsWith('system.')) continue;
        counts[name] = await db.collection(name).countDocuments();
    }

    return counts;
};

const prepareDatabase = async () => {
    const db = mongoose.connection.db!;
    const counts = await getCollectionCounts();
    const isEmpty = Object.values(counts).every((count) => count === 0);
    const wasSeeded = (counts[SEED_META_COLLECTION] ?? 0) > 0;

    console.log(`Target database: "${db.databaseName}"`);

    if (isEmpty) return;

    if (!reset) {
        throw new Error(
            `Database "${db.databaseName}" is not empty. Run "npm run db:reset" to replace its data with seed data.`
        );
    }

    if (!wasSeeded && !force) {
        console.log('Existing data:', counts);
        throw new Error(
            `Database "${db.databaseName}" contains data that was not created by the seed script. ` +
            'Refusing to delete it. Use "npm run db:reset -- --force" only if you are sure this data can be lost.'
        );
    }

    console.log('Dropping existing collections...');
    for (const name of Object.keys(counts)) {
        await db.dropCollection(name);
    }
};

//#endregion

//#region Seed steps

type SeededUser = { _id: Types.ObjectId; email: string; firstName: string; lastName: string };

type SquadContext = {
    seed: SquadSeed;
    squadId: Types.ObjectId;
    coachIds: Types.ObjectId[];
    playerIds: Types.ObjectId[];
};

const usedEmails = new Set<string>();

const buildEmail = (firstName: string, lastName: string) => {
    const base = removeDiacritics(`${firstName}.${lastName}`).toLowerCase();
    let email = `${base}@${EMAIL_DOMAIN}`;
    let suffix = 2;

    while (usedEmails.has(email)) {
        email = `${base}${suffix}@${EMAIL_DOMAIN}`;
        suffix += 1;
    }

    usedEmails.add(email);
    return email;
};

const seedUsers = async (passwordHash: string) => {
    const now = new Date();
    const userDocs: Record<string, unknown>[] = [];

    const addUser = (data: Record<string, unknown>) => {
        const doc = { _id: new Types.ObjectId(), password: passwordHash, new: false, isAdmin: false, active: true, createdAt: now, updatedAt: now, ...data };
        userDocs.push(doc);
        if (typeof data.email === 'string') usedEmails.add(data.email);
        return doc as unknown as SeededUser;
    };

    const toUserData = ({ birthDate, ...account }: { birthDate: string; [key: string]: string }) => ({
        ...account,
        birthDate: birthDate ? dayjs.tz(birthDate, TZ).toDate() : undefined,
    });

    const admin = addUser({ ...toUserData(TEST_ACCOUNTS.admin), isAdmin: true });
    const coach = addUser(toUserData(TEST_ACCOUNTS.coach));
    const youthCoach = addUser(toUserData(TEST_ACCOUNTS.youthCoach));
    const testPlayer = addUser(toUserData(TEST_ACCOUNTS.player));
    addUser({ email: TEST_ACCOUNTS.newUser.email, new: true });

    const extraCoaches = EXTRA_COACHES.map(({ birthDate, ...coachData }) =>
        addUser({
            ...coachData,
            email: buildEmail(coachData.firstName, coachData.lastName),
            mobile: randomMobile(),
            birthDate: dayjs.tz(birthDate, TZ).toDate(),
        })
    );

    // Former player - deactivated account
    addUser({
        firstName: 'Karel', lastName: 'Bývalý', email: buildEmail('Karel', 'Byvaly'),
        mobile: randomMobile(), birthDate: randomBirthDate([1990, 1995]), active: false,
    });

    // Generate players for every squad
    const usedNames = new Set<string>([`${testPlayer.firstName} ${testPlayer.lastName}`]);
    const playersBySquad: Record<string, SeededUser[]> = {};

    for (const squad of SQUADS) {
        const players: SeededUser[] = squad.key === 'menA' ? [testPlayer] : [];

        while (players.length < squad.playerCount) {
            const firstName = pick(FIRST_NAMES);
            const lastName = pick(LAST_NAMES);
            const fullName = `${firstName} ${lastName}`;
            if (usedNames.has(fullName)) continue;
            usedNames.add(fullName);

            players.push(addUser({
                firstName,
                lastName,
                email: buildEmail(firstName, lastName),
                mobile: randomMobile(),
                birthDate: randomBirthDate(squad.birthYears),
            }));
        }

        playersBySquad[squad.key] = players;
    }

    await User.insertMany(userDocs, { timestamps: false });

    const [pavel, ondrej, radek] = extraCoaches;
    const coachesBySquad: Record<string, SeededUser[]> = {
        menA: [coach, radek],
        menB: [pavel],
        juniors: [coach, ondrej],
        cadets: [ondrej],
        olderPupils: [youthCoach],
        youngerPupils: [youthCoach, radek],
    };

    return { admin, coach, testPlayer, playersBySquad, coachesBySquad, pavel };
};

const seedClub = async () => {
    const venueDocs = await Venue.insertMany(VENUES.map(({ key, ...venue }) => venue));
    const venueIds = Object.fromEntries(VENUES.map((venue, index) => [venue.key, venueDocs[index]._id])) as Record<VenueKey, Types.ObjectId>;

    await Team.create({ _id: new Types.ObjectId(TEAM_ID), ...TEAM, venue: venueIds.hall });

    return venueIds;
};

const seedSquads = async (
    playersBySquad: Record<string, SeededUser[]>,
    coachesBySquad: Record<string, SeededUser[]>,
    extraPlayers: Record<string, SeededUser[]>
): Promise<SquadContext[]> => {
    const contexts: SquadContext[] = [];
    const memberships: Record<string, unknown>[] = [];

    for (const seed of SQUADS) {
        const league = await League.create({ name: seed.league, season: SEASON, category: seed.category });
        const squad = await Squad.create({ name: seed.name, league: league._id, team: new Types.ObjectId(TEAM_ID) });

        const coaches = coachesBySquad[seed.key] ?? [];
        const players = [...playersBySquad[seed.key], ...(extraPlayers[seed.key] ?? [])];
        const usedNumbers = new Set<number>();

        players.forEach((player, index) => {
            const isTestPlayer = player.email === TEST_ACCOUNTS.player.email;
            const position = isTestPlayer ? PlayerPosition.Forward : POSITION_PLAN[index] ?? PlayerPosition.Forward;
            let jerseyNumber = position === PlayerPosition.Goalkeeper ? (index === 0 ? 1 : 30) : randomInt(2, 99);
            while (usedNumbers.has(jerseyNumber)) jerseyNumber = randomInt(2, 99);
            usedNumbers.add(jerseyNumber);

            const isAlsoCoach = coaches.some((c) => c._id.equals(player._id));
            memberships.push({
                squad: squad._id,
                user: player._id,
                roles: isAlsoCoach ? [SquadRole.Player, SquadRole.Coach] : [SquadRole.Player],
                position,
                jerseyNumber: player.email === TEST_ACCOUNTS.player.email ? 17 : jerseyNumber,
                active: true,
            });
        });

        for (const coach of coaches) {
            if (players.some((p) => p._id.equals(coach._id))) continue;
            memberships.push({ squad: squad._id, user: coach._id, roles: [SquadRole.Coach], active: true });
        }

        contexts.push({
            seed,
            squadId: squad._id,
            coachIds: coaches.map((c) => c._id),
            playerIds: players.map((p) => p._id),
        });
    }

    await SquadMembership.insertMany(memberships);
    return contexts;
};

type EventDraft = {
    title: string;
    type: TeamEventType;
    start: Dayjs;
    end: Dayjs;
    venue: Types.ObjectId;
    squads: Types.ObjectId[];
    createdBy: Types.ObjectId;
    participants: Types.ObjectId[];
    coaches: Types.ObjectId[];
    series?: Types.ObjectId;
    cancelReason?: string;
};

type SeriesDraft = {
    _id: Types.ObjectId;
    title: string;
    type: TeamEventType;
    venue: Types.ObjectId;
    squads: Types.ObjectId[];
    participants: Types.ObjectId[];
    startDate: string;
    startTime: string;
    endTime: string;
    timezone: string;
    recurrence: { frequency: RecurrenceFrequency; interval: number; weekdays: number[]; until?: Date; count?: number };
    createdBy: Types.ObjectId;
    canceledAt?: Date;
    cancelReason?: string;
};

const buildEvents = (squads: SquadContext[], venueIds: Record<VenueKey, Types.ObjectId>, adminId: Types.ObjectId) => {
    const today = dayjs().tz(TZ).startOf('day');
    const firstDay = today.subtract(WEEKS_BACK, 'week').startOf('week');
    const lastDay = today.add(WEEKS_AHEAD, 'week');
    const drafts: EventDraft[] = [];
    const seriesDrafts: SeriesDraft[] = [];

    // Weekly training series built with the same recurrence logic the API uses
    const addTrainingSeries = (
        squad: SquadContext,
        base: Omit<EventDraft, 'title' | 'type' | 'start' | 'end' | 'venue'>,
        options: { title: string; from: string; until?: string; count?: number; startTime: string; endTime: string; weekdays: number[]; venue: Types.ObjectId; cancelReason?: string }
    ) => {
        const recurrence = { frequency: RecurrenceFrequency.Weekly, interval: 1, weekdays: options.weekdays, until: options.until, count: options.count };
        const occurrences = generateOccurrences({
            startDate: options.from, startTime: options.startTime, endTime: options.endTime, timezone: TZ, recurrence,
        });
        if (occurrences.length === 0) return;

        const seriesId = new Types.ObjectId();
        seriesDrafts.push({
            _id: seriesId,
            title: options.title,
            type: TeamEventType.Training,
            venue: options.venue,
            squads: base.squads,
            participants: base.participants,
            startDate: occurrences[0].date,
            startTime: options.startTime,
            endTime: options.endTime,
            timezone: TZ,
            recurrence: {
                ...recurrence,
                until: options.until ? dayjs.tz(options.until, TZ).toDate() : undefined,
            },
            createdBy: base.createdBy,
            canceledAt: options.cancelReason ? new Date() : undefined,
            cancelReason: options.cancelReason,
        });

        for (const occurrence of occurrences) {
            drafts.push({
                ...base,
                title: options.title,
                type: TeamEventType.Training,
                start: dayjs(occurrence.start).tz(TZ),
                end: dayjs(occurrence.end).tz(TZ),
                venue: options.venue,
                series: seriesId,
                cancelReason: options.cancelReason,
            });
        }
    };

    squads.forEach((squad, squadIndex) => {
        const base = {
            squads: [squad.squadId],
            createdBy: squad.coachIds[0] ?? adminId,
            participants: squad.playerIds,
            coaches: squad.coachIds,
        };
        const isMen = squad.seed.key.startsWith('men');
        let matchCounter = 0;

        // Trainings: one weekly series per squad (all slots of a squad share the time and venue)
        const slot = squad.seed.trainings[0];
        const training = {
            title: `Trénink – ${squad.seed.name}`,
            weekdays: squad.seed.trainings.map((s) => s.weekday),
            venue: venueIds[slot.venue],
            startTime: slot.start,
            endTime: slot.end,
        };
        const from = firstDay.format('YYYY-MM-DD');
        const until = lastDay.format('YYYY-MM-DD');

        if (squad.seed.key === 'cadets') {
            // Demo of "this and following": from the pivot week the training starts 30 minutes later
            const pivot = today.add(3, 'week').startOf('week').add(1, 'day').format('YYYY-MM-DD');
            addTrainingSeries(squad, base, { ...training, from, until: previousDay(pivot) });
            addTrainingSeries(squad, base, { ...training, from: pivot, until, startTime: '17:30', endTime: '19:00' });
        } else {
            addTrainingSeries(squad, base, { ...training, from, until });
        }

        for (let day = firstDay; day.isBefore(lastDay); day = day.add(1, 'day')) {
            // Matches every second weekend (men on Saturday, youth on Sunday)
            const matchDay = isMen ? 6 : 0;
            const weekIndex = day.diff(firstDay, 'week');
            if (day.day() === matchDay && (weekIndex + squadIndex) % 2 === 0) {
                const opponent = OPPONENTS[(matchCounter + squadIndex) % OPPONENTS.length];
                const isHome = matchCounter % 2 === 0;
                const start = atLocalTime(day, squad.seed.matchStart);
                matchCounter += 1;

                drafts.push({
                    ...base,
                    title: isHome ? `${TEAM.name} – ${opponent}` : `${opponent} – ${TEAM.name}`,
                    type: TeamEventType.Match,
                    start,
                    end: start.add(isMen ? 2 : 3, 'hour'),
                    venue: isHome ? venueIds.hall : venueIds.away,
                });
            }
        }
    });

    // One-off club events
    const menA = squads.find((s) => s.seed.key === 'menA')!;
    const menB = squads.find((s) => s.seed.key === 'menB')!;
    const allCoaches = [...new Set(squads.flatMap((s) => s.coachIds.map(String)))].map((id) => new Types.ObjectId(id));

    const camp = today.add(3, 'week').day(6);
    drafts.push({
        title: 'Soustředění – Muži A', type: TeamEventType.Other,
        start: atLocalTime(camp, '09:00'), end: atLocalTime(camp, '16:00'),
        venue: venueIds.hall, squads: [menA.squadId], createdBy: menA.coachIds[0],
        participants: menA.playerIds, coaches: menA.coachIds,
    });

    const meeting = today.subtract(4, 'week').day(5);
    drafts.push({
        title: 'Schůze trenérů', type: TeamEventType.Other,
        start: atLocalTime(meeting, '18:00'), end: atLocalTime(meeting, '19:30'),
        venue: venueIds.hall, squads: [], createdBy: adminId,
        participants: allCoaches, coaches: [],
    });

    const party = today.add(7, 'week').day(5);
    drafts.push({
        title: 'Vánoční posezení mužů', type: TeamEventType.Other,
        start: atLocalTime(party, '19:00'), end: atLocalTime(party, '23:00'),
        venue: venueIds.hall, squads: [menA.squadId, menB.squadId], createdBy: menA.coachIds[0],
        participants: [...menA.playerIds, ...menB.playerIds], coaches: [...menA.coachIds, ...menB.coachIds],
    });

    // Fully canceled series
    addTrainingSeries(menA, {
        squads: [menA.squadId], createdBy: menA.coachIds[0], participants: menA.playerIds, coaches: menA.coachIds,
    }, {
        title: 'Ranní kondice – Muži A',
        from: today.add(1, 'week').day(6).format('YYYY-MM-DD'),
        count: 6,
        weekdays: [6],
        startTime: '08:00',
        endTime: '09:00',
        venue: venueIds.hall,
        cancelReason: 'Malý zájem, kondiční tréninky se přesouvají na jaro.',
    });

    // Single canceled occurrences: one upcoming (Muži A) and one in the past (Junioři)
    const cancelOccurrence = (squadName: string, predicate: (draft: EventDraft) => boolean, reason: string) => {
        const draft = drafts.find((d) => d.series && d.title === `Trénink – ${squadName}` && predicate(d));
        if (draft) draft.cancelReason = reason;
    };

    cancelOccurrence('Muži A', (d) => d.start.isAfter(today.add(4, 'day')) && d.start.day() === 4, 'Hala je obsazená kvůli turnaji žáků.');
    cancelOccurrence('Junioři', (d) => d.start.isAfter(today.subtract(14, 'day')) && d.start.isBefore(today.subtract(7, 'day')), 'Nemoc trenéra.');

    return { drafts, seriesDrafts };
};

// Probabilities of [confirmed, maybe, declined]; the rest stays pending
const STATUS_PROBABILITIES = {
    past: [0.72, 0.04, 0.16],
    nextWeek: [0.5, 0.1, 0.1],
    later: [0.12, 0.05, 0.05],
};

const participationFor = (start: Dayjs): { status: EventParticipationStatus; note?: string } => {
    const now = dayjs();
    const [confirmed, maybe, declined] = start.isBefore(now)
        ? STATUS_PROBABILITIES.past
        : start.isBefore(now.add(7, 'day')) ? STATUS_PROBABILITIES.nextWeek : STATUS_PROBABILITIES.later;
    const roll = random();

    if (roll < confirmed) return { status: EventParticipationStatus.Confirmed };
    if (roll < confirmed + maybe) {
        return { status: EventParticipationStatus.Maybe, note: chance(0.5) ? 'Možná dorazím později.' : undefined };
    }
    if (roll < confirmed + maybe + declined) {
        return { status: EventParticipationStatus.Declined, note: chance(0.6) ? pick(DECLINE_REASONS) : undefined };
    }
    return { status: EventParticipationStatus.Pending };
};

const seedEvents = async (drafts: EventDraft[], seriesDrafts: SeriesDraft[], testPlayerId: Types.ObjectId) => {
    await EventSeries.insertMany(seriesDrafts);

    const events = await TeamEvent.insertMany(
        drafts.map((draft) => ({
            title: draft.title,
            type: draft.type,
            startDate: draft.start.toDate(),
            endDate: draft.end.toDate(),
            venue: draft.venue,
            squads: draft.squads,
            createdBy: draft.createdBy,
            series: draft.series,
            originalStart: draft.series ? draft.start.toDate() : undefined,
            ...(draft.cancelReason !== undefined && {
                status: TeamEventStatus.Canceled,
                cancelReason: draft.cancelReason,
                canceledAt: draft.start.subtract(2, 'day').toDate(),
                canceledBy: draft.createdBy,
            }),
        }))
    );

    const participations: Record<string, unknown>[] = [];
    const comments: Record<string, unknown>[] = [];
    let testPlayerUpcoming = 0;

    events.forEach((event, index) => {
        const draft = drafts[index];
        const respondedAt = draft.start.subtract(randomInt(1, 4), 'day').toDate();
        const invitedAt = draft.start.subtract(14, 'day').toDate();
        const userIds = new Set<string>();

        const addParticipation = (userId: Types.ObjectId, status: EventParticipationStatus, note?: string) => {
            if (userIds.has(String(userId))) return;
            userIds.add(String(userId));
            const answered = status !== EventParticipationStatus.Pending;
            participations.push({
                event: event._id,
                user: userId,
                status,
                note,
                createdAt: invitedAt,
                updatedAt: answered ? respondedAt : invitedAt,
            });
        };

        for (const coachId of draft.coaches) addParticipation(coachId, EventParticipationStatus.Confirmed);

        for (const playerId of draft.participants) {
            let participation = participationFor(draft.start);

            // Keep a few upcoming events unanswered for the test player so RSVP can be tried right away
            const isPlayable = draft.start.isAfter(dayjs()) && draft.cancelReason === undefined;
            if (playerId.equals(testPlayerId) && isPlayable && testPlayerUpcoming < 3) {
                participation = { status: EventParticipationStatus.Pending };
                testPlayerUpcoming += 1;
            }

            addParticipation(playerId, participation.status, participation.note);
        }

        // Comments on some events
        if (draft.participants.length > 0 && chance(0.15)) {
            const commentCount = randomInt(1, 3);
            for (let i = 0; i < commentCount; i++) {
                const createdAt = draft.start.subtract(randomInt(2, 48), 'hour').toDate();
                comments.push({
                    author: pick([...draft.coaches, ...draft.participants]),
                    event: event._id,
                    content: pick(EVENT_COMMENTS),
                    createdAt,
                    updatedAt: createdAt,
                });
            }
        }
    });

    await EventParticipation.insertMany(participations, { timestamps: false });
    await Comment.insertMany(comments, { timestamps: false });

    return { eventCount: events.length, participationCount: participations.length, commentCount: comments.length };
};

const seedAnnouncements = async (authorId: Types.ObjectId) => {
    await Announcement.insertMany(
        ANNOUNCEMENTS.map(({ daysAgo, ...announcement }) => {
            const createdAt = dayjs().subtract(daysAgo, 'day').toDate();
            return { ...announcement, author: authorId, createdAt, updatedAt: createdAt };
        }),
        { timestamps: false }
    );
};

const FINE_REASONS = ['Pozdní příchod na trénink', 'Zapomenutý dres', 'Neomluvená absence', 'Telefon v šatně při poradě'];

const seedPayments = async (squads: SquadContext[], testPlayerId: Types.ObjectId) => {
    const today = dayjs().tz(TZ).startOf('day');
    const autumnDue = today.subtract(10, 'day');
    const springDue = today.add(4, 'month').startOf('month').add(14, 'day');
    const autumnLabel = `Členský příspěvek podzim ${autumnDue.year()}`;
    const springLabel = `Členský příspěvek jaro ${springDue.year()}`;
    const payments: Record<string, unknown>[] = [];

    // Paid payments remember when they were paid (a few days before / around the due date)
    const paidAround = (due: Dayjs) => due.subtract(randomInt(-3, 20), 'day').toDate();

    for (const squad of squads) {
        for (const playerId of squad.playerIds) {
            const isTestPlayer = playerId.equals(testPlayerId);
            const roll = random();
            const autumnStatus = isTestPlayer
                ? PaymentStatus.Completed
                : roll < 0.7 ? PaymentStatus.Completed : roll < 0.9 ? PaymentStatus.Pending : PaymentStatus.Failed;

            payments.push({
                user: playerId, amount: squad.seed.membershipFee, type: PaymentType.Membership, description: autumnLabel,
                dueDate: autumnDue.toDate(), status: autumnStatus,
                paidAt: autumnStatus === PaymentStatus.Completed ? paidAround(autumnDue) : undefined,
            });
            payments.push({
                user: playerId, amount: squad.seed.membershipFee, type: PaymentType.Membership, description: springLabel,
                dueDate: springDue.toDate(), status: PaymentStatus.Pending,
            });

            // Fines for adult players (late arrivals, forgotten jersey...)
            if (squad.seed.key.startsWith('men') && (isTestPlayer || chance(0.25))) {
                const due = today.add(randomInt(3, 20), 'day');
                const isPaid = chance(0.4) && !isTestPlayer;
                payments.push({
                    user: playerId,
                    amount: pick([50, 100, 150, 200]),
                    type: PaymentType.Fines,
                    description: pick(FINE_REASONS),
                    dueDate: due.toDate(),
                    status: isPaid ? PaymentStatus.Completed : PaymentStatus.Pending,
                    paidAt: isPaid ? today.subtract(randomInt(0, 5), 'day').toDate() : undefined,
                });
            }
        }
    }

    await Payment.insertMany(payments);
    return payments.length;
};

// Sample bell notifications for the test accounts (normally created by the app itself)
const seedNotifications = async (testPlayerId: Types.ObjectId, coachId: Types.ObjectId) => {
    const now = dayjs();
    const upcoming = { startDate: { $gte: now.toDate() } };

    const [canceledTraining, canceledSeriesFirst, nextMatch, pendingEvent] = await Promise.all([
        TeamEvent.findOne({ ...upcoming, title: 'Trénink – Muži A', status: TeamEventStatus.Canceled }).sort({ startDate: 1 }).lean(),
        TeamEvent.findOne({ ...upcoming, title: 'Ranní kondice – Muži A' }).sort({ startDate: 1 }).lean(),
        TeamEvent.findOne({ ...upcoming, type: TeamEventType.Match, squads: { $exists: true } })
            .where('_id').in(await EventParticipation.find({ user: testPlayerId }).distinct('event'))
            .sort({ startDate: 1 }).lean(),
        TeamEvent.findOne({ ...upcoming, status: TeamEventStatus.Scheduled })
            .where('_id').in(await EventParticipation.find({ user: testPlayerId, status: EventParticipationStatus.Pending }).distinct('event'))
            .sort({ startDate: 1 }).lean(),
    ]);

    const notifications: Record<string, unknown>[] = [];
    const add = (user: Types.ObjectId, hoursAgo: number, read: boolean, data: Record<string, unknown>) => {
        const createdAt = now.subtract(hoursAgo, 'hour').toDate();
        notifications.push({ user, createdAt, updatedAt: createdAt, readAt: read ? createdAt : undefined, ...data });
    };

    if (pendingEvent) {
        add(testPlayerId, 1, false, {
            type: NotificationType.RsvpReminder, title: `Odpovězte prosím: ${pendingEvent.title}`,
            message: `${formatEventDateTime(pendingEvent.startDate, pendingEvent.endDate)}\nZatím jste nedali vědět, zda přijdete.`,
            link: `/event-detail/${pendingEvent._id}`, event: pendingEvent._id,
        });
    }
    if (canceledTraining) {
        add(testPlayerId, 26, false, {
            type: NotificationType.EventCanceled, title: `Zrušeno: ${canceledTraining.title}`,
            message: `${formatEventDateTime(canceledTraining.startDate, canceledTraining.endDate)}\nDůvod: ${canceledTraining.cancelReason}`,
            link: `/event-detail/${canceledTraining._id}`, event: canceledTraining._id,
        });
    }
    if (canceledSeriesFirst) {
        add(testPlayerId, 50, false, {
            type: NotificationType.EventCanceled, title: `Zrušeno (6×): ${canceledSeriesFirst.title}`,
            message: `Důvod: ${canceledSeriesFirst.cancelReason}`,
            link: `/event-detail/${canceledSeriesFirst._id}`, event: canceledSeriesFirst._id,
        });
    }
    if (nextMatch) {
        add(testPlayerId, 72, true, {
            type: NotificationType.EventInvited, title: `Nominace na zápas: ${nextMatch.title}`,
            message: `${formatEventDateTime(nextMatch.startDate, nextMatch.endDate)}\nDejte prosím vědět, zda přijdete.`,
            link: `/event-detail/${nextMatch._id}`, event: nextMatch._id,
        });
    }
    for (const user of [testPlayerId, coachId]) {
        add(user, 72, true, {
            type: NotificationType.Announcement, title: `Nové oznámení: ${ANNOUNCEMENTS[1].title}`, link: '/announcements',
        });
    }

    await Notification.insertMany(notifications, { timestamps: false });
    return notifications.length;
};

//#endregion

const run = async () => {
    if (env.isProduction) {
        throw new Error('The seed script must never run with NODE_ENV=production.');
    }

    await mongoose.connect(env.MONGO_URI);
    await prepareDatabase();

    console.log('Seeding...');
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    const { admin, coach, testPlayer, playersBySquad, coachesBySquad, pavel } = await seedUsers(passwordHash);
    const venueIds = await seedClub();

    // Pavel coaches Muži B and also plays there
    const squads = await seedSquads(playersBySquad, coachesBySquad, { menB: [pavel] });

    const { drafts, seriesDrafts } = buildEvents(squads, venueIds, admin._id);
    const { eventCount, participationCount, commentCount } = await seedEvents(drafts, seriesDrafts, testPlayer._id);
    await seedAnnouncements(admin._id);
    const paymentCount = await seedPayments(squads, testPlayer._id);
    await seedNotifications(testPlayer._id, coach._id);

    // Events in the past and the next 24 hours count as already reminded, so the scheduler
    // does not send a burst of reminders right after seeding
    await TeamEvent.updateMany({ startDate: { $lte: dayjs().add(1, 'day').toDate() } }, { reminderSentAt: new Date() });

    // Recreate indexes (unique e-mail, unique participation...) after collections were dropped
    await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));

    await mongoose.connection.db!.collection(SEED_META_COLLECTION).insertOne({ version: SEED_VERSION, seededAt: new Date() });

    console.log(`Done: ${await User.countDocuments()} users, ${squads.length} squads, ${eventCount} events ` +
        `(${seriesDrafts.length} series, ${await TeamEvent.countDocuments({ status: TeamEventStatus.Canceled })} canceled), ` +
        `${participationCount} participations, ${commentCount} comments, ${paymentCount} payments.`);
    console.log(`\nTest logins (password for all seeded users: ${SEED_PASSWORD}):`);
    console.log(`  admin   ${TEST_ACCOUNTS.admin.email}`);
    console.log(`  coach   ${TEST_ACCOUNTS.coach.email} (Muži A, Junioři)`);
    console.log(`  coach   ${TEST_ACCOUNTS.youthCoach.email} (Starší a mladší žáci)`);
    console.log(`  player  ${TEST_ACCOUNTS.player.email} (Muži A)`);
    console.log(`  new     ${TEST_ACCOUNTS.newUser.email} (first login - profile setup)`);
};

run()
    .catch((error) => {
        console.error(`\nSeed failed: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
