import { createAnnouncement, deleteAnnouncement, getAnnouncements, updateAnnouncement } from '@controllers/announcement.controller';
import { authMiddleware, optionalAuthMiddleware } from '@middleware/auth.middleware';
import { requireAdmin } from '@middleware/permission.rules';
import express from 'express';

const router = express.Router();

// Public announcements for everyone, team (private) ones only for logged users
router.get('/get-announcements', optionalAuthMiddleware, getAnnouncements);

// Auth required for all routes below
router.use(authMiddleware);

// POST /announcement/create - Create a new announcement
router.post('/create-announcement', requireAdmin, createAnnouncement);

// PUT /announcement/update-announcement/:announcementId - Update announcement
router.put('/update-announcement/:announcementId', requireAdmin, updateAnnouncement);

// DELETE /announcement/delete-announcement/:announcementId - Delete announcement
router.delete('/delete-announcement/:announcementId', requireAdmin, deleteAnnouncement);

export default router;