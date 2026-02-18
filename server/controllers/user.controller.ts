import e, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import env from '@utils/validateEnv';

import ErrorMessages from '@utils/errorMessages';
import User from '@models/User';
import { createToken, generateRandomPassword, generateTokenCookie, resetCookie } from '@utils/helpers';
import { RegistrationMail } from '@mails/RegistrationMail';

// POST /user/login - User login
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        // Input validation
        if (!email || !password) {
            return res.status(400).json({ error: ErrorMessages.emailPasswordRequired });
        }

        // Find user and explicitly select password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ error: ErrorMessages.invalidCredentials });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: ErrorMessages.invalidCredentials });
        }

        // Generate token
        const token = createToken({ userId: user._id.toString(), });

        // Remove password from response
        const { password: _, ...userData } = user.toObject();

        generateTokenCookie(res, token);

        return res.status(200).json({ user: userData });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /user/sign-up - User registration
export const signUp = async (req: Request, res: Response) => {
    const { email } = req.body;

    // Input validation
    if (!email) {
        return res.status(400).json({ error: ErrorMessages.emailRequired });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: ErrorMessages.invalidEmailFormat });
    }

    // if (!validator.isStrongPassword(password, { minSymbols: 6 })) {
    //     return res.status(400).json({ error: ErrorMessages.weakPassword });
    // }

    try {
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: ErrorMessages.emailAlreadyInUse });
        }

        const pass = generateRandomPassword();
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(pass, salt);

        const newUser = await User.create({ ...req.body, password: hash });

        // Generate token for the new user
        // const token = createToken({ userId: newUser._id.toString() });

        // Send email with generated password
        await RegistrationMail(email, pass);

        // Remove password from response
        const { password: _, ...userData } = newUser.toObject();

        // return res.status(201).json({ user: userData, token });
        return res.status(201).json({ user: userData, password: pass });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /user/sign-up - User registration
export const signUpAdmin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
        return res.status(400).json({ error: ErrorMessages.emailPasswordRequired });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: ErrorMessages.invalidEmailFormat });
    }

    // if (!validator.isStrongPassword(password, { minSymbols: 6 })) {
    //     return res.status(400).json({ error: ErrorMessages.weakPassword });
    // }

    try {
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: ErrorMessages.emailAlreadyInUse });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const newUser = await User.create({ ...req.body, password: hash });

        // Generate token for the new user
        // const token = createToken({ userId: newUser._id.toString() });

        // Remove password from response
        const { password: _, ...userData } = newUser.toObject();

        // return res.status(201).json({ user: userData, token });
        return res.status(201).json({ user: userData });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /user/logout - User logout
export const logout = (req: Request, res: Response) => {
    resetCookie(res);
    return res.status(200).json({ message: 'Logged out' });
};

// GET /user/me - Get current user
export const authUser = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.authToken;

        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ user });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};