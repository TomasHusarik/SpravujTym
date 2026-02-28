// middleware/guards.ts
import { NextFunction, Request, Response } from 'express';
import { ensurePermissions } from './permission.middleware';
import ErrorMessages from '@utils/errorMessages';

type Rule = (req: Request) => boolean;

export const requireAccess = (rule: Rule, forbiddenMessage = 'Forbidden') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const permissions = await ensurePermissions(req);

      if (permissions.isAdmin) return next();

      if (!rule(req)) {
        return res.status(403).json({ error: forbiddenMessage });
      }

      return next();
    } catch (error: any) {
      if (error?.message === ErrorMessages.notAuthenticated) {
        return res.status(401).json({ error: ErrorMessages.notAuthenticated });
      }
      return res.status(500).json({ error: 'Failed to authorize request' });
    }
  };
};