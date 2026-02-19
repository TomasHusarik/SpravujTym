import { randomBytes } from "crypto";
import e, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import env from '@utils/validateEnv';

// Helper function to generate random password
export const generateRandomPassword = (): string => {
    return randomBytes(12).toString('hex');
};

//#region Token and Cookie Helpers

// Token generation
export const createToken = (payload: object) => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
};

// Helper function to set token cookie
export const generateTokenCookie = (res: Response, token: string) => {
    res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}

// Helper function to clear token cookie
export const resetCookie = (res: Response) => {
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
};