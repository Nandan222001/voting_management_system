import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaHome,
  FaVoteYea,
  FaUsers,
  FaUserCog,
  FaUserShield,
  FaMapMarkerAlt,
  FaChartBar,
  FaSignOutAlt,
  FaBalanceScale,
  FaShieldAlt,
  FaHistory,
} from 'react-icons/fa';
import { logoutUser, selectCurrentUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const navLinks = [
  { to: '/', icon: FaHome, label: 'Dashboard', roles: ['admin', 'moderator', 'voter'] },
  { to: '/elections', icon: FaVoteYea, label: 'Elections', roles: ['admin', 'moderator', 'voter'] },
  { to: '/candidates', icon: FaUsers, label: 'Candidates', roles: ['admin', 'moderator', 'voter'] },
  { to: '/candidate-committees', icon: FaUserShield, label: 'Committees', roles: ['admin'] },
  { to: '/targets', icon: FaMapMarkerAlt, label: 'Targets', roles: ['admin'] },
  { to: '/users', icon: FaUserCog, label: 'Users', roles: ['admin'] },
  { to: '/audit-logs', icon: FaHistory, label: 'Audit Logs', roles: ['admin', 'superadmin'] },
];

const superAdminLinks = [
  { to: '/dashboard', icon: FaShieldAlt, label: 'Platform' },
  { to: '/tenants', icon: FaBalanceScale, label: 'Tenants' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const filteredLinks = navLinks.filter((link) => 
    !link.roles || (user && link.roles.includes(user.role))
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-100 shadow-lg">
            <FaVoteYea className="text-white text-lg" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
            TechElect
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <link.icon className="text-lg transition-transform group-hover:scale-110" />
            <span>{link.label}</span>
          </NavLink>
        ))}

        {user?.role === 'superadmin' && (
          <div className="pt-6 mt-6 border-t border-gray-100">
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Platform Admin
            </p>
            {superAdminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-100'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <link.icon className="text-lg transition-transform group-hover:scale-110" />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-4 mb-3 bg-gray-50 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm">
            {user?.full_name?.[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.full_name}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 text-sm font-bold transition-all duration-200"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
