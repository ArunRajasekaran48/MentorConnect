import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const Sessions = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewInputs, setReviewInputs] = useState({});
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const fetchSessions = async () => {
    try {
      const { data } = await API.get('/sessions/my-sessions');
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleAccept = async (id) => {
    await API.put(`/sessions/${id}/accept`);
    fetchSessions();
  };

  const handleReject = async (id) => {
    await API.put(`/sessions/${id}/reject`);
    fetchSessions();
  };

  const handleComplete = async (id) => {
    try {
      await API.put(`/sessions/${id}/complete`);
      setInfoMessage('Session marked as completed. Please leave a review.');
      setErrorMessage('');
      fetchSessions();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Unable to complete session.');
      setInfoMessage('');
    }
  };

  const handleReviewChange = (sessionId, field, value) => {
    setReviewInputs((prev) => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [field]: value,
      },
    }));
  };

  const handleReviewSubmit = async (sessionId) => {
    const review = reviewInputs[sessionId] || {};

    if (!review.rating || review.rating < 1 || review.rating > 5) {
      setErrorMessage('Please provide a rating between 1 and 5.');
      setInfoMessage('');
      return;
    }

    try {
      await API.post(`/sessions/${sessionId}/review`, {
        rating: Number(review.rating),
        comment: review.comment || '',
      });
      setInfoMessage('Review submitted successfully.');
      setErrorMessage('');
      setReviewInputs((prev) => ({ ...prev, [sessionId]: { rating: '', comment: '' } }));
      fetchSessions();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit review.');
      setInfoMessage('');
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      completed: 'bg-gray-100 text-gray-600',
    };
    return `inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || ''}`;
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading sessions...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        {userInfo?.role === 'mentor' ? 'Booking Requests' : 'My Sessions'}
      </h1>

      {infoMessage && <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4">{infoMessage}</div>}
      {errorMessage && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{errorMessage}</div>}

      {sessions.length === 0 ? (
        <p className="text-gray-500">No sessions found.</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session._id} className="bg-white rounded-2xl shadow p-5 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-800">
                  {userInfo?.role === 'mentor' ? `Student: ${session.student?.name}` : `Mentor: ${session.mentor?.name}`}
                </p>
                <p className="text-sm text-gray-500">{session.date} — {session.timeSlot}</p>
                <span className={statusBadge(session.status)}>{session.status}</span>
              </div>

              <div className="flex gap-2 flex-wrap">
                {/* Mentor actions */}
                {userInfo?.role === 'mentor' && session.status === 'pending' && (
                  <>
                    <button onClick={() => handleAccept(session._id)}
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg">Accept</button>
                    <button onClick={() => handleReject(session._id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded-lg">Reject</button>
                  </>
                )}
                {/* Chat button for both roles on accepted sessions */}
                {session.status === 'accepted' && (
                  <button onClick={() => navigate(`/chat/${session._id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg">💬 Open Chat</button>
                )}
                {/* Video call link */}
                {session.status === 'accepted' && session.meetingLink && (
                  <button onClick={() => navigate(`/video/${session._id}`)}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-1.5 rounded-lg">📹 Join Call</button>
                )}

                {/* Student can mark completed when accepted */}
                {userInfo?.role === 'student' && session.status === 'accepted' && (
                  <button onClick={() => handleComplete(session._id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-1.5 rounded-lg">✅ Mark Completed</button>
                )}
              </div>

              {session.status === 'completed' && (
                <div className="mt-3 w-full">
                  {session.review && session.review.rating ? (
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-700">Your review</p>
                      <p className="text-sm text-yellow-700">Rating: {session.review.rating} / 5</p>
                      <p className="text-sm text-gray-600">{session.review.comment || 'No comment provided'}</p>
                    </div>
                  ) : userInfo?.role === 'student' && session.student?._id === userInfo?._id ? (
                    <div className="border border-blue-200 rounded-lg p-3 bg-white mt-2">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Leave a review</p>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm">Rating</label>
                        <select
                          value={reviewInputs[session._id]?.rating || ''}
                          onChange={(e) => handleReviewChange(session._id, 'rating', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="">Select</option>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        rows="2"
                        value={reviewInputs[session._id]?.comment || ''}
                        onChange={(e) => handleReviewChange(session._id, 'comment', e.target.value)}
                        placeholder="Leave a short comment..."
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                      />
                      <button onClick={() => handleReviewSubmit(session._id)}
                        className="mt-2 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg">Submit Review</button>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">No review submitted yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sessions;
