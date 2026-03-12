import express from 'express';
import {
  createOrUpdateProfile,
  updateAvailability,
  getMentors,
  getMentorById,
  getMyProfile,
} from '../controllers/mentorController.js';
import { protect, mentorOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (for students to view mentors)
router.get('/', getMentors);

// Protected self-route: must come before /:id to avoid conflict
router.get('/me', protect, mentorOnly, getMyProfile);

// Public: get a specific mentor by ID
router.get('/:id', getMentorById);

// Protected mentor-only routes
router.post('/profile', protect, mentorOnly, createOrUpdateProfile);
router.put('/availability', protect, mentorOnly, updateAvailability);

export default router;
