import Session from '../models/Session.js';
import MentorProfile from '../models/MentorProfile.js';
import User from '../models/User.js';

// @desc    Book a new session
// @route   POST /api/sessions/book
// @access  Private (Student typically)
export const bookSession = async (req, res) => {
  const { mentorId, date, timeSlot } = req.body;
  const studentId = req.user._id;

  try {
    // Check if mentor exists and is indeed a mentor
    const mentorUser = await User.findById(mentorId);
    if (!mentorUser || mentorUser.role !== 'mentor') {
      return res.status(404).json({ message: 'Mentor not found or invalid' });
    }

    // Verify if mentor has a profile and if the requested timeslot is in their availability
    const mentorProfile = await MentorProfile.findOne({ user: mentorId });
    if (!mentorProfile) {
      return res.status(400).json({ message: 'Mentor profile missing availability' });
    }

    // A more robust implementation would check if the exact date & timeSlot exists
    // in mentorProfile.availability here. Assuming frontend only shows valid slots for now.

    const session = await Session.create({
      mentor: mentorId,
      student: studentId,
      date,
      timeSlot,
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

import { createVideoRoom } from '../utils/daily.js';

// @desc    Accept a session booking (Mentor only)
// @route   PUT /api/sessions/:id/accept
// @access  Private/Mentor
export const acceptSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Ensure the mentor accepting is the mentor assigned to the session
    if (session.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this session' });
    }

    session.status = 'accepted';
    
    // Generate a Video Call meeting link only if it doesn't already exist
    if (!session.meetingLink) {
      const roomName = `session-${session._id}`;
      const meetingUrl = await createVideoRoom(roomName);
      if (meetingUrl) {
        session.meetingLink = meetingUrl;
      }
    }

    const updatedSession = await session.save();

    res.json(updatedSession);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Reject a session booking (Mentor only)
// @route   PUT /api/sessions/:id/reject
// @access  Private/Mentor
export const rejectSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this session' });
    }

    session.status = 'rejected';
    const updatedSession = await session.save();

    res.json(updatedSession);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update session notes (Collaborative)
// @route   PUT /api/sessions/:id/notes
// @access  Private
export const updateNotes = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Both mentor and student can update notes
    if (session.mentor.toString() !== req.user._id.toString() && session.student.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to edit these notes' });
    }

    session.notes = req.body.notes || session.notes;
    const updatedSession = await session.save();

    res.json({ notes: updatedSession.notes });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Mark a session as completed
// @route   PUT /api/sessions/:id/complete
// @access  Private (mentor or student involved)
export const completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const isMentor = session.mentor.toString() === req.user._id.toString();
    const isStudent = session.student.toString() === req.user._id.toString();
    if (!isMentor && !isStudent) {
      return res.status(403).json({ message: 'Not authorized to complete this session' });
    }

    if (session.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted sessions can be completed' });
    }

    session.status = 'completed';
    const updatedSession = await session.save();

    res.json(updatedSession);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Submit a review for a completed session
// @route   POST /api/sessions/:id/review
// @access  Private (student)
export const submitReview = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the student in this session can leave a review' });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed sessions' });
    }

    if (session.review && session.review.rating) {
      return res.status(400).json({ message: 'Review already submitted for this session' });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    session.review = {
      rating,
      comment: comment || '',
      submittedBy: req.user._id,
      submittedAt: new Date(),
    };

    await session.save();

    const mentorProfile = await MentorProfile.findOne({ user: session.mentor });
    if (mentorProfile) {
      mentorProfile.reviews.push({
        student: session.student,
        session: session._id,
        rating,
        comment: comment || '',
      });

      mentorProfile.ratingCount = (mentorProfile.ratingCount || 0) + 1;
      mentorProfile.averageRating = ((mentorProfile.averageRating || 0) * (mentorProfile.ratingCount - 1) + rating) / mentorProfile.ratingCount;
      await mentorProfile.save();
    }

    res.json({ message: 'Review submitted', review: session.review });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get sessions for the logged in user
// @route   GET /api/sessions/my-sessions
// @access  Private
export const getMySessions = async (req, res) => {
  try {
    const query = req.user.role === 'mentor' 
      ? { mentor: req.user._id } 
      : { student: req.user._id };

    const sessions = await Session.find(query)
      .populate('mentor', 'name email')
      .populate('student', 'name email');

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
