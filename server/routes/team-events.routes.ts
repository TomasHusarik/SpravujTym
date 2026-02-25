import express from 'express';
import { addEvent, addEvents, getParticipantEvents, getTeamEventById, updateParticapationStatus } from '@controllers/team-events.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = express.Router();

router.use(authMiddleware);

// GET /team-event/:id - Get team event by ID
router.get('/get-team-event/:_id', getTeamEventById);

// GET /participant-team-events - Get all participant team events
router.get('/get-participant-events', getParticipantEvents);

// POST /team-events/add-event - Create a new team event
router.post('/add-event', addEvent);

// POST /team-events/add-events - Create multiple team events
router.post('/add-events', addEvents);

// PUT /team-event/update-participation-status - Update participation status
router.post('/update-participation-status', updateParticapationStatus);

export default router;