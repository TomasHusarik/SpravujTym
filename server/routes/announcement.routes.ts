import { createAnnouncement, deleteAnnouncement, getAnnouncements, updateAnnouncement } from '@controllers/announcement.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireAdmin } from '@middleware/permission.rules';
import express from 'express';

const router = express.Router();

router.get('/get-announcements', getAnnouncements);

// Auth required for all routes below
router.use(authMiddleware);

// POST /announcement/create - Create a new announcement
router.post('/create-announcement', requireAdmin, createAnnouncement);

// PUT /announcement/update-announcement/:announcementId - Update announcement
router.put('/update-announcement/:announcementId', requireAdmin, updateAnnouncement);

// DELETE /announcement/delete-announcement/:announcementId - Delete announcement
router.delete('/delete-announcement/:announcementId', requireAdmin, deleteAnnouncement);

export default router;