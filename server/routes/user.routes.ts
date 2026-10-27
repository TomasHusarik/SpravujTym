import express from 'express';
import { signUp, login, signUpAdmin, logout, authUser, getUsers, getUser, updateUser, getPermissions, updatePassword, deleteUser } from '@controllers/user.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireAdmin, requireSelf } from '@middleware/permission.rules';
import { rateLimit } from '@middleware/rateLimit.middleware';

const router = express.Router();

// Limit login attempts per IP and e-mail to slow down password guessing
const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => `${req.ip}:${String(req.body?.email ?? '').toLowerCase()}`,
});

// POST /user/login - User login
router.post('/login', loginRateLimit, login);


// All routes below require authentication
router.use(authMiddleware);

// POST /user/sign-up-admin - Admin registration (only an existing admin can create another admin)
router.post('/sign-up-admin', requireAdmin, signUpAdmin);

// PUT /user/update-password - Update password of the logged user
router.put('/update-password', updatePassword);

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
router.put('/update-user/:userId', requireSelf, updateUser);

// POST /user/sign-up - User registration
router.post('/sign-up', requireAdmin, signUp);

// DELETE /user/delete-user/:id - Delete user by ID
router.delete('/delete-user/:userId', requireAdmin, deleteUser);



export default router;
