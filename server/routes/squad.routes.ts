import { addSquad } from '@controllers/squad.controller';
import express from 'express';

const router = express.Router();

// POST /user/login - User login
router.post('/add-squad', addSquad);

export default router;