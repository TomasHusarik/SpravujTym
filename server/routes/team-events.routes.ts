import express from 'express';
import { addEvent, addEvents, getParticipantEvents, getTeamEventById, updateParticapationStatus, updateTeamEvent } from '@controllers/team-events.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireCanCreateEvent } from '@middleware/permission.rules';

const router = express.Router();

router.use(authMiddleware);

// GET /team-event/:id - Get team event by ID
router.get('/get-team-event/:_id', getTeamEventById);

// GET /participant-team-events - Get all participant team events
router.get('/get-participant-events', getParticipantEvents);

// POST /team-events/add-event - Create a new team event
router.post('/add-event', requireCanCreateEvent, addEvent);

// POST /team-events/add-events - Create multiple team events
router.post('/add-events', requireCanCreateEvent, addEvents);

// PUT /team-event/update-participation-status - Update participation status
router.post('/update-participation-status', updateParticapationStatus);

// PUT /team-event/update-event/:id - Update team event by ID
router.put('/update-event/:_id', requireCanCreateEvent, updateTeamEvent);

export default router;