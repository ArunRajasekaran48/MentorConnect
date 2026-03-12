import { useState, useEffect } from 'react';
import API from '../services/api';

const MentorProfileSetup = () => {
  const [form, setForm] = useState({
    bio: '',
    hourlyRate: '',
    expertiseInput: '',
    expertise: [],
  });
  const [availability, setAvailability] = useState([{ date: '', timeSlots: '' }]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // ✅ Load existing profile on mount using the dedicated /me endpoint
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: myProfile } = await API.get('/mentors/me');

        if (myProfile) {
          setForm({
            bio: myProfile.bio || '',
            hourlyRate: myProfile.hourlyRate || '',
            expertiseInput: '',
            expertise: myProfile.expertise || [],
          });

          if (myProfile.availability && myProfile.availability.length > 0) {
            setAvailability(
              myProfile.availability.map((slot) => ({
                date: slot.date,
                timeSlots: Array.isArray(slot.timeSlots)
                  ? slot.timeSlots.join(', ')
                  : slot.timeSlots,
              }))
            );
          }
        }
      } catch {
        // 404 means no profile yet — form stays blank for first-time setup
        console.log('No existing profile found, starting fresh.');
      } finally {
        setFetching(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addExpertise = () => {
    const tag = form.expertiseInput.trim();
    if (tag && !form.expertise.includes(tag)) {
      setForm({ ...form, expertise: [...form.expertise, tag], expertiseInput: '' });
    }
  };

  const removeExpertise = (tag) =>
    setForm({ ...form, expertise: form.expertise.filter((e) => e !== tag) });

  const handleAvailabilityChange = (index, field, value) => {
    const updated = [...availability];
    updated[index][field] = value;
    setAvailability(updated);
  };

  const addSlot = () => setAvailability([...availability, { date: '', timeSlots: '' }]);

  const removeSlot = (index) =>
    setAvailability(availability.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // POST to create/update the profile
      await API.post('/mentors/profile', {
        bio: form.bio,
        hourlyRate: Number(form.hourlyRate),
        expertise: form.expertise,
      });

      // Format time slots: convert comma-separated strings back to arrays
      const formattedAvailability = availability
        .filter((slot) => slot.date) // skip empty date rows
        .map((slot) => ({
          date: slot.date,
          timeSlots: typeof slot.timeSlots === 'string'
            ? slot.timeSlots.split(',').map((s) => s.trim()).filter(Boolean)
            : slot.timeSlots,
        }));

      await API.put('/mentors/availability', { availability: formattedAvailability });
      setSuccess('✅ Profile and availability saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-64 mt-20">
        <p className="text-gray-500 text-sm">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">My Mentor Profile</h1>
      <p className="text-sm text-gray-400 mb-6">Edit your information and save to update your public profile.</p>

      {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4">{success}</div>}
      {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl shadow p-6">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea name="bio" rows={4} required onChange={handleChange} value={form.bio}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell students about yourself..." />
        </div>

        {/* Hourly Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (USD)</label>
          <input name="hourlyRate" type="number" required onChange={handleChange} value={form.hourlyRate}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 25" />
        </div>

        {/* Expertise Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Areas of Expertise</label>
          <div className="flex gap-2 mb-2">
            <input name="expertiseInput" type="text" value={form.expertiseInput} onChange={handleChange}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
              className="flex-grow border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a skill and press Add or Enter" />
            <button type="button" onClick={addExpertise}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.expertise.map((tag) => (
              <span key={tag} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => removeExpertise(tag)}
                  className="text-blue-400 hover:text-red-500 font-bold ml-1">×</button>
              </span>
            ))}
            {form.expertise.length === 0 && (
              <p className="text-xs text-gray-400">No expertise tags added yet.</p>
            )}
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
          {availability.map((slot, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <input type="date" value={slot.date}
                onChange={(e) => handleAvailabilityChange(i, 'date', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" value={slot.timeSlots} placeholder="e.g. 10:00 AM, 02:00 PM"
                onChange={(e) => handleAvailabilityChange(i, 'timeSlots', e.target.value)}
                className="flex-grow border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {availability.length > 1 && (
                <button type="button" onClick={() => removeSlot(i)}
                  className="text-red-400 hover:text-red-600 text-lg font-bold">×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addSlot}
            className="text-blue-600 text-sm hover:underline mt-1">+ Add another date</button>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-60">
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default MentorProfileSetup;
