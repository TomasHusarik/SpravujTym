import mongoose, { ClientSession, HydratedDocument, Types } from 'mongoose';
import TeamEvent, { ITeamEvent, TeamEventStatus, TeamEventType } from '@models/TeamEvent';
import EventSeries, { IEventSeries, IRecurrenceRule, RecurrenceFrequency } from '@models/EventSeries';
import EventParticipation from '@models/EventParticipation';
import SquadMembership, { SquadRole } from '@models/SquadMembership';
import Comment from '@models/Comment';
import {
    DEFAULT_TIMEZONE, RecurrenceInput, SeriesSchedule, atLocalTime, generateOccurrenceDates,
    previousDay, toLocalDate, toLocalTime, validateSchedule,
} from '@utils/recurrence';

/**
 * Recurring events ("series") are stored as an EventSeries document (the rule and shared fields)
 * plus one TeamEvent per occurrence. Every occurrence keeps its own participations and comments.
 *
 * Editing / canceling / deleting works like Google Calendar:
 *   - this       -> only the selected occurrence
 *   - following  -> the selected occurrence and all later ones (the series is split in two)
 *   - all        -> all occurrences that have not finished yet (past occurrences stay as history)
 */
export enum EditScope {
    This = 'this',
    Following = 'following',
    All = 'all',
}

// Errors caused by invalid input - controllers return them as 400 Bad Request
export class SeriesError extends Error {}

export type EventInput = {
    title: string;
    type: TeamEventType;
    startDate: Date | string;
    endDate: Date | string;
    venue?: string | null;
    squads?: string[];
    participantIds: string[];
};

type EventDocument = HydratedDocument<ITeamEvent>;
type SeriesDocument = HydratedDocument<IEventSeries>;

export const parseScope = (value: unknown): EditScope =>
    Object.values(EditScope).includes(value as EditScope) ? (value as EditScope) : EditScope.This;

const occurrenceKey = (event: ITeamEvent, tz: string) => toLocalDate(event.originalStart ?? event.startDate, tz);

// Stores the end date as local midnight, so it converts back to the same local date
const normalizeRule = (rule: RecurrenceInput, tz: string): IRecurrenceRule => ({
    frequency: rule.frequency as RecurrenceFrequency,
    interval: rule.interval ?? 1,
    weekdays: rule.frequency === RecurrenceFrequency.Weekly ? [...new Set(rule.weekdays ?? [])] : [],
    until: rule.until ? atLocalTime(toLocalDate(rule.until, tz), '00:00', tz) : undefined,
    count: rule.count ?? undefined,
});

const ruleToInput = (rule: IRecurrenceRule): RecurrenceInput => ({
    frequency: rule.frequency,
    interval: rule.interval,
    weekdays: rule.weekdays,
    until: rule.until ?? null,
    count: rule.count ?? null,
});

const buildSchedule = (input: EventInput, startDate: string, recurrence: RecurrenceInput, tz: string): SeriesSchedule => {
    const startTime = toLocalTime(input.startDate, tz);
    const endTime = toLocalTime(input.endDate, tz);

    if (toLocalDate(input.startDate, tz) !== toLocalDate(input.endDate, tz)) {
        throw new SeriesError('Recurring events must start and end on the same day');
    }

    const schedule = { startDate, startTime, endTime, timezone: tz, recurrence };
    const error = validateSchedule(schedule);
    if (error) throw new SeriesError(error);

    return schedule;
};

// Active players of the given squads (used when an event is created for whole squads)
export const getSquadPlayerIds = async (squadIds: string[]) => {
    if (!squadIds?.length) return [];

    const userIds = await SquadMembership.find({
        squad: { $in: squadIds },
        active: true,
        roles: SquadRole.Player,
    }).distinct('user');

    return userIds.map(String);
};

const createOccurrences = async (series: SeriesDocument, dates: string[], session: ClientSession) => {
    if (dates.length === 0) return [];

    const events = await TeamEvent.insertMany(
        dates.map((date) => {
            const start = atLocalTime(date, series.startTime, series.timezone);
            return {
                title: series.title,
                type: series.type,
                venue: series.venue,
                squads: series.squads,
                createdBy: series.createdBy,
                series: series._id,
                originalStart: start,
                startDate: start,
                endDate: atLocalTime(date, series.endTime, series.timezone),
            };
        }),
        { session }
    );

    const participations = events.flatMap((event) =>
        (series.participants ?? []).map((user) => ({ event: event._id, user }))
    );

    if (participations.length > 0) {
        await EventParticipation.insertMany(participations, { session });
    }

    return events;
};

