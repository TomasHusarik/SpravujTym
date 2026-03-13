
import { createComment, deleteComment, getComment, updateComment } from '@controllers/comment.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { requireAdmin, requireLoggedUser } from '@middleware/permission.rules';
import express from 'express';

const router = express.Router();


// Auth required for all routes below
router.use(authMiddleware);

// Get /comment/get-comments/:eventId - Get comments for event
router.get('/get-comments/:eventId', getComment)

// POST /comment/create-comment - Create a new comment
router.post('/create-comment', createComment);

// PUT /comment/update-comment/:commentId - Update comment
router.put('/update-comment/:commentId', updateComment);

// DELETE /comment/delete-comment/:commentId - Delete comment
router.delete('/delete-comment/:commentId', requireLoggedUser, deleteComment);

export default router;