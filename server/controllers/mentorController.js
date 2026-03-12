import MentorProfile from '../models/MentorProfile.js';
import User from '../models/User.js';

// @desc    Create or update mentor profile
// @route   POST /api/mentors/profile
// @access  Private/Mentor
export const createOrUpdateProfile = async (req, res) => {
  const { expertise, bio, hourlyRate } = req.body;

  try {
    let profile = await MentorProfile.findOne({ user: req.user._id });

    if (profile) {
      // Update existing profile
      profile.expertise = expertise || profile.expertise;
      profile.bio = bio || profile.bio;
      profile.hourlyRate = hourlyRate !== undefined ? hourlyRate : profile.hourlyRate;

      const updatedProfile = await profile.save();
      return res.json(updatedProfile);
    }

    // Create new profile
    profile = await MentorProfile.create({
      user: req.user._id,
      expertise,
      bio,
      hourlyRate,
    });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update mentor availability
// @route   PUT /api/mentors/availability
// @access  Private/Mentor
export const updateAvailability = async (req, res) => {
  const { availability } = req.body; // Array of { date, timeSlots }

  try {
    const profile = await MentorProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    profile.availability = availability;
    await profile.save();

    res.json({ message: 'Availability updated', availability: profile.availability });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all mentors
// @route   GET /api/mentors
// @access  Public
export const getMentors = async (req, res) => {
  try {
    const { expertise } = req.query;
    let query = {};

    if (expertise) {
      // Case-insensitive regex search in the expertise array
      query = { expertise: { $regex: expertise, $options: 'i' } };
    }

    const mentors = await MentorProfile.find(query).populate('user', 'name email');
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get mentor by ID
// @route   GET /api/mentors/:id
// @access  Public
export const getMentorById = async (req, res) => {
  try {
    const mentor = await MentorProfile.findById(req.params.id).populate('user', 'name email');

    if (mentor) {
      res.json(mentor);
    } else {
      res.status(404).json({ message: 'Mentor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