const deleteEventsByIds = async (eventIds: Types.ObjectId[], session: ClientSession) => {
    if (eventIds.length === 0) return;

    await EventParticipation.deleteMany({ event: { $in: eventIds } }, { session });
    await Comment.deleteMany({ event: { $in: eventIds } }, { session });
    await TeamEvent.deleteMany({ _id: { $in: eventIds } }, { session });
};

// Adds missing participants (as pending) and removes participants that are no longer invited
const syncParticipants = async (eventIds: Types.ObjectId[], participantIds: string[], session: ClientSession) => {
    if (eventIds.length === 0) return;

    const wanted = new Set(participantIds.map(String));
    const existing = await EventParticipation.find({ event: { $in: eventIds } }).select('event user').session(session).lean();
    const existingKeys = new Set(existing.map((p) => `${p.event}:${p.user}`));

    const toRemove = existing.filter((p) => !wanted.has(String(p.user))).map((p) => p._id);
    const toAdd = eventIds.flatMap((eventId) =>
        [...wanted].filter((userId) => !existingKeys.has(`${eventId}:${userId}`)).map((user) => ({ event: eventId, user }))
    );

    if (toRemove.length > 0) await EventParticipation.deleteMany({ _id: { $in: toRemove } }, { session });
    if (toAdd.length > 0) await EventParticipation.insertMany(toAdd, { session });
};

// POST /team-event/create-team-event with `recurrence`
export const createSeries = async (input: EventInput, recurrence: RecurrenceInput, userId: string) => {
    const tz = DEFAULT_TIMEZONE;
    const schedule = buildSchedule(input, toLocalDate(input.startDate, tz), recurrence, tz);
    const dates = generateOccurrenceDates(schedule);

    return mongoose.connection.transaction(async (session) => {
        const [series] = await EventSeries.create([{
            title: input.title,
            type: input.type,
            venue: input.venue || undefined,
            squads: input.squads ?? [],
            participants: input.participantIds,
            startDate: schedule.startDate,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            timezone: tz,
            recurrence: normalizeRule(recurrence, tz),
            createdBy: userId,
        }], { session });

        const events = await createOccurrences(series, dates, session);
        return { series, events };
    });
};

// PUT /team-event/update-event/:_id with scope "following" or "all"
export const updateSeries = async (event: EventDocument, input: EventInput, scope: EditScope, recurrence?: RecurrenceInput) => {
    const series = await EventSeries.findById(event.series);
    if (!series) throw new SeriesError('Series not found');

    const tz = series.timezone;
    const occurrences = await TeamEvent.find({ series: series._id }).sort({ originalStart: 1 });
    const now = new Date();

    // First occurrence that is changed; for "all" the past occurrences stay untouched
    const pivotEvent = scope === EditScope.Following
        ? event
        : occurrences.find((occurrence) => occurrence.endDate >= now);

    if (!pivotEvent) throw new SeriesError('The series has no upcoming occurrences to change');

    const pivotDate = occurrenceKey(pivotEvent, tz);
    const before = occurrences.filter((occurrence) => occurrenceKey(occurrence, tz) < pivotDate);
    const affected = occurrences.filter((occurrence) => occurrenceKey(occurrence, tz) >= pivotDate);

    // The date pattern comes from the (new or existing) rule; the edited occurrence only provides the times
    let rule = recurrence ?? ruleToInput(series.recurrence);
    if (!recurrence && series.recurrence.count) {
        rule = { ...rule, count: Math.max(1, series.recurrence.count - before.length) };
    }

    const schedule = buildSchedule(input, pivotDate, rule, tz);
    const newDates = generateOccurrenceDates(schedule);
    const split = scope === EditScope.Following && before.length > 0;

    const sharedFields = {
        title: input.title,
        type: input.type,
        venue: input.venue || undefined,
        squads: (input.squads ?? []).map((id) => new Types.ObjectId(id)),
        participants: input.participantIds.map((id) => new Types.ObjectId(id)),
    };

    return mongoose.connection.transaction(async (session) => {
        let target: SeriesDocument = series;

        if (split) {
            // Old series ends the day before the pivot, the rest moves to a new series
            series.recurrence = normalizeRule({ ...ruleToInput(series.recurrence), count: null, until: previousDay(pivotDate) }, tz);
            await series.save({ session });

            [target] = await EventSeries.create([{
                ...sharedFields,
                startDate: pivotDate,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                timezone: tz,
                recurrence: normalizeRule(rule, tz),
                createdBy: series.createdBy,
            }], { session });
        } else {
            const totalRule = rule.count ? { ...rule, count: before.length + newDates.length } : rule;
            Object.assign(series, sharedFields, {
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                recurrence: normalizeRule(totalRule, tz),
            });
            if (before.length === 0) series.startDate = pivotDate;
            await series.save({ session });
        }

        const affectedByDate = new Map(affected.map((occurrence) => [occurrenceKey(occurrence, tz), occurrence]));
        const newDateSet = new Set(newDates);

        const kept = newDates.filter((date) => affectedByDate.has(date)).map((date) => [date, affectedByDate.get(date)!] as const);
        const toCreate = newDates.filter((date) => !affectedByDate.has(date));
        const toRemove = affected.filter((occurrence) => !newDateSet.has(occurrenceKey(occurrence, tz)));

        // Existing occurrences keep their participations, comments and canceled status
        for (const [date, occurrence] of kept) {
            const start = atLocalTime(date, schedule.startTime, tz);
            Object.assign(occurrence, sharedFields, {
                series: target._id,
                originalStart: start,
                startDate: start,
                endDate: atLocalTime(date, schedule.endTime, tz),
                isException: false,
            });
            await occurrence.save({ session });
        }

        await syncParticipants(kept.map(([, occurrence]) => occurrence._id), input.participantIds, session);
        const created = await createOccurrences(target, toCreate, session);
        await deleteEventsByIds(toRemove.map((occurrence) => occurrence._id), session);

        return {
            seriesId: target._id,
            updatedIds: kept.map(([, occurrence]) => occurrence._id),
            createdIds: created.map((occurrence) => occurrence._id),
            removedIds: toRemove.map((occurrence) => occurrence._id),
        };
    });
};

