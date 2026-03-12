import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MentorSearch from './pages/MentorSearch';
import MentorProfileSetup from './pages/MentorProfileSetup';
import Sessions from './pages/Sessions';
import ChatRoom from './pages/ChatRoom';
import VideoCall from './pages/VideoCall';

const Home = () => {
  const { userInfo } = useSelector((state) => state.auth);
  return userInfo ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/mentors" element={<PrivateRoute><MentorSearch /></PrivateRoute>} />
            <Route path="/profile/setup" element={<PrivateRoute><MentorProfileSetup /></PrivateRoute>} />
            <Route path="/sessions" element={<PrivateRoute><Sessions /></PrivateRoute>} />
            <Route path="/chat/:sessionId" element={<PrivateRoute><ChatRoom /></PrivateRoute>} />
            <Route path="/video/:sessionId" element={<PrivateRoute><VideoCall /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
