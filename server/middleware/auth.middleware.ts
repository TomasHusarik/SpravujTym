import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '@utils/validateEnv';

export interface AuthRequest extends Request {
    userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};