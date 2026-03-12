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
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'User',
        },
        session: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Session',
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          default: '',
        },
        createdAt: {
          type: Date,
          default: Date.now,
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
