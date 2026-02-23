import express from 'express';
import { signUp, login, signUpAdmin, logout, authUser, getUsers, getUser, updateUser } from '@controllers/user.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = express.Router();

// GET /user/get-user/:id - Get user by ID
router.get('/get-user/:userId', authMiddleware, getUser);

// GET /user/get-users - Get all users
router.get('/get-users', authMiddleware, getUsers);

// POST /user/login - User login
router.post('/login', login);

// POST /user/sign-up - User registration
router.post('/sign-up', signUp);

// POST /user/sign-up-admin - Admin registration
router.post('/sign-up-admin', signUpAdmin);

// POST /user/logout - User logout
router.post('/logout', logout);

// PUT /user/update-user/:id - Edit user by ID
router.put('/update-user/:userId', authMiddleware, updateUser);

// GET /user/me - Get current user (protected)
router.get('/auth-user', authMiddleware, authUser);

export default router;