const findScopedOccurrences = async (event: EventDocument, scope: EditScope) => {
    if (!event.series || scope === EditScope.This) return [event];

    if (scope === EditScope.Following) {
        return TeamEvent.find({ series: event.series, originalStart: { $gte: event.originalStart ?? event.startDate } });
    }

    return TeamEvent.find({ series: event.series, endDate: { $gte: new Date() } });
};

// POST /team-event/cancel-event/:_id - canceled occurrences stay visible with the reason
export const cancelEvents = async (event: EventDocument, scope: EditScope, reason: string | undefined, userId: string) => {
    const targets = (await findScopedOccurrences(event, scope))
        .filter((occurrence) => occurrence.status !== TeamEventStatus.Canceled);
    const ids = targets.map((occurrence) => occurrence._id);
    const cancelReason = reason?.trim() || undefined;

    await mongoose.connection.transaction(async (session) => {
        if (ids.length > 0) {
            await TeamEvent.updateMany(
                { _id: { $in: ids } },
                { status: TeamEventStatus.Canceled, cancelReason, canceledAt: new Date(), canceledBy: userId },
                { session }
            );
        }

        if (event.series && scope === EditScope.All) {
            await EventSeries.updateOne({ _id: event.series }, { canceledAt: new Date(), cancelReason }, { session });
        }
    });

    return ids;
};

// POST /team-event/restore-event/:_id - restores a single canceled occurrence
export const restoreEvent = async (event: EventDocument) => {
    event.status = TeamEventStatus.Scheduled;
    event.cancelReason = undefined;
    event.canceledAt = undefined;
    event.canceledBy = undefined;
    await event.save();

    if (event.series) {
        await EventSeries.updateOne({ _id: event.series }, { $unset: { canceledAt: 1, cancelReason: 1 } });
    }
};

// Occurrences that a delete with the given scope removes
export const findDeleteTargets = async (event: EventDocument, scope: EditScope) => {
    if (!event.series || scope === EditScope.This) return [event];

    if (scope === EditScope.Following) {
        return TeamEvent.find({ series: event.series, originalStart: { $gte: event.originalStart ?? event.startDate } });
    }

    return TeamEvent.find({ series: event.series });
};

// DELETE /team-event/delete-event/:_id?scope=
export const deleteEvents = async (event: EventDocument, scope: EditScope) => {
    const targets = await findDeleteTargets(event, scope);

    const ids = targets.map((occurrence) => occurrence._id);

    await mongoose.connection.transaction(async (session) => {
        await deleteEventsByIds(ids, session);

        if (!event.series) return;

        const remaining = await TeamEvent.countDocuments({ series: event.series }).session(session);
        if (remaining === 0) {
            await EventSeries.deleteOne({ _id: event.series }, { session });
            return;
        }

        if (scope === EditScope.Following) {
            const series = await EventSeries.findById(event.series).session(session);
            if (series) {
                const pivotDate = occurrenceKey(event, series.timezone);
                series.recurrence = normalizeRule({ ...ruleToInput(series.recurrence), count: null, until: previousDay(pivotDate) }, series.timezone);
                await series.save({ session });
            }
        }
    });

    return ids;
};
