import { Request, Response } from "express";
import ErrorMessages from "@utils/errorMessages";
import Announcement from "@models/Announcement";

// POST /announcement/create - Create a new announcement
export const createAnnouncement = async (req: Request, res: Response) => {
    const { title, context, visibility, pinned } = req.body;
    const author = req.loggedUser?._id;

    if (!title || !context || !visibility) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const newAnnouncement = new Announcement({
            author,
            title,
            content: context,
            visibility,
            pinned: !!pinned,
        });

        await newAnnouncement.save();
        res.status(201).json({ message: 'Announcement created successfully', announcement: newAnnouncement });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: ErrorMessages.serverError });
    }
};

// GET /announcement/get-announcements - Get all announcements
export const getAnnouncements = async (req: Request, res: Response) => {

    let query: string = '';

    if (req.loggedUser?.isAdmin) {
        // Admins can see all announcements
    } else if (req.loggedUser) {
        query = 'private';
    } else {
        query = 'public';
    }

    try {
        const announcements = await Announcement.find(query ? { visibility: query } : {})
            .populate('author', 'firstName lastName') // Populate author details
            .sort({ pinned: -1, createdAt: -1 })
            .lean();

        res.status(200).json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: ErrorMessages.serverError });
    }
};

// PUT /announcement/update-announcement/:announcementId - Update announcement
export const updateAnnouncement = async (req: Request, res: Response) => {
    const { announcementId } = req.params;
    const { title, context, visibility, pinned } = req.body;

    if (!title || !context || !visibility) {
        return res.status(400).json({ error: ErrorMessages.mandatoryField });
    }

    try {
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(
            announcementId,
            {
                title,
                content: context,
                visibility,
                pinned: !!pinned,
            },
            { new: true }
        );

        if (!updatedAnnouncement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        res.status(200).json({ message: 'Announcement updated successfully', announcement: updatedAnnouncement });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ error: ErrorMessages.serverError });
    }
};

// DELETE /announcement/delete-announcement/:announcementId - Delete announcement
export const deleteAnnouncement = async (req: Request, res: Response) => {
    const { announcementId } = req.params;

    try {
        const deletedAnnouncement = await Announcement.findByIdAndDelete(announcementId);

        if (!deletedAnnouncement) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ error: ErrorMessages.serverError });
    }
};