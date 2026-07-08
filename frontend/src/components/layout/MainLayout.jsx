import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  CircleUserRound,
  FileBarChart,
  Home,
  MapPinned,
  Megaphone,
  Settings,
  TrendingUp,
  UserCog,
  Users,
  UsersRound,
  Vote,
} from 'lucide-react';

const superAdminBottomNav = [
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/tenants', icon: Building2, label: 'Tenants' },
  { to: '/audit-logs', icon: FileBarChart, label: 'Logs' },
  { to: '/account', icon: CircleUserRound, label: 'Account' },
];

const adminBottomNav = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/elections', icon: Vote, label: 'Elections' },
  { to: '/candidates', icon: UsersRound, label: 'Candidates' },
  { to: '/nominations', icon: UserCog, label: 'Nominations' },
  { to: '/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/targets', icon: MapPinned, label: 'Committee' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/revenue', icon: TrendingUp, label: 'Revenue' },
];

function BottomNav({ links, activeClass = 'scale-110 bg-[#1a337e] text-white' }) {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-[#c3c6d6] bg-white px-4 shadow-lg md:hidden">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/dashboard'}
          aria-label={label}
          className={({ isActive }) =>
            `flex h-10 w-10 items-center justify-center rounded-full transition ${
              isActive
                ? activeClass
                : 'text-[#434654] hover:bg-[#e1e2e4]'
            }`
          }
        >
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </NavLink>
      ))}
    </nav>
  );
}

export default function MainLayout({ children, title, noPadding = false }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';

  if (!isAuthenticated) return children;

  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] font-sans text-[#191c1e] selection:bg-[#dae2ff] selection:text-[#001848]">
        <Sidebar />
        <div className="md:pl-[260px]">
          <Header title={title} />
          <main className={`w-full pb-24 md:pb-8 ${noPadding ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}>
            {children}
          </main>
        </div>
        <BottomNav links={superAdminBottomNav} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#191c1e]">
      <Sidebar />
      <div className="md:pl-[260px]">
        <Header title={title} />
        <main className={`pb-24 md:pb-8 ${noPadding ? 'p-0' : 'p-4 md:p-8'}`}>
          {children}
        </main>
      </div>
      <BottomNav links={adminBottomNav} />
    </div>
  );
}
