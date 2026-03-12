import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold text-blue-600 tracking-tight">
        🎓 Mentor Connect
      </Link>

      <div className="flex items-center space-x-4">
        {userInfo ? (
          <>
            <span className="text-sm text-gray-500 hidden sm:block">
              <span className="font-medium text-gray-800">{userInfo.name}</span>
              {' '}({userInfo.role})
            </span>
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-blue-600 font-medium">Dashboard</Link>
            {userInfo.role === 'student' && (
              <Link to="/mentors" className="text-sm text-gray-600 hover:text-blue-600 font-medium">Find Mentors</Link>
            )}
            {userInfo.role === 'mentor' && (
              <Link to="/profile/setup" className="text-sm text-gray-600 hover:text-blue-600 font-medium">My Profile</Link>
            )}
            <button onClick={handleLogout}
              className="bg-red-100 text-red-600 hover:bg-red-200 text-sm px-3 py-1.5 rounded-lg transition-colors font-medium">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600 font-medium">Login</Link>
            <Link to="/register"
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
