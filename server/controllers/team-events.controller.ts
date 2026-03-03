import e, { Request, Response } from 'express';
import ErrorMessages from '@utils/errorMessages';
import TeamEvent from '@models/TeamEvent';
import mongoose from 'mongoose';
import EventParticipation, { IEventParticipation } from '@models/EventParticipation';

// GET /team-event/:id - Get team event by ID
export const getTeamEventById = async (req: Request, res: Response) => {

    try {
        const teamEvent = await TeamEvent.findById(req.params._id)
            .populate({
                path: 'eventParticipations',
                populate: { path: 'user' }
            })
            .populate('venue', 'name')
            .populate('squads', 'name')
            .lean();

        if (!teamEvent) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        return res.status(200).json(teamEvent);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// GET /get-participant-events - Get all participant team events
export const getParticipantEvents = async (req: Request, res: Response) => {
    const user = req.loggedUser?._id.toString();

    if (!user) {
        return res.status(401).json({ error: ErrorMessages.notAuthenticated });
    }

    try {
        const myParticipations = await EventParticipation
            .find({ user })
            .lean();

        if (myParticipations.length === 0) {
            return res.status(200).json([]); // Return empty array if no participations found
        }

        const eventIds = myParticipations.map(p => p.event);

        const events = await TeamEvent
            .find({ _id: { $in: eventIds } })
            .populate('venue', 'name')
            .lean();

        const participationMap = new Map(
            myParticipations.map(p => [p.event.toString(), p])
        );

        const result = events.map(event => ({
            ...event,
            eventParticipations: [
                participationMap.get(event._id.toString())
            ]
        }));

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// PUT /team-event/update-participation-status - Update participation status
export const updateParticapationStatus = async (req: Request, res: Response) => {
    const { status } = req.body;
    const event = req.body.event || req.body.eventId;
    const userId = req.loggedUser?._id.toString();

    if (!userId) {
        return res.status(401).json({ error: ErrorMessages.notAuthenticated });
    }

    if (!event || !status) {
        return res.status(400).json({ error: 'Event ID and status are required' });
    }

    try {
        const participation = await EventParticipation.findOne({ event, user: userId });

        if (!participation) {
            return res.status(404).json({ error: 'Participation not found' });
        }

        participation.status = status;
        await participation.save();

        return res.status(200).json({ message: 'Participation status updated' });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /team-event/create-team-event - Create a new team event
export const createTeamEvent = async (req: Request, res: Response) => {
    const { title, type, startDate, endDate, venue, participations, squads } = req.body;

    if (!title || !type || !startDate || !endDate) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.loggedUser?._id.toString();

        if (!userId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(401).json({ error: ErrorMessages.notAuthenticated });
        }

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

        if (Array.isArray(participations) && participations.length > 0) {
            const participationDocs = participations.map((p: any) => ({
                event: newTeamEvent[0]._id,
                user: p.userId,
                status: p.status || 'pending',
            }));
            await EventParticipation.insertMany(participationDocs, { session });
        }

        await session.commitTransaction();
        session.endSession();

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

// PUT /team-events/:eventId/participants - Update participants of a team event
export const updateParticipants = async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { participants } = req.body;

    if (!Array.isArray(participants)) {
        return res.status(400).json({ error: "Participants must be an array" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const existing = await EventParticipation
            .find({ event: eventId })
            .select('user')
            .lean();

        const existingIds = existing.map(p => p.user.toString());
        const newIds = participants.map((id: string) => id.toString());

        const toAdd = newIds.filter(id => !existingIds.includes(id));
        const toRemove = existingIds.filter(id => !newIds.includes(id));

        if (toAdd.length > 0) {
            await EventParticipation.insertMany(
                toAdd.map(user => ({
                    event: eventId,
                    user
                })),
                { session }
            );
        }

        if (toRemove.length > 0) {
            await EventParticipation.deleteMany(
                { event: eventId, user: { $in: toRemove } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ message: "Participants updated" });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ error: "Internal server error" });
    }
};

// PUT /team-events/update-event/:eventId - Update team event details
export const updateTeamEvent = async (req: Request, res: Response) => {
    const eventId = req.params;
    const { title, type, startDate, endDate, venue, participations, squads } = req.body;

    if (!eventId) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    if (!title || !type || !startDate || !endDate) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
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

        // Update fields
        teamEvent.title = title;
        teamEvent.type = type;
        teamEvent.startDate = new Date(startDate);
        teamEvent.endDate = new Date(endDate);
        teamEvent.venue = venue;
        teamEvent.squads = squads;

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
            participations.map((p: any) => [
                String(p.userId),
                p,
            ])
        );

        // Update existing participations
        for (const [userId, incoming] of incomingMap) {
            const existing = existingMap.get(userId.toString());

            if (existing) {
                // Update status if changed
                if (existing.status !== (incoming as any).status) {
                    existing.status = (incoming as any).status;
                    await existing.save({ session });
                }
            } else {
                // Create new participation
                await EventParticipation.create(
                    [
                        {
                            event: eventId,
                            user: userId,
                            status: (incoming as any).status,
                        },
                    ],
                    { session }
                );
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

        return res.status(200).json({ message: "Team event updated" });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
}
