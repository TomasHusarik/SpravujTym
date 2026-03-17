import e, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import env from '@utils/validateEnv';

import ErrorMessages from '@utils/errorMessages';
import User from '@models/User';
import { createToken, generateRandomPassword, generateTokenCookie, resetCookie } from '@utils/helpers';
import { RegistrationMail } from '@mails/RegistrationMail';
import SquadMembership from '@models/SquadMembership';
import { resolveUserPermissions } from '@middleware/permission.middleware';
import { UserReadyMail } from '@mails/UserReadyMail';


// GET /user/get-user/:id - Get user by ID
export const getUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.userId).select('-password').lean();
        if (!user) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// GET /user/get-users - Get all users
export const getUsers = async (req: Request, res: Response) => {
    const showInactive = req.query.showInactive === 'true';

    try {
        const users = await User.find({ new: false, active: !showInactive}).select('-password').lean();
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /user/update-user/:id - Edit user by ID
export const updateUser = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const { _id, ...updateData } = req.body;

    if (!userId) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        // Only admin can update isAdmin field
        if (!req.loggedUser.isAdmin) {
            delete updateData.isAdmin;
            delete updateData.new;
            delete updateData.email;
            delete updateData.active;
        }

        // Update fields
        Object.assign(user, updateData);

        const isOwnProfile = req.loggedUser?._id.toString() === userId;
        if (isOwnProfile && user.new) {
            // If user is updating their own profile and is marked as new, set new to false and send ready email
            user.new = false;

            // Send email notification that user is ready
            await UserReadyMail(user);
        }

        await user.save();

        const { password: _, ...userData } = user.toObject();

        if (updateData.active === false) {
            await SquadMembership.deleteMany({ user: user._id });
        }

        return res.status(200).json(userData);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    } 
};

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
    const {email} = req.body;

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

        const newUser = await User.create({ email, password: hash });

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

// POST /user/sign-up-admin - Admin registration
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

        const newUser = await User.create({ ...req.body, password: hash, new: false });

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

// PUT /user/update-password - Update user password
export const updatePassword = async (req: Request, res: Response) => {
    const { currentPassword, newPassword, confirmPassword, userId } = req.body;

    if (!userId) {
        return res.status(401).json({ error: ErrorMessages.notAuthenticated });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: ErrorMessages.emailPasswordRequired });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: ErrorMessages.passwordConfirmationMismatch });
    }

    try {
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: ErrorMessages.passwordSameAsCurrent });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);
        user.password = hash;
        await user.save();

        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
}

// POST /user/logout - User logout
export const logout = (req: Request, res: Response) => {
    resetCookie(res);
    return res.status(200).json({ message: 'Logged out' });
};

// GET /user/authUser - Get current user
export const authUser = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.authToken;

        if (!token) {
            return res.status(401).json({ error: ErrorMessages.notAuthenticated });
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

// GET /user/permissions - Get current user permissions
export const getPermissions = async (req: Request, res: Response) => {
    try {
        if (req.permissions) {
            return res.status(200).json(req.permissions);
        }

        const userId = req.loggedUser?._id.toString();
        if (!userId) {
            return res.status(401).json({ error: ErrorMessages.notAuthenticated });
        }

        const permissions = await resolveUserPermissions(userId.toString());
        return res.status(200).json(permissions);
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// DELETE /user/delete-user/:id - Soft delete user by ID
export const deleteUser = async (req: Request, res: Response) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: ErrorMessages.notFound });
        }

        user.active = false;
        await user.save();

        await SquadMembership.deleteMany({ user: user._id });


        return res.status(200).json({ message: 'User deactivated successfully' });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};