import { NextFunction, Request, Response } from 'express';
import User from '@models/User';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.header('x-test-user-id');

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await User.findById(userId).select('-password').lean();

  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  req.loggedUser = {
    ...user,
    _id: user._id,
  };

  next();
};
