import { Request, Response } from "express";
import Squad from "@models/Squad";
import SquadMembership, { SquadRole } from "@models/SquadMembership";
import User from "@models/User";
import ErrorMessages from "@utils/errorMessages";

// GET /squad/get-squads - Get all squads
export const getSquads = async (_req: Request, res: Response) => {
    try {
        const squads = await Squad.find().populate({
            path: 'memberships',
            populate: { path: 'user' }
        }).populate('league').lean();
        return res.status(200).json(squads);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// GET /squad/get-squad/:_id - Get squad by id
export const getSquad = async (req: Request, res: Response) => {
    const squadId = req.params._id;

    if (!squadId) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const squad = await Squad.findById(squadId).populate('league').lean();

        if (!squad) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        return res.status(200).json(squad);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /team/add-team - Create a new team
export const addSquad = async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const newTeam = await Squad.create(req.body);
        return res.status(201).json(newTeam);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// GET /squad/get-squad-members/:_id - Get squad roster by squad id
export const getSquadMembers = async (req: Request, res: Response) => {
    const squadId = req.params._id;

    if (!squadId) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const members = await SquadMembership.find({ squad: squadId, active: true })
            .populate('user')
            .lean();

        return res.status(200).json(members);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /squads/:squadId/members
export const addSquadMembers = async (req: Request, res: Response) => {
    const squadId = req.params.squadId;
    const { userIds = [], roles = [] } = req.body;


    if (!squadId || !Array.isArray(userIds) || !Array.isArray(roles)) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    if (userIds.length === 0 || roles.length === 0) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    // Ensure squad exists
    const uniqueUserIds = [...new Set(userIds)];
    const uniqueRoles = [...new Set(roles)];

    // Validate roles
    const invalidRole = uniqueRoles.some(
        (role) => !Object.values(SquadRole).includes(role)
    );

    if (invalidRole) {
        return res.status(400).json({ error: ErrorMessages.validationError });
    }

    try {
        // If adding player role, ensure user is not already a player in another squad
        if (uniqueRoles.includes(SquadRole.Player)) {
            const otherPlayerMemberships = await SquadMembership.find({
                user: { $in: uniqueUserIds },
                squad: { $ne: squadId as string },
                roles: SquadRole.Player,
                active: true,
            });

            for (const membership of otherPlayerMemberships) {
                if (membership.roles.length === 1) {
                    await membership.deleteOne();
                } else {
                    membership.roles = membership.roles.filter(
                        (r) => r !== SquadRole.Player
                    );
                    await membership.save();
                }
            }
        }
        // Add or update memberships for each user
        for (const userId of uniqueUserIds) {
            const existing = await SquadMembership.findOne({
                squad: squadId,
                user: userId,
            });

            if (existing) {
                existing.roles = Array.from(
                    new Set([...existing.roles, ...uniqueRoles])
                );
                existing.active = true;
                await existing.save();
            } else {
                await SquadMembership.create({
                    squad: squadId,
                    user: userId,
                    roles: uniqueRoles,
                    active: true,
                });
            }
        }

        return res.status(200).json({
            message: "Members added to squad successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: ErrorMessages.internalServerError,
        });
    }
};


// PUT /squad/update-squad-member-roles/:membershipId - Update roles of squad member
export const updateSquadMemberRoles = async (req: Request, res: Response) => {
    const membershipId = req.params.membershipId;
    const { roles } = req.body as { roles?: SquadRole[] };

    if (!membershipId || !roles || roles.length === 0) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    const hasInvalidRole = roles.some((role) => !Object.values(SquadRole).includes(role));
    if (hasInvalidRole) {
        return res.status(400).json({ error: ErrorMessages.validationError });
    }

    try {
        const membership = await SquadMembership.findById(membershipId);

        if (!membership) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        // If player role is being added, ensure user is not already a player in another squad
        if (roles.includes(SquadRole.Player)) {
            const otherPlayerMemberships = await SquadMembership.find({
                user: membership.user,
                squad: { $ne: membership.squad },
                roles: SquadRole.Player,
                active: true,
            });

            for (const otherMembership of otherPlayerMemberships) {
                if (otherMembership.roles.length === 1) {
                    await otherMembership.deleteOne();
                } else {
                    otherMembership.roles = otherMembership.roles.filter(
                        (r) => r !== SquadRole.Player
                    );
                    await otherMembership.save();
                }
            }
        }

        membership.roles = Array.from(new Set(roles));
        await membership.save();

        const populatedMembership = await membership.populate('user', 'firstName lastName email active');
        return res.status(200).json(populatedMembership);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// DELETE /squad/delete-squad-member/:membershipId - Remove user from squad roster
export const deleteSquadMember = async (req: Request, res: Response) => {
    const membershipId = req.params.membershipId;

    if (!membershipId) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const membership = await SquadMembership.findById(membershipId);

        if (!membership) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        await membership.deleteOne();

        return res.status(200).json({ message: "Member removed from squad successfully" });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};