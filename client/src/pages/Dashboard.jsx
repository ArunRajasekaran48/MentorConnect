import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Welcome back, {userInfo?.name}! 👋
      </h1>
      <p className="text-gray-500 mb-8">
        You are logged in as a <span className="font-semibold text-blue-600">{userInfo?.role}</span>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {userInfo?.role === 'student' && (
          <>
            <Link to="/mentors"
              className="block bg-white rounded-2xl shadow p-6 hover:shadow-md transition-shadow border border-gray-100">
              <div className="text-3xl mb-3">🔍</div>
              <h2 className="text-lg font-semibold text-gray-800">Find a Mentor</h2>
              <p className="text-sm text-gray-500 mt-1">Search by expertise to find the right mentor for your goals.</p>
            </Link>
            <Link to="/sessions"
              className="block bg-white rounded-2xl shadow p-6 hover:shadow-md transition-shadow border border-gray-100">
              <div className="text-3xl mb-3">📅</div>
              <h2 className="text-lg font-semibold text-gray-800">My Sessions</h2>
              <p className="text-sm text-gray-500 mt-1">View upcoming and past mentoring sessions.</p>
            </Link>
          </>
        )}

        {userInfo?.role === 'mentor' && (
          <>
            <Link to="/profile/setup"
              className="block bg-white rounded-2xl shadow p-6 hover:shadow-md transition-shadow border border-gray-100">
              <div className="text-3xl mb-3">👤</div>
              <h2 className="text-lg font-semibold text-gray-800">Setup Profile</h2>
              <p className="text-sm text-gray-500 mt-1">Set your expertise, bio, and hourly rate.</p>
            </Link>
            <Link to="/sessions"
              className="block bg-white rounded-2xl shadow p-6 hover:shadow-md transition-shadow border border-gray-100">
              <div className="text-3xl mb-3">📅</div>
              <h2 className="text-lg font-semibold text-gray-800">Manage Sessions</h2>
              <p className="text-sm text-gray-500 mt-1">Accept or reject student booking requests.</p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
