// middleware/permission.rules.ts
import { Request } from 'express';
import { requireAccess } from './guards.middleware';

const getSquadId = (req: Request) =>
    String(req.params.squadId ?? req.body?.squadId ?? '');

export const requireCanCreateEvent = requireAccess(
    (req: Request) => (req.permissions?.coachSquadIds.length ?? 0) > 0,
    'Permission to create event is required'
);

export const requireCoachOfSquad = requireAccess(
    (req: Request) => {
        const squadId = getSquadId(req);
        if (!squadId) return false;
        return req.permissions!.coachSquadIds.includes(squadId);
    },
    'Coach permission for this squad is required'
);

export const requireAdmin = requireAccess(
    (req: Request) => false,
    'Admin permission required'
);

export const requireLoggedUser = requireAccess(
    (req: Request) => {
        const loggedUserId = req.loggedUser._id.toString();
        let targetUserId = req.params.userId ?? req.body?.userId ?? req.body?.author;

        if (loggedUserId === targetUserId) {
            return true;
        }

        const squadId = getSquadId(req);
        if (!squadId) return false;
        return req.permissions!.coachSquadIds.includes(squadId);
    },
    'You do not have permission to edit this user'
);