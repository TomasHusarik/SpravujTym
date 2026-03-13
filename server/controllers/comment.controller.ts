import { Request, Response } from "express";
import Comment from "@models/Comment";

// GET /comment/get-comments/:eventId - Get comments for event
export const getComment = async (req: Request, res: Response) => {
    const { eventId } = req.params;

    try {
        const comments = await Comment.find({ event: eventId }).populate('author', 'firstName lastName imageUrl');
        res.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Server error while fetching comments" });
    }
};

// POST /comment/create-comment - Create a new comment
export const createComment = async (req: Request, res: Response) => {
    const { content, event } = req.body;

    if (!content || !event) {
        return res.status(400).json({ error: "Content and event ID are required to create a comment" });
    }

    try {
        const newComment = new Comment({
            content,
            event: event,
            author: req.loggedUser._id
        });

        await newComment.save();
        res.status(201).json(newComment);
    } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ error: "Server error while creating comment" });
    }
};

// PUT /comment/update-comment/:commentId - Update comment
export const updateComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: "Content is required for updating comment" });
    }

    //Only author can update comment, check in route with requireLoggedUser middleware
    const com = await Comment.findById(commentId);

    if (!com) {
        return res.status(404).json({ error: "Comment not found" });
    }

    if (com.author.toString() !== req.loggedUser._id.toString()) {
        return res.status(403).json({ error: "You do not have permission to edit this comment" });
    }


    try {
        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            { content },
            { new: true }
        );

        if (!updatedComment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        res.json(updatedComment);
    } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({ error: "Server error while updating comment" });
    }
};

// DELETE /comment/delete-comment/:commentId - Delete comment
export const deleteComment = async (req: Request, res: Response) => {
    const { commentId } = req.params;
    const author = req.body.author;

    if (!commentId) {
        return res.status(400).json({ error: "Comment ID is required for deletion" });
    }

    if (!req.loggedUser.isAdmin && author !== req.loggedUser._id.toString()) {
        console.log(req.loggedUser._id.toString(), author)
        return res.status(403).json({ error: "You do not have permission to delete this comment" });
    }

    try {
        const deletedComment = await Comment.findByIdAndDelete(commentId);

        if (!deletedComment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ error: "Server error while deleting comment" });
    }
};