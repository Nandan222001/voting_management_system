import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaHome,
  FaVoteYea,
  FaUsers,
  FaUserCog,
  FaChartBar,
  FaShieldAlt,
  FaChartLine,
  FaCog,
  FaLayerGroup,
} from 'react-icons/fa';
import {
  BarChart3,
  Building2,
  LogOut,
  MapPinned,
  Monitor,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logoutUser, selectCurrentUser } from '../../store/slices/authSlice';

const adminNavLinks = [
  { to: '/dashboard', icon: FaHome, label: 'Dashboard', roles: ['admin', 'moderator', 'voter'] },
  { to: '/elections', icon: FaVoteYea, label: 'Elections', roles: ['admin', 'moderator', 'voter'] },
  { to: '/candidates', icon: FaUsers, label: 'Candidates', roles: ['admin', 'moderator', 'voter'] },
  { to: '/candidate-committees', icon: FaLayerGroup, label: 'Committees', roles: ['admin'] },
  { to: '/users', icon: FaUserCog, label: 'Users', roles: ['admin'] },
  { to: '/results', icon: FaChartBar, label: 'Results', roles: ['admin', 'moderator', 'voter'] },
  { to: '/revenue', icon: FaChartLine, label: 'Revenue', roles: ['admin'] },
  // { to: '/audit-logs', icon: FaShieldAlt, label: 'Audit Logs', roles: ['admin'] },
  { to: '/settings', icon: FaCog, label: 'Settings', roles: ['admin', 'moderator', 'voter'] },
];

const superAdminNavLinks = [
  { to: '/dashboard', icon: BarChart3, label: 'Global Analytics' },
  { to: '/tenants', icon: Building2, label: 'Tenant Management' },
  { to: '/elections?superadmin=true', icon: Monitor, label: 'Election Monitoring' },
  { to: '/targets', icon: MapPinned, label: 'Committee Management' },
  { to: '/audit-logs', icon: Shield, label: 'Security Logs' },
  // { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

function SuperAdminNavItem({ to, icon: Icon, label }) {
  return (
    <li>
      <NavLink
        to={to}
        end={to === '/dashboard'}
        className={({ isActive }) =>
          `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.05em] transition active:scale-[0.98] ${
            isActive
              ? 'bg-[#dae2ff] text-[#003d9b]'
              : 'text-[#434654] hover:bg-[#e7e8ea] hover:text-[#003d9b]'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon className="h-6 w-6" strokeWidth={isActive ? 2.8 : 2} />
            <span>{label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <li>
      <NavLink
        to={to}
        end={false}
        className={({ isActive }) =>
          `group flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
            isActive
              ? 'bg-[#003d9b] text-white font-semibold'
              : 'text-[#434654] hover:bg-[#e7e8ea] hover:text-[#003d9b]'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              className={`flex-shrink-0 text-base transition-colors ${
                isActive ? 'text-white' : 'text-[#434654] group-hover:text-[#003d9b]'
              }`}
            />
            <span>{label}</span>
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

  if (isSuperAdmin) {
    const initials = (user?.full_name || user?.email || 'Super Admin')
      .split(/[.\s@_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    return (
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-[#c3c6d6] bg-white p-4 md:flex">
        <div className="mb-8 px-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-left text-2xl font-bold leading-8 tracking-tight text-[#003d9b]"
          >
             SUPERADMIN
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {superAdminNavLinks.map(({ to, icon, label }) => (
              <SuperAdminNavItem key={to} to={to} icon={icon} label={label} />
            ))}
          </ul>
        </nav>

        <div className="mt-auto border-t border-[#c3c6d6] px-2 pt-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0052cc] text-xs font-bold text-[#c4d2ff]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.05em] text-[#191c1e]">
                {user?.full_name || 'Super Admin'}
              </p>
              <p className="truncate text-[10px] text-[#434654]">Global Privileges</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-semibold text-[#434654] transition hover:bg-[#ffdad6] hover:text-[#ba1a1a]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[260px] flex-col border-r border-[#c3c6d6] bg-white py-4 md:flex">
      <div className="mb-8 px-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-left text-2xl font-bold leading-8 tracking-tight text-[#003d9b]"
        >
          Admin Console
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#434654]">
          {user?.tenant_name || 'Federal Jurisdiction'}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        <ul className="space-y-1">
          {filteredLinks.map(({ to, icon, label }) => (
            <NavItem key={to} to={to} icon={icon} label={label} />
          ))}
        </ul>
      </nav>

      <div className="mt-auto border-t border-[#c3c6d6] px-4 pt-4">
        <div className="mb-3 flex cursor-pointer items-center rounded-lg p-2 transition-colors hover:bg-[#e7e8ea]">
          <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0052cc] text-sm font-bold uppercase text-white">
            {user?.full_name ? user.full_name.charAt(0) : user?.email?.charAt(0) ?? 'A'}
          </div>
          <div className="min-w-0 overflow-hidden">
            <p className="truncate text-sm font-bold text-[#191c1e]">{user?.full_name || 'Admin User'}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#434654]">{role || 'admin'} Access</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium text-[#434654] transition hover:bg-[#ffdad6] hover:text-[#ba1a1a]"
          type="button"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
