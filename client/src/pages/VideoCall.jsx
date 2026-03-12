import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import API from '../services/api';

const VideoCall = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [useLowBandwidth, setUseLowBandwidth] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await API.get('/sessions/my-sessions');
        const thisSession = data.find((s) => s._id === sessionId);
        if (!thisSession) {
          setError('Session not found.');
          return;
        }
        if (thisSession.status !== 'accepted') {
          setError('This session has not been accepted yet.');
          return;
        }
        setSessionInfo(thisSession);
      } catch {
        setError('Failed to load session info.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionInfo?._id || !jitsiContainerRef.current) return;

    // Derive the room name from the meeting link or compose one
    const roomLink = sessionInfo.meetingLink || '';
    const domain = roomLink.includes('.jit.si') ? 'meet.jit.si' : (roomLink.includes('.net') ? roomLink.split('://')[1].split('/')[0] : 'meet.jit.si');
    const roomName = roomLink.includes('/') ? roomLink.split('/').pop() : `MentorConnect-V3-${sessionId}`;
    
    // Prevent multiple initializations if sessionInfo hasn't actually changed room-wise
    if (apiRef.current) return;

    // Load the Jitsi External API script dynamically
    const loadJitsi = () => {
      const scriptId = 'jitsi-api-script';
      if (window.JitsiMeetExternalAPI) {
        initJitsi(roomName, domain);
        return;
      }
      
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.onload = () => initJitsi(roomName, domain);
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = () => initJitsi(roomName, domain);
      script.onerror = () => setError('Failed to load Jitsi API. Please check your internet connection.');
      document.head.appendChild(script);
    };

    const initJitsi = (room, jitsiDomain) => {
      apiRef.current = new window.JitsiMeetExternalAPI(jitsiDomain, {
        roomName: room,
        parentNode: jitsiContainerRef.current,
        width: '100%',
        height: '100%',
        userInfo: {
          displayName: userInfo?.name || 'Participant',
          email: userInfo?.email || '',
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: useLowBandwidth, // Mute video by default on low bandwidth to save connection
          enableClosePage: false,
          disableDeepLinking: true,
          prejoinConfig: { enabled: false },
          defaultLocalDisplayName: userInfo?.name || 'Participant',
          // Forced Bridge (Relay)
          p2p: { enabled: false },
          // Quality & Stability settings
          resolution: useLowBandwidth ? 180 : 360, // Aggressive resolution drop
          constraints: {
            video: { 
              height: { 
                ideal: useLowBandwidth ? 180 : 360, 
                max: useLowBandwidth ? 180 : 360, 
                min: 120 
              } 
            }
          },
          // Stability Flags
          enableIceRestart: true, // Crucial for 10% packet loss
          enableLayerSuspension: true,
          disableSimulcast: false,
          enableForcedReload: true,
          videoQuality: {
            disabledCodecs: ['av1', 'vp9'],
            preferredCodec: 'vp8',
          },
          audioQuality: {
            stereo: false,
          },
          disableAudioLevels: true, // Save CPU
          requireDisplayName: true,
          buttonsWithConfirmation: ['hangup'],
          desktopSharingFrameRate: { min: 5, max: 15 },
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop',
            'fullscreen', 'fodeviceselection', 'hangup', 'chat',
            'raisehand', 'videoquality', 'tileview', 'select-background',
            'mute-everyone',
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          GENERATE_STATS_BUTTON: true, // Keep stats for debugging
          APP_NAME: 'Mentor Connect',
        },
      });

      const iframe = apiRef.current.getIFrame();
      if (iframe) {
        iframe.setAttribute('allow', 'camera; microphone; display-capture; autoplay; clipboard-write');
      }

      apiRef.current.addEventListener('readyToClose', () => {
        navigate(`/chat/${sessionId}`);
      });
    };

    loadJitsi();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [sessionInfo?._id, sessionId, userInfo?.userId, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin text-4xl mb-4">🌀</div>
        <p className="text-lg">Preparing your secure video room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white gap-4 p-8 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="text-lg text-red-400 max-w-md">{error}</p>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Retry Connection
          </button>
          <button onClick={() => navigate('/sessions')}
            className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors">
            ← Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Top bar */}
      <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
            {userInfo?.role === 'mentor' ? 'S' : 'M'}
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight text-gray-100">
              {userInfo?.role === 'mentor'
                ? `Mentoring: ${sessionInfo?.student?.name}`
                : `Session with: ${sessionInfo?.mentor?.name}`}
            </p>
            <p className="text-xs text-blue-400 mt-0.5">
              Live Video Session • {sessionInfo?.timeSlot}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setUseLowBandwidth(!useLowBandwidth)}
            className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors border ${
              useLowBandwidth 
                ? 'bg-yellow-600 border-yellow-500 text-white' 
                : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
            }`}
          >
            {useLowBandwidth ? '🚀 High Quality' : '📉 Low Bandwidth'}
          </button>
          {sessionInfo?.meetingLink && (
            <a href={sessionInfo.meetingLink} target="_blank" rel="noreferrer"
              className="text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm">
              🔗 Open in New Tab
            </a>
          )}
          <button onClick={() => navigate(`/chat/${sessionId}`)}
            className="text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg transition-colors border border-gray-700">
            💬 Open Chat
          </button>
          <button onClick={() => navigate('/sessions')}
            className="text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg transition-colors border border-gray-700">
            ← Exit Session
          </button>
        </div>
      </div>

      {/* Jitsi container fills the remaining space */}
      <div 
        ref={jitsiContainerRef} 
        className="flex-grow w-full bg-black flex items-center justify-center relative"
      />
    </div>
  );
};

export default VideoCall;
