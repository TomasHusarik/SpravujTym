import { randomBytes } from "crypto";
import e, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import env from '@utils/validateEnv';

const isProd = process.env.NODE_ENV === "production";

// Helper function to generate random password
export const generateRandomPassword = (): string => {
    return randomBytes(12).toString('hex');
};

// Escape user-provided text before inserting it into HTML (e.g. e-mail templates)
export const escapeHtml = (value: unknown): string => {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

// Pick only allowed keys from a request body (prevents mass assignment)
export const pickFields = <T extends string>(source: Record<string, unknown>, fields: readonly T[]) => {
    const result: Partial<Record<T, unknown>> = {};
    for (const field of fields) {
        if (source?.[field] !== undefined) result[field] = source[field];
    }
    return result;
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