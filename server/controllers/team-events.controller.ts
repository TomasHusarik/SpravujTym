import e, { Request, Response } from 'express';
import ErrorMessages from '@utils/errorMessages';
import TeamEvent from '@models/TeamEvent';
import mongoose from 'mongoose';
import Participation, { IParticipation } from '@models/Participation';

// GET /team-event/:id - Get team event by ID
export const getTeamEventById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const teamEvent = await TeamEvent.findById(id).populate('participation').lean();

        if (!teamEvent) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        return res.status(200).json({ event: teamEvent });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// GET /participant-team-events - Get all participant team events
export const getParticipantEvents = async (req: Request, res: Response) => {
    const userId = "6996f39ada959122aab1ecb8"

    if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const myParticipations = await Participation
            .find({ userId })
            .lean();

        if (myParticipations.length === 0) {
            return res.status(200).json({ teamEvents: [] });
        }

        const eventIds = myParticipations.map(p => p.eventId);

        const events = await TeamEvent
            .find({ _id: { $in: eventIds } })
            .populate('participation')
            .lean();

        const participationMap = new Map(
            myParticipations.map(p => [p.eventId.toString(), p])
        );

        const result = events.map(event => ({
            ...event,
            participations: participationMap.get(event._id.toString())
        }));

        return res.status(200).json({ teamEvents: result });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /team-events/add-event - Create a new team event
export const addEvent = async (req: Request, res: Response) => {
    const { title, type, startDate, endDate, venueId, participants } = req.body;

    // Input validation
    if (!title || !type || !startDate || !endDate) {
        return res.status(400).json({ error: ErrorMessages.teamEventFieldsRequired });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // const userId = req.loggedUser?.id;

        // if (!userId) {
        //     return res.status(401).json({ error: 'Not authenticated' });
        // }

        const newTeamEvent = new TeamEvent({
            title,
            type,
            startDate,
            endDate,
            createdBy: "6996f39ada959122aab1ecb8",
            venueId
        });
        await newTeamEvent.save({ session });

        if (Array.isArray(participants) && participants.length > 0) {
            const uniqueParticipants = [...new Set(participants)];

            const newParticipations = uniqueParticipants.map((userId) => ({
                userId,
                eventId: newTeamEvent._id,
            }));

            await Participation.insertMany(newParticipations, { session });
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({ event: newTeamEvent });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
}

// POST /team-events/add-events - Create multiple team events
export const addEvents = async (req: Request, res: Response) => {
    const events = req.body;

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
            createdBy: "6996f39ada959122aab1ecb8",
            venueId: event.venueId
        }));


        const createdTeamEvents = await TeamEvent.insertMany(newTeamEvents, { session, ordered: true });

        const allParticipations: IParticipation[] = [];

        createdTeamEvents.forEach((createdEvent, index) => {
            const eventParticipants = events[index].participants;

            if (Array.isArray(eventParticipants) && eventParticipants.length > 0) {
                const uniqueParticipants = [...new Set(eventParticipants)];

                const participationsForEvent = uniqueParticipants.map((userId) => ({
                    userId,
                    eventId: createdEvent._id,
                }));
                allParticipations.push(...participationsForEvent);
            }
        });

        if (allParticipations.length > 0) {
            await Participation.insertMany(allParticipations, { session, ordered: true });
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