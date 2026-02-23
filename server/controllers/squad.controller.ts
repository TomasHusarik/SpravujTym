import { Request, Response } from "express";
import Squad from "@models/Squad";
import ErrorMessages from "@utils/errorMessages";

// POST /team/add-team - Create a new team
export const addSquad = async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const newTeam = await Squad.create( req.body );
        return res.status(201).json(newTeam);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};
