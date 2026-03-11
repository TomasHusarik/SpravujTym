import { randomBytes } from "crypto";
import e, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import env from '@utils/validateEnv';

const isProd = process.env.NODE_ENV === "production";

// Helper function to generate random password
export const generateRandomPassword = (): string => {
    return randomBytes(12).toString('hex');
};

//#region Token and Cookie Helpers

// Create JWT token
export const createToken = (payload: object) => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
};

// Middleware to set auth cookie
export const generateTokenCookie = (res: Response, token: string) => {
    res.cookie("authToken", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

// Middleware to clear auth cookie
export const resetCookie = (res: Response) => {
    res.clearCookie("authToken", {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax"
    });
};