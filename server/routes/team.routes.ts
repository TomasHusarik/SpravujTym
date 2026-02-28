import { addTeam, getTeam } from '@controllers/team.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireAdmin } from '@middleware/permission.rules';
import express from 'express';

const router = express.Router();

// All routes below require authentication
router.use(authMiddleware);

// GET /user/get-users - Get all users
router.get('/get-team/:_id', getTeam);

// POST /user/login - User login
router.post('/add-team', requireAdmin, addTeam);

export default router;