import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    date: {
      type: String, // e.g., 'YYYY-MM-DD'
      required: true,
    },
    timeSlot: {
      type: String, // e.g., '10:00 AM'
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    meetingLink: {
      type: String,
      default: '', // Will be populated when the session is accepted and a room is created
    },
    notes: {
      type: String,
      default: '', // For collaborative notes during the session
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model('Session', sessionSchema);
export default Session;
