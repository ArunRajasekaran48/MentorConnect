import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const Sessions = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {userInfo?.role === 'mentor' ? 'Booking Requests' : 'My Sessions'}
      </h1>

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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sessions;
