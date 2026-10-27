import { Request, Response } from "express";
import Notification from "@models/Notification";
import ErrorMessages from "@utils/errorMessages";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

// GET /notification/get-notifications?limit= - Latest notifications of the logged user
export const getNotifications = async (req: Request, res: Response) => {
    const userId = req.loggedUser._id;
    const limit = Math.min(Number(req.query.limit) || DEFAULT_LIMIT, MAX_LIMIT);

    try {
        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean(),
            Notification.countDocuments({ user: userId, readAt: { $exists: false } }),
        ]);

        return res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /notification/mark-read/:notificationId - Mark one notification as read
export const markNotificationRead = async (req: Request, res: Response) => {
    try {
        const result = await Notification.updateOne(
            { _id: req.params.notificationId, user: req.loggedUser._id, readAt: { $exists: false } },
            { readAt: new Date() }
        );

        if (result.matchedCount === 0) {
            const exists = await Notification.exists({ _id: req.params.notificationId, user: req.loggedUser._id });
            if (!exists) return res.status(404).json({ error: ErrorMessages.notFound });
        }

        return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};

// POST /notification/mark-all-read - Mark all notifications of the logged user as read
export const markAllNotificationsRead = async (req: Request, res: Response) => {
    try {
        await Notification.updateMany(
            { user: req.loggedUser._id, readAt: { $exists: false } },
            { readAt: new Date() }
        );
        return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        return res.status(500).json({ error: ErrorMessages.internalServerError });
    }
};
