import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart3,
  Building2,
  Layers,
  Megaphone,
  LogOut,
  MapPinned,
  Monitor,
  Settings,
  Shield,
  TrendingUp,
  UserCog,
  Users,
  Vote,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logoutUser, selectCurrentUser } from '../../store/slices/authSlice';

const adminNavLinks = [
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard', roles: ['admin', 'moderator', 'voter'] },
  { to: '/elections', icon: Vote, label: 'Elections', roles: ['admin', 'moderator', 'voter'] },
  { to: '/targets', icon: MapPinned, label: 'Committee Management', roles: ['admin'] },
  { to: '/candidates', icon: Users, label: 'Candidates', roles: ['admin', 'moderator', 'voter'] },
  { to: '/nominations', icon: UserCog, label: 'Nominated Users', roles: ['admin', 'moderator'] },
  { to: '/announcements', icon: Megaphone, label: 'Announcements', roles: ['admin'] },
  { to: '/users', icon: UserCog, label: 'Users', roles: ['admin'] },
  { to: '/results', icon: BarChart3, label: 'Results', roles: ['admin', 'moderator', 'voter'] },
  { to: '/revenue', icon: TrendingUp, label: 'Revenue', roles: ['admin'] },
  // { to: '/audit-logs', icon: Shield, label: 'Audit Logs', roles: ['admin'] },
];

const superAdminNavLinks = [
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/tenants', icon: Building2, label: 'Tenant Management' },
  { to: '/elections?superadmin=true', icon: Monitor, label: 'Election Monitoring' },
  { to: '/audit-logs', icon: Shield, label: 'Security Logs' },
  // { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

function NavItem({ to, icon: Icon, label, end = false }) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.05em] transition active:scale-[0.98] ${
            isActive
              ? 'bg-[#dae2ff] text-[#1a337e]'
              : 'text-[#434654] hover:bg-[#e7e8ea] hover:text-[#1a337e]'
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

  const initials = (user?.full_name || user?.email || role || 'User')
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  if (isSuperAdmin) {
    return (
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-[#c3c6d6] bg-white p-4 md:flex">
        <div className="mb-8 px-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-left text-2xl font-bold leading-8 tracking-tight text-[#1a337e]"
          >
             SUPERADMIN
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {superAdminNavLinks.map(({ to, icon, label }) => (
              <NavItem key={to} to={to} icon={icon} label={label} end={to === '/dashboard'} />
            ))}
          </ul>
        </nav>

        <div className="mt-auto border-t border-[#c3c6d6] px-2 pt-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#1a337e] text-xs font-bold text-[#c4d2ff]">
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
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[260px] flex-col border-r border-[#c3c6d6] bg-white p-4 md:flex">
      <div className="mb-8 px-2">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-left text-2xl font-bold leading-8 tracking-tight text-[#1a337e]"
        >
          ADMIN CONSOLE
        </button>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#434654]">
          {user?.tenant_name || 'Jurisdiction Registry'}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {filteredLinks.map(({ to, icon, label }) => (
            <NavItem key={to} to={to} icon={icon} label={label} end={to === '/dashboard'} />
          ))}
        </ul>
      </nav>

      <div className="mt-auto border-t border-[#c3c6d6] px-2 pt-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#1a337e] text-xs font-bold text-[#c4d2ff]">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.05em] text-[#191c1e]">
              {user?.full_name || 'Administrator'}
            </p>
            <p className="truncate text-[10px] text-[#434654]">{user?.tenant_name || 'Node Operator'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-semibold text-[#434654] transition hover:bg-[#ffdad6] hover:text-[#ba1a1a]"
          type="button"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
