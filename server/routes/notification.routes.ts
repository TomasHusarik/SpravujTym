import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@controllers/notification.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import express from 'express';

const router = express.Router();

// All routes work only with notifications of the logged user
router.use(authMiddleware);

// GET /notification/get-notifications - Latest notifications and unread count
router.get('/get-notifications', getNotifications);

// POST /notification/mark-read/:notificationId - Mark notification as read
router.post('/mark-read/:notificationId', markNotificationRead);

// POST /notification/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', markAllNotificationsRead);

export default router;
