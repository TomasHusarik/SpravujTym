import { Request, Response } from 'express';
import ErrorMessages from '@utils/errorMessages';
import TeamEvent, { TeamEventStatus, TeamEventType } from '@models/TeamEvent';
import mongoose from 'mongoose';
import EventParticipation, { EventParticipationStatus, IEventParticipation, PARTICIPATION_NOTE_MAX_LENGTH } from '@models/EventParticipation';
import { ensurePermissions } from '@middleware/permission.middleware';
import { canAssignSquads, canManageEvent } from '@middleware/permission.rules';
import {
    notifyEventRestored, notifyEventsCanceled, notifyEventsChanged, notifyInvited, notifyRsvpReminder,
    prepareDeletedNotification, safely,
} from '../services/notification.service';
import {
    EditScope, SeriesError, cancelEvents, createSeries, deleteEvents, findDeleteTargets, getSquadPlayerIds, parseScope, restoreEvent, updateSeries,
} from '../services/eventSeries.service';

const CANCEL_REASON_MAX_LENGTH = 200;
// A coach can send a manual reminder at most once per hour
const MANUAL_REMINDER_INTERVAL_MS = 60 * 60 * 1000;

// GET /team-event/:id - Get team event by ID
export const getTeamEventById = async (req: Request, res: Response) => {

    try {
        const teamEvent = await TeamEvent.findById(req.params._id)
            .populate({
                path: 'eventParticipations',
                populate: { path: 'user', select: 'firstName lastName email imageUrl' }
            })
            .populate('venue', 'name')
            .populate('squads', 'name')
            .populate('series', 'recurrence startDate startTime endTime canceledAt cancelReason')
            .lean();

        if (!teamEvent) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        // Event is visible to its managers, participants and members of its squads
        const permissions = await ensurePermissions(req);
        const userId = req.loggedUser._id.toString();
        const participations = ((teamEvent as any).eventParticipations ?? []) as { user?: { _id?: unknown } }[];
        const squadIds = (teamEvent.squads ?? []).map((squad: any) => String(squad?._id ?? squad));

        const canView =
            canManageEvent(userId, permissions, teamEvent) ||
            participations.some((p) => String(p.user?._id) === userId) ||
            (permissions.playerSquadId !== null && squadIds.includes(permissions.playerSquadId));

        if (!canView) {
            return res.status(403).json({ error: ErrorMessages.forbidden });
        }

        return res.status(200).json(teamEvent);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// GET /get-team-events - Get team events
export const getTeamEvents = async (req: Request, res: Response) => {
    const userId = req.loggedUser?._id?.toString();

    if (!userId) {
        return res.status(401).json({ error: ErrorMessages.notAuthenticated });
    }

    try {
        const permissions = await ensurePermissions(req);

        // ADMIN - get all events
        if (permissions.isAdmin) {

            const [events, myParticipations] = await Promise.all([
                TeamEvent.find()
                    .populate('venue', 'name')
                    .populate('squads', 'name')
                    .lean(),

                EventParticipation
                    .find({ user: userId })
                    .select('event status note user')
                    .lean()
            ]);

            const participationMap = new Map(
                myParticipations.map(p => [p.event.toString(), p])
            );

            const result = events.map(event => ({
                ...event,
                eventParticipations: [
                    participationMap.get(event._id.toString())
                ].filter(Boolean)
            }));

            return res.status(200).json(result);
        }

        // PLAYER / COACH

        const coachedSquadObjectIds = permissions.coachSquadIds.map(
            id => new mongoose.Types.ObjectId(id)
        );

        const [myParticipations, coachedEventIds] = await Promise.all([
            EventParticipation
                .find({ user: userId })
                .select('event status note user')
                .lean(),

            coachedSquadObjectIds.length > 0
                ? TeamEvent.find({ squads: { $in: coachedSquadObjectIds } }).distinct('_id')
                : Promise.resolve([])
        ]);

        const participantEventIds = myParticipations.map(p => p.event);

        const eventIds = [...new Set(
            [...participantEventIds, ...coachedEventIds].map(id => id.toString())
        )];

        if (eventIds.length === 0) {
            return res.status(200).json([]);
        }

        const events = await TeamEvent
            .find({ _id: { $in: eventIds } })
            .populate('venue', 'name')
            .populate('squads', 'name')
            .lean();

        const participationMap = new Map(
            myParticipations.map(p => [p.event.toString(), p])
        );

        const result = events.map(event => ({
            ...event,
            eventParticipations: [
                participationMap.get(event._id.toString())
            ].filter(Boolean)
        }));

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};


type IncomingParticipation = { userId: string; status?: EventParticipationStatus };

// Participations from the request, or all players of the selected squads when none were sent
const resolveParticipations = async (participations: unknown, squads: unknown): Promise<IncomingParticipation[]> => {
    if (Array.isArray(participations)) {
        return participations.filter((p) => p?.userId).map((p) => ({ userId: String(p.userId), status: p.status }));
    }

    const squadIds = Array.isArray(squads) ? squads.map(String) : [];
    return (await getSquadPlayerIds(squadIds)).map((userId) => ({ userId }));
};

const handleSeriesError = (res: Response, error: unknown) => {
    if (error instanceof SeriesError) {
        return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: ErrorMessages.internalServerError });
};

// PUT /team-event/update-participation-status - Update participation status
export const updateParticapationStatus = async (req: Request, res: Response) => {
    const { status, note } = req.body;
    const event = req.body.event || req.body.eventId;
    const userId = req.loggedUser?._id.toString();

    if (!userId) {
        return res.status(401).json({ error: ErrorMessages.notAuthenticated });
    }

    if (!event || !status) {
        return res.status(400).json({ error: 'Event ID and status are required' });
    }

    if (!Object.values(EventParticipationStatus).includes(status)) {
        return res.status(400).json({ error: ErrorMessages.invalidParticipationStatus });
    }

    if (note !== undefined && note !== null && String(note).length > PARTICIPATION_NOTE_MAX_LENGTH) {
        return res.status(400).json({ error: ErrorMessages.participationNoteTooLong });
    }

    try {
        const participation = await EventParticipation.findOne({ event, user: userId });

        if (!participation) {
            return res.status(404).json({ error: 'Participation not found' });
        }

        const teamEvent = await TeamEvent.findById(event).select('status').lean();
        if (teamEvent?.status === TeamEventStatus.Canceled) {
            return res.status(400).json({ error: ErrorMessages.eventCanceled });
        }

        participation.status = status;
        if (note !== undefined) {
            participation.note = note ? String(note).trim() : undefined;
        }
        await participation.save();

        return res.status(200).json({ message: 'Participation status updated' });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /team-event/create-team-event - Create a new team event (or a recurring series when `recurrence` is sent)
export const createTeamEvent = async (req: Request, res: Response) => {
    const { title, type, startDate, endDate, venue, participations, squads, recurrence } = req.body;
    const userId = req.loggedUser?._id.toString();

    if (!userId) {
        return res.status(401).json({ error: ErrorMessages.notAuthenticated });
    }

    if (!title || !type || !startDate || !endDate) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({ error: ErrorMessages.InvalidDateRange });
    }

    if (!canAssignSquads(await ensurePermissions(req), squads)) {
        return res.status(403).json({ error: ErrorMessages.squadNotCoached });
    }

    const incoming = await resolveParticipations(participations, squads);
    const participantIds = incoming.map((p) => p.userId);

    if (recurrence) {
        try {
            const { series, events } = await createSeries(
                { title, type, startDate, endDate, venue, squads, participantIds },
                recurrence,
                userId
            );

            // One summary invitation per player for the whole series
            await safely(() => notifyInvited(events.map((event) => event._id), participantIds, userId));

            return res.status(201).json({ eventId: events[0]?._id, seriesId: series._id, occurrences: events.length });
        } catch (error) {
            return handleSeriesError(res, error);
        }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const newTeamEvent = await TeamEvent.create(
            [
                {
                    title,
                    type,
                    startDate,
                    endDate,
                    createdBy: userId,
                    venue,
                    squads
                },
            ],
            { session }
        );

        if (incoming.length > 0) {
            const participationDocs = incoming.map((p) => ({
                event: newTeamEvent[0]._id,
                user: p.userId,
                status: p.status || EventParticipationStatus.Pending,
            }));
            await EventParticipation.insertMany(participationDocs, { session });
        }

        await session.commitTransaction();
        session.endSession();

        await safely(() => notifyInvited([newTeamEvent[0]._id], participantIds, userId));

        return res.status(201).json({ eventId: newTeamEvent[0]._id });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /team-events/add-events - Create multiple team events
export const addEvents = async (req: Request, res: Response) => {
    const events = req.body;
    const userId = req.loggedUser?._id.toString();

    if (!userId) {
        return res.status(401).json({ error: ErrorMessages.notAuthenticated });
    }

    // Input validation
    if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ error: ErrorMessages.eventsArrayRequired });
    }

    for (const eventData of events) {
        const { title, type, startDate, endDate } = eventData;
        if (!title || !type || !startDate || !endDate) {
            return res.status(400).json({ error: ErrorMessages.teamEventFieldsRequired });
        }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const newTeamEvents = events.map((event) => ({
            title: event.title,
            type: event.type,
            startDate: event.startDate,
            endDate: event.endDate,
            createdBy: userId,
            venue: event.venue
        }));


        const createdTeamEvents = await TeamEvent.insertMany(newTeamEvents, { session, ordered: true });

        const allParticipations: IEventParticipation[] = [];

        createdTeamEvents.forEach((createdEvent, index) => {
            const eventParticipants = events[index].participants;

            if (Array.isArray(eventParticipants) && eventParticipants.length > 0) {
                const uniqueParticipants = [...new Set(eventParticipants)];

                const participationsForEvent = uniqueParticipants.map((user) => ({
                    user,
                    event: createdEvent._id,
                }));
                allParticipations.push(...participationsForEvent);
            }
        });

        if (allParticipations.length > 0) {
            await EventParticipation.insertMany(allParticipations, { session, ordered: true });
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({ events: createdTeamEvents });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
}

// PUT /team-events/update-event/:eventId - Update team event details
// Body `scope`: "this" (default), "following" or "all" for occurrences of a recurring series
export const updateTeamEvent = async (req: Request, res: Response) => {
    const eventId = req.params._id;
    const { title, type, startDate, endDate, venue, participations, squads, recurrence } = req.body;
    const scope = parseScope(req.body.scope);

    if (!eventId) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    if (!title || !type || !startDate || !endDate) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({ error: ErrorMessages.InvalidDateRange });
    }

    const currentEvent = await TeamEvent.findById(eventId);
    if (!currentEvent) {
        return res.status(404).json({ error: ErrorMessages.notFound });
    }

    if (!canAssignSquads(await ensurePermissions(req), squads, currentEvent.squads ?? [])) {
        return res.status(403).json({ error: ErrorMessages.squadNotCoached });
    }

    if (!Array.isArray(participations)) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    const incoming = await resolveParticipations(participations, squads);
    const actorId = req.loggedUser._id.toString();

    // Players are notified only about changes of the date, time or venue
    const scheduleChanged =
        new Date(startDate).getTime() !== currentEvent.startDate.getTime() ||
        new Date(endDate).getTime() !== currentEvent.endDate.getTime() ||
        String(venue ?? '') !== String(currentEvent.venue ?? '');

    // Series-wide changes
    if (currentEvent.series && scope !== EditScope.This) {
        try {
            const previousParticipants = (await EventParticipation.find({ event: currentEvent._id }).distinct('user')).map(String);
            const participantIds = incoming.map((p) => p.userId);
            const newParticipants = participantIds.filter((id) => !previousParticipants.includes(id));

            const result = await updateSeries(
                currentEvent,
                { title, type, startDate, endDate, venue, squads, participantIds },
                scope,
                recurrence
            );

            const affectedIds = [...result.updatedIds, ...result.createdIds];
            await safely(() => notifyInvited(affectedIds, newParticipants, actorId));
            if (scheduleChanged || recurrence) {
                await safely(() => notifyEventsChanged(affectedIds, actorId, newParticipants));
            }

            return res.status(200).json({ message: 'Team event updated', ...result });
        } catch (error) {
            return handleSeriesError(res, error);
        }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const teamEvent = await TeamEvent.findById(eventId).session(session);

        if (!teamEvent) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        const previousType = teamEvent.type;
        const notificationUserIds: string[] = [];

        // Update fields
        teamEvent.title = title;
        teamEvent.type = type;
        teamEvent.startDate = new Date(startDate);
        teamEvent.endDate = new Date(endDate);
        teamEvent.venue = venue;
        teamEvent.squads = squads;

        // An occurrence edited on its own is no longer changed by series-wide edits of its fields
        if (teamEvent.series) {
            teamEvent.isException = true;
        }

        await teamEvent.save({ session });

        // Load participations
        const existingParticipations = await EventParticipation.find({ event: eventId }).session(session);
        const existingMap = new Map(
            existingParticipations.map((p) => [
                String(p.user),
                p,
            ])
        );

        const incomingMap = new Map(
            incoming.map((p) => [
                String(p.userId),
                p,
            ])
        );

        // Update existing participations
        for (const [userId, participation] of incomingMap) {
            const existing = existingMap.get(userId);
            const status = participation.status || EventParticipationStatus.Pending;

            if (existing) {
                // Update status if changed
                if (existing.status !== status) {
                    existing.status = status;
                    await existing.save({ session });
                }
            } else {
                // Create new participation
                await EventParticipation.create(
                    [
                        {
                            event: eventId,
                            user: userId,
                            status,
                        },
                    ],
                    { session }
                );
                notificationUserIds.push(String(userId));
            }
        }

        // Remove participations that are no longer present
        for (const [userId, existing] of existingMap) {
            if (!incomingMap.has(userId)) {
                await EventParticipation.deleteOne(
                    { _id: existing._id },
                    { session }
                );
            }
        }

        await session.commitTransaction();
        session.endSession();

        // Turning an event into a match nominates all participants again
        const invitedIds: string[] =
            type === TeamEventType.Match && previousType !== TeamEventType.Match
                ? Array.from(incomingMap.keys()).map((id) => String(id))
                : notificationUserIds;

        await safely(() => notifyInvited([teamEvent._id], invitedIds, actorId));
        if (scheduleChanged) {
            await safely(() => notifyEventsChanged([teamEvent._id], actorId, invitedIds));
        }

        return res.status(200).json({ message: "Team event updated" });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
}

// POST /team-event/cancel-event/:_id - Cancel event (body: scope, reason); canceled events stay visible
export const cancelTeamEvent = async (req: Request, res: Response) => {
    const scope = parseScope(req.body?.scope);
    const reason = req.body?.reason;

    if (reason && String(reason).length > CANCEL_REASON_MAX_LENGTH) {
        return res.status(400).json({ error: ErrorMessages.cancelReasonTooLong });
    }

    try {
        const teamEvent = await TeamEvent.findById(req.params._id);

        if (!teamEvent) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        const actorId = req.loggedUser._id.toString();
        const cancelReason = reason ? String(reason).trim() : undefined;
        const canceledIds = await cancelEvents(teamEvent, scope, cancelReason, actorId);
        await safely(() => notifyEventsCanceled(canceledIds, actorId, cancelReason));

        return res.status(200).json({ message: 'Team event canceled', canceledIds });
    } catch (error) {
        return handleSeriesError(res, error);
    }
};

// POST /team-event/restore-event/:_id - Restore a canceled event
export const restoreTeamEvent = async (req: Request, res: Response) => {
    try {
        const teamEvent = await TeamEvent.findById(req.params._id);

        if (!teamEvent) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        await restoreEvent(teamEvent);
        await safely(() => notifyEventRestored(teamEvent._id, req.loggedUser._id));

        return res.status(200).json({ message: 'Team event restored' });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// DELETE /team-event/delete-event/:_id?scope= - Delete event (or part of a series) with participations and comments
export const deleteTeamEvent = async (req: Request, res: Response) => {
    const eventId = req.params._id;
    const scope = parseScope(req.query.scope);

    if (!eventId) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const teamEvent = await TeamEvent.findById(eventId);

        if (!teamEvent) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        // Recipients must be collected before the events and their participations disappear
        const targets = await findDeleteTargets(teamEvent, scope);
        const sendNotifications = await prepareDeletedNotification(targets.map((event) => event._id), req.loggedUser._id);

        const deletedIds = await deleteEvents(teamEvent, scope);
        await safely(sendNotifications);

        return res.status(200).json({ message: "Team event deleted", deletedIds });
    } catch (error) {
        return handleSeriesError(res, error);
    }
}

// POST /team-event/remind/:_id - Remind players who have not answered yet
export const remindTeamEvent = async (req: Request, res: Response) => {
    try {
        const teamEvent = await TeamEvent.findById(req.params._id);

        if (!teamEvent) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        if (teamEvent.status === TeamEventStatus.Canceled) {
            return res.status(400).json({ error: ErrorMessages.eventCanceled });
        }

        if (teamEvent.endDate < new Date()) {
            return res.status(400).json({ error: ErrorMessages.eventFinished });
        }

        const lastReminder = teamEvent.manualReminderAt?.getTime() ?? 0;
        if (Date.now() - lastReminder < MANUAL_REMINDER_INTERVAL_MS) {
            return res.status(429).json({ error: ErrorMessages.reminderTooSoon });
        }

        teamEvent.manualReminderAt = new Date();
        await teamEvent.save();

        const remindedCount = await notifyRsvpReminder(teamEvent._id, req.loggedUser._id);
        return res.status(200).json({ message: 'Reminder sent', remindedCount });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};
