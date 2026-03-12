import express from 'express';
import {
  createOrUpdateProfile,
  updateAvailability,
  getMentors,
  getMentorById,
} from '../controllers/mentorController.js';
import { protect, mentorOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (for students to view mentors)
router.get('/', getMentors);
router.get('/:id', getMentorById);

// Protected mentor routes
router.post('/profile', protect, mentorOnly, createOrUpdateProfile);
router.put('/availability', protect, mentorOnly, updateAvailability);

export default router;
