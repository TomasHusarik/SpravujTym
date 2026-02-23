import Venue from '@models/Venue';
import ErrorMessages from '@utils/errorMessages';
import { Request, Response } from 'express';

// GET /venues/get-venue - Get all venues
export const getVenues = async (req: Request, res: Response) => {
    try {
        const venues = await Venue.find().lean();
        return res.status(200).json(venues);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

//POST /venues/add-venue - Create a new venue
export const addVenue = async (req: Request, res: Response) => {
    const { name, city, address, capacity } = req.body;

    // Input validation
    if (!name || !address || !city || !capacity) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField});
    }

    try {
        const newVenue = new Venue({ name, city, address, capacity });
        await newVenue.save();
        return res.status(201).json(newVenue);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};