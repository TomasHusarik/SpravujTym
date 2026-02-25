import e, { Request, Response } from 'express';
import ErrorMessages from '@utils/errorMessages';
import TeamEvent from '@models/TeamEvent';
import mongoose from 'mongoose';
import EventParticipation, { IEventParticipation } from '@models/EventParticipation';

// GET /team-event/:id - Get team event by ID
export const getTeamEventById = async (req: Request, res: Response) => {

    try {
        const teamEvent = await TeamEvent.findById({ _id: req.params._id }).populate('eventParticipations').populate('venue', 'name').lean();

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
    const userId = req.loggedUser?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const myParticipations = await EventParticipation
            .find({ userId })
            .lean();

        if (myParticipations.length === 0) {
            return res.status(200).json([]); // Return empty array if no participations found
        }

        const eventIds = myParticipations.map(p => p.eventId);

        const events = await TeamEvent
            .find({ _id: { $in: eventIds } })
            .populate('venue', 'name')
            .lean();

        const participationMap = new Map(
            myParticipations.map(p => [p.eventId.toString(), p])
        );

        const result = events.map(event => ({
            ...event,
            participations: [
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
    const { eventId, status } = req.body;
    const userId = req.loggedUser?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!eventId || !status) {
        return res.status(400).json({ error: 'Event ID and status are required' });
    }

    try {
        const participation = await EventParticipation.findOne({ eventId, userId });

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

// POST /team-events/add-event - Create a new team event
export const addEvent = async (req: Request, res: Response) => {
    const { title, type, startDate, endDate, venue, participants } = req.body;

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
            venue
        });
        await newTeamEvent.save({ session });

        if (Array.isArray(participants) && participants.length > 0) {
            const uniqueParticipants = [...new Set(participants)];

            const newParticipations = uniqueParticipants.map((userId) => ({
                userId,
                eventId: newTeamEvent._id,
            }));

            await EventParticipation.insertMany(newParticipations, { session });
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
            venue: event.venue
        }));


        const createdTeamEvents = await TeamEvent.insertMany(newTeamEvents, { session, ordered: true });

        const allParticipations: IEventParticipation[] = [];

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
    // 1️⃣ Načti aktuální participace
    const existing = await EventParticipation
      .find({ eventId })
      .select('userId')
      .lean();

    const existingIds = existing.map(p => p.userId.toString());
    const newIds = participants.map((id: string) => id.toString());

    // 2️⃣ Spočítej rozdíl
    const toAdd = newIds.filter(id => !existingIds.includes(id));
    const toRemove = existingIds.filter(id => !newIds.includes(id));

    // 3️⃣ Přidání nových
    if (toAdd.length > 0) {
      await EventParticipation.insertMany(
        toAdd.map(userId => ({
          eventId,
          userId
        })),
        { session }
      );
    }

    // 4️⃣ Odebrání
    if (toRemove.length > 0) {
      await EventParticipation.deleteMany(
        { eventId, userId: { $in: toRemove } },
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