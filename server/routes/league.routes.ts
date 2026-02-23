import { addLeague } from '@controllers/league.controller';
import express from 'express';

const router = express.Router();

// POST /user/login - User login
router.post('/add-league', addLeague);

export default router;