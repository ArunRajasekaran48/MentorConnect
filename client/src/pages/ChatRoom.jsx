import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import API from '../services/api';

const ChatRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const bottomRef = useRef(null);
  // ✅ Create socket inside the component so it's properly scoped
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to the current host - Vite proxy handles /socket.io
    socketRef.current = io();
    socketRef.current.emit('join_room', sessionId);

    // Fetch previous messages
    const fetchMessages = async () => {
      try {
        const { data } = await API.get(`/messages/${sessionId}`);
        setMessages(data);
      } catch {
        setMessages([]);
      }
    };

    // Fetch session details (to pre-load notes and meeting link)
    const fetchSession = async () => {
      try {
        const { data } = await API.get('/sessions/my-sessions');
        const thisSession = data.find((s) => s._id === sessionId);
        if (thisSession) {
          setSessionInfo(thisSession);
          setNotes(thisSession.notes || '');
        }
      } catch {
        // ignore
      }
    };

    fetchMessages();
    fetchSession();

    // Listen for incoming messages
    socketRef.current.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Listen for collaborative note updates from the other user
    socketRef.current.on('receive_note', (updatedText) => {
      setNotes(updatedText);
    });

    return () => {
      // ✅ Cleanup socket when leaving the page
      socketRef.current.disconnect();
    };
  }, [sessionId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;
    socketRef.current.emit('send_message', {
      session: sessionId,
      sender: userInfo._id,
      text,
    });
    // Optimistic UI: show own message immediately
    setMessages((prev) => [
      ...prev,
      { sender: { name: 'You', _id: userInfo._id }, text, createdAt: new Date() },
    ]);
    setText('');
  };

  const handleNoteChange = (e) => {
    setNotes(e.target.value);
    socketRef.current.emit('update_note', { session: sessionId, text: e.target.value });
    setNoteSaved(false);
  };

  const saveNotes = async () => {
    try {
      await API.put(`/sessions/${sessionId}/notes`, { notes });
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/sessions')}
          className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
          ← Back to Sessions
        </button>
        {sessionInfo?.meetingLink && (
          <button onClick={() => navigate(`/video/${sessionId}`)}
            className="ml-auto bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-1.5 rounded-lg">
            📹 Join Video Call
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat window */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 flex flex-col h-[72vh]">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">💬 Session Chat</h2>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Say hello! 👋</p>
            )}
            {messages.map((msg, i) => {
              const isMe =
                msg.sender?.name === 'You' ||
                msg.sender?._id?.toString() === userInfo._id?.toString();
              return (
                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl px-4 py-2 max-w-xs text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {!isMe && (
                      <p className="text-xs font-semibold mb-0.5 text-gray-500">{msg.sender?.name}</p>
                    )}
                    <p>{msg.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message and press Enter..."
              className="flex-grow border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={sendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
              Send
            </button>
          </div>
        </div>

        {/* Collaborative Notes */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 flex flex-col h-[72vh]">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-gray-800">📝 Shared Notes</h2>
              <p className="text-xs text-gray-400">Both participants can edit in real-time</p>
            </div>
            <button onClick={saveNotes}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${noteSaved ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
              {noteSaved ? '✅ Saved!' : 'Save'}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={handleNoteChange}
            className="flex-grow p-4 text-sm text-gray-700 resize-none focus:outline-none"
            placeholder="Start taking session notes here. Both participants see changes in real-time..."
          />
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
