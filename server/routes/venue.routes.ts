import express from 'express';
import { addVenue, getVenues } from '@controllers/venue.controller';

const router = express.Router();

// GET /venues/get-venue - Get all venues
router.get('/get-venues', getVenues);

//POST /venues/add-venue - Create a new venue
router.post('/add-venue', addVenue);

export default router;