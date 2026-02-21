import express from 'express';
import { addEvent, addEvents, getParticipantEvents } from '@controllers/team-events.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = express.Router();

// POST /team-events/add-event - Create a new team event
router.post('/add-event', addEvent);

// POST /team-events/add-events - Create multiple team events
router.post('/add-events', addEvents);

// GET /participant-team-events - Get all participant team events
router.get('/get-participant-events', getParticipantEvents);

export default router;