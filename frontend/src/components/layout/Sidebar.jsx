import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaHome,
  FaVoteYea,
  FaUsers,
  FaUserCog,
  FaChartBar,
  FaShieldAlt,
  FaSignOutAlt,
  FaBalanceScale,
} from 'react-icons/fa';
import { logoutUser } from '../../store/slices/authSlice';

const navLinks = [
  { to: '/dashboard', icon: FaHome, label: 'Dashboard' },
  { to: '/elections', icon: FaVoteYea, label: 'Elections' },
  { to: '/candidates', icon: FaUsers, label: 'Candidates' },
  { to: '/users', icon: FaUserCog, label: 'Users' },
  { to: '/results', icon: FaChartBar, label: 'Results' },
  { to: '/audit-logs', icon: FaShieldAlt, label: 'Audit Logs' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-gray-900 flex flex-col z-50 shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <FaBalanceScale className="text-white text-lg" />
        </div>
        <span className="text-white text-xl font-bold tracking-wide">
          Vote<span className="text-indigo-400">Admin</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
          Main Menu
        </p>
        <ul className="space-y-1">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`text-base flex-shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-gray-500 group-hover:text-indigo-400'
                      }`}
                    />
                    <span>{label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-gray-700 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold uppercase">
              {user?.full_name ? user.full_name.charAt(0) : user?.email?.charAt(0) ?? 'A'}
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-semibold truncate">
              {user?.full_name ?? 'Admin User'}
            </p>
            <p className="text-gray-400 text-xs truncate">{user?.email ?? 'admin@vote.com'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-400 hover:bg-red-600 hover:text-white text-sm font-medium transition-all duration-150"
        >
          <FaSignOutAlt className="text-base" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
