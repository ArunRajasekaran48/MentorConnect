import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import API from '../services/api';

const MentorSearch = () => {
  const [mentors, setMentors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null); // { mentor, date, timeSlot }
  const [bookMsg, setBookMsg] = useState('');

  const fetchMentors = async (query = '') => {
    setLoading(true);
    try {
      const { data } = await API.get(`/mentors${query ? `?expertise=${query}` : ''}`);
      setMentors(data);
    } catch {
      setMentors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMentors(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMentors(search);
  };

  const handleBook = async () => {
    if (!booking?.date || !booking?.timeSlot) return;
    try {
      await API.post('/sessions/book', {
        mentorId: booking.mentor.user._id,
        date: booking.date,
        timeSlot: booking.timeSlot,
      });
      setBookMsg('Session booked successfully! Waiting for mentor confirmation.');
      setBooking(null);
    } catch (err) {
      setBookMsg(err.response?.data?.message || 'Booking failed.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Find a Mentor</h1>

      {bookMsg && <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4">{bookMsg}</div>}

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by expertise (e.g. React, Python, Career)" 
          className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">Search</button>
      </form>

      {loading ? (
        <p className="text-gray-500 text-center">Loading mentors...</p>
      ) : mentors.length === 0 ? (
        <p className="text-gray-500 text-center">No mentors found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {mentors.map((mentor) => (
            <div key={mentor._id} className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">{mentor.user?.name}</h2>
              <p className="text-sm text-gray-500 mt-1 mb-3">{mentor.bio}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {mentor.expertise?.map((tag) => (
                  <span key={tag} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>
              <p className="text-sm font-medium text-gray-700">
                💵 ${mentor.hourlyRate}/hr
              </p>

              {/* Availability */}
              {mentor.availability?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-1 uppercase">Available Slots</p>
                  {mentor.availability.slice(0, 2).map((slot) => (
                    <div key={slot.date}>
                      <p className="text-xs text-gray-600 font-medium">{slot.date}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {slot.timeSlots.map((time) => (
                          <button key={time} onClick={() => setBooking({ mentor, date: slot.date, timeSlot: time })}
                            className="text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 px-2 py-1 rounded transition-colors">
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {booking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Confirm Booking</h2>
            <p className="text-sm text-gray-600 mb-1">Mentor: <strong>{booking.mentor.user?.name}</strong></p>
            <p className="text-sm text-gray-600 mb-1">Date: <strong>{booking.date}</strong></p>
            <p className="text-sm text-gray-600 mb-4">Time: <strong>{booking.timeSlot}</strong></p>
            <div className="flex gap-3">
              <button onClick={handleBook}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">Confirm</button>
              <button onClick={() => setBooking(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorSearch;
