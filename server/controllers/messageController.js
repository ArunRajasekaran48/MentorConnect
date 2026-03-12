import Message from '../models/Message.js';
import Session from '../models/Session.js';

// @desc    Get all messages for a specific session
// @route   GET /api/messages/:sessionId
// @access  Private
export const getMessages = async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Ensure the session exists and the user is part of it
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (
      session.student.toString() !== req.user._id.toString() &&
      session.mentor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ session: sessionId }).populate('sender', 'name');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
