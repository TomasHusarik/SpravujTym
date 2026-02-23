import { Request, Response } from "express";
import Team from "@models/Team";
import ErrorMessages from "@utils/errorMessages";

// GET /team/get-team - Get team
export const getTeam = async (req: Request, res: Response) => {
    const teamId = req.params._id;

    if (!teamId) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const team = await Team.findById(teamId).populate('venue').populate('squads').lean();

        if (!team) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        return res.status(200).json(team);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /team/add-team - Create a new team
export const addTeam = async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const newTeam = await Team.create( req.body );
        return res.status(201).json(newTeam);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};
