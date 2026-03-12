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
