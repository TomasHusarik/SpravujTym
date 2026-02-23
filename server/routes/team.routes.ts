import { addTeam, getTeam } from '@controllers/team.controller';
import express from 'express';

const router = express.Router();

// GET /user/get-users - Get all users
router.get('/get-team/:_id', getTeam);

// POST /user/login - User login
router.post('/add-team', addTeam);

export default router;