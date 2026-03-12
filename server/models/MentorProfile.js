import mongoose from 'mongoose';

const mentorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true, // One profile per mentor
    },
    expertise: {
      type: [String],
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    hourlyRate: {
      type: Number,
      required: true,
      default: 0,
    },
    availability: [
      {
        date: {
          type: String, // e.g., 'YYYY-MM-DD'
          required: true,
        },
        timeSlots: {
          type: [String], // e.g., ['10:00 AM', '02:00 PM']
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema);
export default MentorProfile;
