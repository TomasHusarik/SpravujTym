import express from 'express';
import { addEvents, cancelTeamEvent, createTeamEvent, deleteTeamEvent, restoreTeamEvent, remindTeamEvent, getTeamEventById, getTeamEvents, updateParticapationStatus, updateTeamEvent } from '@controllers/team-events.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireCanCreateEvent, requireEventManager } from '@middleware/permission.rules';

const router = express.Router();

router.use(authMiddleware);

// GET /team-event/:id - Get team event by ID
router.get('/get-team-event/:_id', getTeamEventById);

// GET /participant-team-events - Get all participant team events
router.get('/get-participant-events', getTeamEvents);

// POST /team-event/create-team-event - Create a new team event
router.post('/create-team-event', requireCanCreateEvent, createTeamEvent);

// POST /team-events/add-events - Create multiple team events
router.post('/add-events', requireCanCreateEvent, addEvents);

// PUT /team-event/update-participation-status - Update participation status
router.post('/update-participation-status', updateParticapationStatus);

// PUT /team-event/update-event/:id - Update team event by ID
router.put('/update-event/:_id', requireEventManager, updateTeamEvent);

// POST /team-event/cancel-event/:id - Cancel event (body: scope, reason)
router.post('/cancel-event/:_id', requireEventManager, cancelTeamEvent);

// POST /team-event/restore-event/:id - Restore canceled event
router.post('/restore-event/:_id', requireEventManager, restoreTeamEvent);

// POST /team-event/remind/:id - Remind players who have not answered
router.post('/remind/:_id', requireEventManager, remindTeamEvent);

// DELETE /team-event/delete-event/:id - Delete team event by ID
router.delete('/delete-event/:_id', requireEventManager, deleteTeamEvent);

export default router;