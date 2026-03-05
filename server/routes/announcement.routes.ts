import { createAnnouncement, deleteAnnouncement, getAnnouncements, updateAnnouncement } from '@controllers/announcement.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireAdmin } from '@middleware/permission.rules';
import express from 'express';

const router = express.Router();

router.use(authMiddleware);

// POST /announcement/create - Create a new announcement
router.post('/create-announcement', requireAdmin, createAnnouncement);
router.get('/get-announcements', getAnnouncements);
router.put('/update-announcement/:announcementId', requireAdmin, updateAnnouncement);
router.delete('/delete-announcement/:announcementId', requireAdmin, deleteAnnouncement);

export default router;