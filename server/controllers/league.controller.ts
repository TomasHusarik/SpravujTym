import { Request, Response } from "express";
import ErrorMessages from "@utils/errorMessages";
import League from "@models/League";

// POST /team/add-team - Create a new team
export const addLeague = async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const newTeam = await League.create( req.body );
        return res.status(201).json(newTeam);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// GET /league/get-leagues - Get all leagues
export const getLeagues = async (req: Request, res: Response) => {
    try {
        const leagues = await League.find().lean();
        return res.status(200).json(leagues);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};
