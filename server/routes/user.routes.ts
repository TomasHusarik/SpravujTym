import express from 'express';
import { signUp, login, signUpAdmin, logout, authUser, getUsers, getUser, updateUser, getPermissions, updatePassword, deleteUser } from '@controllers/user.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireAdmin, requireCoachOfSquad, requireLoggedUser } from '@middleware/permission.rules';

const router = express.Router();

// POST /user/login - User login
router.post('/login', login);

// POST /user/sign-up-admin - Admin registration
router.post('/sign-up-admin', signUpAdmin);


// All routes below require authentication
router.use(authMiddleware);

// PUT /user/update-password - Update user password
router.put('/update-password', requireLoggedUser, updatePassword);

// GET /user/me - Get current user
router.get('/auth-user', authUser);

// GET /user/permissions - Get current user permissions
router.get('/permissions', getPermissions);

// POST /user/logout - User logout
router.post('/logout', logout);

// GET /user/get-user/:id - Get user by ID
router.get('/get-user/:userId', getUser);

// GET /user/get-users - Get all users
router.get('/get-users', getUsers);

// PUT /user/update-user/:id - Edit user by ID
router.put('/update-user/:userId', requireLoggedUser, updateUser);

// POST /user/sign-up - User registration
router.post('/sign-up', requireAdmin, signUp);

// DELETE /user/delete-user/:id - Delete user by ID
router.delete('/delete-user/:userId', requireAdmin, deleteUser);



export default router;