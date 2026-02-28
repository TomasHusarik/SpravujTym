import { addLeague } from '@controllers/league.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireAdmin } from '@middleware/permission.rules';
import express from 'express';

const router = express.Router();

router.use(authMiddleware);

// POST /user/login - User login
router.post('/add-league',  requireAdmin, addLeague);

export default router;