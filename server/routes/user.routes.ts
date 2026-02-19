import express from 'express';
import { signUp, login, signUpAdmin, logout, authUser } from '@controllers/user.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = express.Router();

// POST /user/login - User login
router.post('/login', login);

// POST /user/sign-up - User registration
router.post('/sign-up', signUp);

// POST /user/sign-up-admin - Admin registration
router.post('/sign-up-admin', signUpAdmin);

// POST /user/logout - User logout
router.post('/logout', logout);

// GET /user/me - Get current user (protected)
router.get('/auth-user', authMiddleware, authUser);

export default router;