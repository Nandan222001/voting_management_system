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
  FaBuilding,
  FaChartLine,
  FaBan,
} from 'react-icons/fa';
import { logoutUser } from '../../store/slices/authSlice';

// Nav items for regular admin / voter roles
const adminNavLinks = [
  { to: '/dashboard', icon: FaHome, label: 'Dashboard', roles: ['admin', 'moderator', 'voter'] },
  { to: '/elections', icon: FaVoteYea, label: 'Elections', roles: ['admin', 'moderator', 'voter'] },
  { to: '/candidates', icon: FaUsers, label: 'Candidates', roles: ['admin', 'moderator', 'voter'] },
  { to: '/users', icon: FaUserCog, label: 'Users', roles: ['admin'] },
  { to: '/results', icon: FaChartBar, label: 'Results', roles: ['admin', 'moderator', 'voter'] },
  { to: '/audit-logs', icon: FaShieldAlt, label: 'Audit Logs', roles: ['admin'] },
];

// Nav items for superadmin role
const superAdminNavLinks = [
  { to: '/superadmin', icon: FaChartLine, label: 'Platform Overview' },
  { to: '/tenants', icon: FaBuilding, label: 'Tenants' },
  { to: '/elections?superadmin=true', icon: FaVoteYea, label: 'All Elections', exactMatch: '/elections' },
  { to: '/audit-logs', icon: FaShieldAlt, label: 'Platform Audit' },
];

function NavItem({ to, icon: Icon, label, exactMatch }) {
  // For links with query params, match on the pathname portion only
  const matchPath = exactMatch || to;

  return (
    <li>
      <NavLink
        to={to}
        end={false}
        className={({ isActive }) => {
          // When there's an exactMatch path, use location-based active logic
          const active = isActive;
          return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
            active
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`;
        }}
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
  );
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const isSuperAdmin = user?.role === 'superadmin';
  const role = user?.role;

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  // Filter admin nav links based on role
  const visibleAdminLinks = adminNavLinks.filter(
    (link) => !link.roles || link.roles.includes(role)
  );

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

      {/* Context badge for superadmin */}
      {isSuperAdmin && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-lg">
            <span className="text-purple-300 text-xs">⚡</span>
            <span className="text-purple-300 text-xs font-semibold tracking-wide uppercase">
              Platform Admin
            </span>
          </div>
        </div>
      )}

      {/* Tenant context for regular admins */}
      {!isSuperAdmin && user?.tenant_name && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg">
            <FaBuilding className="text-gray-400 text-xs flex-shrink-0" />
            <span className="text-gray-300 text-xs font-medium truncate">
              {user.tenant_name}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
          {isSuperAdmin ? 'Platform Menu' : 'Main Menu'}
        </p>

        {isSuperAdmin ? (
          <ul className="space-y-1">
            {superAdminNavLinks.map(({ to, icon, label, exactMatch }) => (
              <NavItem key={to} to={to} icon={icon} label={label} exactMatch={exactMatch} />
            ))}
          </ul>
        ) : (
          <ul className="space-y-1">
            {visibleAdminLinks.map(({ to, icon, label }) => (
              <NavItem key={to} to={to} icon={icon} label={label} />
            ))}
          </ul>
        )}
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-gray-700 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              isSuperAdmin ? 'bg-purple-600' : 'bg-indigo-500'
            }`}
          >
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
