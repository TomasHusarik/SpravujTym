// middleware/permission.rules.ts
import { Request } from 'express';
import mongoose from 'mongoose';
import { requireAccess } from './guards.middleware';
import SquadMembership from '@models/SquadMembership';
import TeamEvent from '@models/TeamEvent';
import { UserPermissions } from '@utils/specialTypes';

// Squads and creator can be plain ids or populated documents
type ManagedEvent = {
    squads?: unknown[];
    createdBy?: unknown;
};

const toId = (value: unknown) =>
    String((value as { _id?: unknown })?._id ?? value ?? '');

// Admin, the creator of the event or a coach of one of its squads can manage the event
export const canManageEvent = (userId: string, permissions: UserPermissions, event: ManagedEvent) => {
    if (permissions.isAdmin) return true;
    if (toId(event.createdBy) === userId) return true;
    return (event.squads ?? []).some((squad) => permissions.coachSquadIds.includes(toId(squad)));
};

// Non-admin users can only assign events to squads they coach (squads already on the event may stay)
export const canAssignSquads = (permissions: UserPermissions, squadIds: unknown, currentSquadIds: unknown[] = []) => {
    if (permissions.isAdmin) return true;
    if (squadIds === undefined || squadIds === null) return true;
    if (!Array.isArray(squadIds)) return false;

    const allowedIds = [...permissions.coachSquadIds, ...currentSquadIds.map(toId)];
    return squadIds.every((squadId) => allowedIds.includes(toId(squadId)));
};

export const requireCanCreateEvent = requireAccess(
    (req: Request) => (req.permissions?.coachSquadIds.length ?? 0) > 0,
    'Permission to create event is required'
);

export const requireEventManager = requireAccess(
    async (req: Request) => {
        const eventId = String(req.params._id ?? '');
        if (!mongoose.isValidObjectId(eventId)) return false;

        const event = await TeamEvent.findById(eventId).select('squads createdBy').lean();
        if (!event) return false;

        return canManageEvent(req.loggedUser._id.toString(), req.permissions!, event);
    },
    'Permission to manage this event is required'
);

export const requireCoachOfSquad = requireAccess(
    (req: Request) => {
        const squadId = String(req.params.squadId ?? '');
        if (!squadId) return false;
        return req.permissions!.coachSquadIds.includes(squadId);
    },
    'Coach permission for this squad is required'
);

export const requireCoachOfMembership = requireAccess(
    async (req: Request) => {
        const membershipId = String(req.params.membershipId ?? '');
        if (!mongoose.isValidObjectId(membershipId)) return false;

        const membership = await SquadMembership.findById(membershipId).select('squad').lean();
        if (!membership) return false;

        return req.permissions!.coachSquadIds.includes(String(membership.squad));
    },
    'Coach permission for this squad is required'
);

export const requireAdmin = requireAccess(
    (req: Request) => req.permissions?.isAdmin === true,
    'Admin permission is required'
);

export const requireSelf = requireAccess(
    (req: Request) => req.loggedUser._id.toString() === String(req.params.userId ?? ''),
    'You do not have permission to access this user'
);
