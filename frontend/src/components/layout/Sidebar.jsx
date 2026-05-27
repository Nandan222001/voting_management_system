import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaHome,
  FaVoteYea,
  FaUsers,
  FaUserCog,
  FaChartBar,
  FaShieldAlt,
  FaBuilding,
  FaChartLine,
  FaMapMarkerAlt,
  FaCog,
  FaLayerGroup,
} from 'react-icons/fa';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { logoutUser, selectCurrentUser } from '../../store/slices/authSlice';

const adminNavLinks = [
  { to: '/dashboard', icon: FaHome, label: 'Dashboard', roles: ['admin', 'moderator', 'voter'] },
  { to: '/elections', icon: FaVoteYea, label: 'Elections', roles: ['admin', 'moderator', 'voter'] },
  { to: '/candidates', icon: FaUsers, label: 'Candidates', roles: ['admin', 'moderator', 'voter'] },
  { to: '/candidate-committees', icon: FaLayerGroup, label: 'Committees', roles: ['admin'] },
  { to: '/targets', icon: FaMapMarkerAlt, label: 'Geography', roles: ['admin'] },
  { to: '/users', icon: FaUserCog, label: 'Users', roles: ['admin'] },
  { to: '/results', icon: FaChartBar, label: 'Results', roles: ['admin', 'moderator', 'voter'] },
  { to: '/revenue', icon: FaChartLine, label: 'Revenue', roles: ['admin'] },
  { to: '/audit-logs', icon: FaShieldAlt, label: 'Audit Logs', roles: ['admin'] },
  { to: '/settings', icon: FaCog, label: 'Settings', roles: ['admin', 'moderator', 'voter'] },
];

const superAdminNavLinks = [
  { to: '/dashboard', icon: FaChartLine, label: 'Platform Overview' },
  { to: '/tenants', icon: FaBuilding, label: 'Tenants' },
  { to: '/elections?superadmin=true', icon: FaVoteYea, label: 'All Elections', exactMatch: '/elections' },
  { to: '/audit-logs', icon: FaShieldAlt, label: 'Platform Audit' },
];

function NavItem({ to, icon: Icon, label }) {
  return (
    <li>
      <NavLink
        to={to}
        end={false}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
            isActive
              ? 'bg-[rgb(16_102_177)] text-white shadow-sm'
              : 'text-gray-600 hover:bg-[#F0F2F7] hover:text-[rgb(16_102_177)]'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              className={`text-base flex-shrink-0 transition-colors ${
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-[rgb(16_102_177)]'
              }`}
            />
            <span>{label}</span>
            {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[rgb(16_102_177)]/20" />}
          </>
        )}
      </NavLink>
    </li>
  );
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const role = user?.role?.toLowerCase();
  const isSuperAdmin = role === 'superadmin';

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const filteredLinks = adminNavLinks.filter(
    (link) => !link.roles || link.roles.includes(role)
  );

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50 shadow-sm">

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-[rgb(16_102_177)] rounded-xl flex items-center justify-center flex-shrink-0">
          <FaShieldAlt className="text-white text-base" />
        </div>
        <span className="text-[rgb(16_102_177)] text-xl font-bold tracking-wide">
          Secure<span className="text-[rgb(16_102_177)]">Vote</span>
        </span>
      </div>

      {/* SuperAdmin badge */}
      {isSuperAdmin && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl">
            <span className="text-purple-500 text-xs">⚡</span>
            <span className="text-purple-600 text-xs font-semibold tracking-wide uppercase">
              Platform Admin
            </span>
          </div>
        </div>
      )}

      {/* Tenant context */}
      {!isSuperAdmin && user?.tenant_name && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F0F2F7] border border-gray-200 rounded-xl">
            <FaBuilding className="text-gray-400 text-xs flex-shrink-0" />
            <span className="text-gray-600 text-xs font-medium truncate">
              {user.tenant_name}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
          {isSuperAdmin ? 'Platform Menu' : 'Main Menu'}
        </p>

        <ul className="space-y-1">
          {isSuperAdmin ? (
            superAdminNavLinks.map(({ to, icon, label }) => (
              <NavItem key={to} to={to} icon={icon} label={label} />
            ))
          ) : (
            filteredLinks.map(({ to, icon, label }) => (
              <NavItem key={to} to={to} icon={icon} label={label} />
            ))
          )}
        </ul>
      </nav>

      {/* User Info + Logout */}
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              isSuperAdmin ? 'bg-purple-500' : 'bg-[rgb(16_102_177)]'
            }`}
          >
            <span className="text-white text-sm font-bold uppercase">
              {user?.full_name ? user.full_name.charAt(0) : user?.email?.charAt(0) ?? 'A'}
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-[rgb(16_102_177)] text-sm font-semibold truncate">
              {user?.full_name ?? 'Admin User'}
            </p>
            <p className="text-gray-400 text-xs truncate">{user?.email ?? 'admin@vote.com'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 text-sm font-medium transition-all duration-150"
        >
          <LogOut className="w-4 h-4 ml-1" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
