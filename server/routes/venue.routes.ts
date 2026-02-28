import express from 'express';
import { addVenue, getVenues } from '@controllers/venue.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireAdmin, requireCoachOfSquad } from '@middleware/permission.rules';

const router = express.Router();

router.use(authMiddleware);

// GET /venues/get-venue - Get all venues
router.get('/get-venues', getVenues);

//POST /venues/add-venue - Create a new venue
router.post('/add-venue', requireAdmin, addVenue);

export default router;