import { NextFunction, Request, Response } from 'express';
import ErrorMessages from '@utils/errorMessages';

type RateLimitOptions = {
    windowMs: number;
    max: number;
    keyGenerator?: (req: Request) => string;
};

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

const MAX_TRACKED_KEYS = 10000;

// Simple in-memory fixed-window rate limiter (sufficient for a single server instance)
export const rateLimit = ({ windowMs, max, keyGenerator }: RateLimitOptions) => {
    const hits = new Map<string, RateLimitEntry>();

    const removeExpired = (now: number) => {
        for (const [key, entry] of hits) {
            if (entry.resetAt <= now) hits.delete(key);
        }
    };

    return (req: Request, res: Response, next: NextFunction) => {
        const now = Date.now();
        const key = keyGenerator ? keyGenerator(req) : req.ip ?? 'unknown';
        const entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            if (hits.size >= MAX_TRACKED_KEYS) removeExpired(now);
            hits.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        entry.count += 1;

        if (entry.count > max) {
            res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
            return res.status(429).json({ error: ErrorMessages.tooManyRequests });
        }

        return next();
    };
};
