import express from 'express';
import { bookSession, acceptSession, rejectSession, completeSession, submitReview, getMySessions, updateNotes } from '../controllers/sessionController.js';
import { protect, mentorOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/book', protect, bookSession);
router.get('/my-sessions', protect, getMySessions);
router.put('/:id/accept', protect, mentorOnly, acceptSession);
router.put('/:id/reject', protect, mentorOnly, rejectSession);
router.put('/:id/complete', protect, completeSession);
router.post('/:id/review', protect, submitReview);
router.put('/:id/notes', protect, updateNotes);

export default router;
