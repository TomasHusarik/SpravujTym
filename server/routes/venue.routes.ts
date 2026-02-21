import express from 'express';
import { addVenue } from '@controllers/venue.controller';

const router = express.Router();

//POST /venues/add-venue - Create a new venue
router.post('/add-venue', addVenue);

export default router;