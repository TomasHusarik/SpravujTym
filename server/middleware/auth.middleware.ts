import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '@utils/validateEnv';
import User from '@models/User';
import ErrorMessages from '@utils/errorMessages';

type JwtPayload = {
    userId: string;
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: ErrorMessages.notAuthenticated });
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        const user = await User.findById(decoded.userId).select('-password').lean();

        if (!user) {
            return res.status(401).json({ error: ErrorMessages.notAuthenticated });
        }

        req.loggedUser = {
            ...user,
            _id: user._id,
        };

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};