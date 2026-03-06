import { addLeague, getLeagues } from '@controllers/league.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireAdmin } from '@middleware/permission.rules';
import express from 'express';

const router = express.Router();

router.use(authMiddleware);

// POST /league/add-league - Add a new league
router.post('/add-league',  requireAdmin, addLeague);

// GET /league/get-leagues - Get all leagues
router.get('/get-leagues', getLeagues);

export default router;