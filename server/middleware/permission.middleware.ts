// middleware/permissions.middleware.ts
import { NextFunction, Request, Response } from 'express';
import User from '@models/User';
import SquadMembership, { SquadRole } from '@models/SquadMembership';
import { UserPermissions } from '@utils/specialTypes';
import ErrorMessages from '@utils/errorMessages';

const notAuth = () => new Error(ErrorMessages.notAuthenticated);

export const resolveUserPermissions = async (userId: string): Promise<UserPermissions> => {
  const [user, memberships] = await Promise.all([
    User.findById(userId).select('isAdmin').lean(),
    SquadMembership.find({ user: userId, active: true })
      .select('squad roles')
      .lean(),
  ]);

  const isAdmin = !!user?.isAdmin;

  const coachSquadIds = memberships
    .filter((m) => (m.roles ?? []).includes(SquadRole.Coach))
    .map((m) => String(m.squad));

  const playerMembership = memberships.find((m) => (m.roles ?? []).includes(SquadRole.Player));
  const playerSquadId = playerMembership?.squad ? String(playerMembership.squad) : null;

  return {
    isAdmin,
    coachSquadIds,
    playerSquadId,
  };
};

export const ensurePermissions = async (req: Request): Promise<UserPermissions> => {
  if (req.permissions) return req.permissions;

  const userId = req.loggedUser?._id.toString();
  if (!userId) throw notAuth();

  const permissions = await resolveUserPermissions(userId);
  req.permissions = permissions;
  return permissions;
};

export const loadPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensurePermissions(req);
    next();
  } catch (error: any) {
    if (error?.message === ErrorMessages.notAuthenticated) {
      return res.status(401).json({ error: ErrorMessages.notAuthenticated });
    }
    return res.status(500).json({ error: 'Failed to resolve permissions' });
  }
};