import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '@utils/validateEnv';

type JwtPayload = {
    userId: string;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        req.loggedUser = { id: decoded.userId };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};