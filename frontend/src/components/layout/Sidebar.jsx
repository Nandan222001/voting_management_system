import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  LayoutDashboard, Users, Shield, Settings, Activity, FileText, CheckSquare, Banknote, MapPin, LogOut
} from 'lucide-react';
import { logoutUser, selectCurrentUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const navLinks = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'moderator', 'voter'] },
  { to: '/elections', icon: CheckSquare, label: 'Elections', roles: ['admin', 'moderator', 'voter'] },
  { to: '/candidates', icon: Users, label: 'Candidates', roles: ['admin', 'moderator', 'voter'] },
  { to: '/candidate-committees', icon: Shield, label: 'Committees', roles: ['admin'] },
  { to: '/users', icon: Users, label: 'Users', roles: ['admin'] },
  { to: '/results', icon: Activity, label: 'Results', roles: ['admin', 'moderator', 'voter'] },
  { to: '/revenue', icon: Banknote, label: 'Revenue', roles: ['admin'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'moderator', 'voter'] },
];

const superAdminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tenants', icon: Users, label: 'Tenants' },
  { to: '/targets', icon: MapPin, label: 'Geography' },
  { to: '/audit-logs', icon: FileText, label: 'Audit Logs', roles: ['superadmin'] },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const SidebarItem = ({ icon: Icon, label, to }) => (
  <NavLink 
    to={to}
    className={({ isActive }) => 
      `flex items-center px-6 py-3 cursor-pointer transition-all ${isActive ? 'bg-[#e6edfb] text-[#0051D5] border-l-4 border-[#0051D5] font-bold' : 'text-gray-500 hover:bg-[#e6edfb] hover:text-[#0051D5]'}`
    }
  >
    <Icon className="w-5 h-5 mr-3" />
    <span className="text-sm font-semibold">{label}</span>
  </NavLink>
);

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const filteredLinks = navLinks.filter(
    (link) => !link.roles || (user && link.roles.includes(user.role))
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-200 text-center">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          {user?.role === 'superadmin' ? 'SuperAdmin' : 'TechElect'}
        </h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
          {user?.role === 'superadmin' ? 'Platform Overview' : 'Voting System'}
        </p>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        {user?.role === 'superadmin' ? (
          superAdminLinks.map((link) => (
            <SidebarItem key={link.to} to={link.to} icon={link.icon} label={link.label} />
          ))
        ) : (
          filteredLinks.map((link) => (
            <SidebarItem key={link.to} to={link.to} icon={link.icon} label={link.label} />
          ))
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold overflow-hidden">
             {user?.avatar_url ? (
               <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               user?.full_name?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'S'
             )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-gray-900 truncate">
              {user?.full_name || user?.name || 'System Admin'}
            </div>
            <div className="text-[10px] text-gray-400 font-bold uppercase truncate">
              {user?.role || 'Admin'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-2 py-2 text-gray-400 hover:text-red-600 text-sm font-semibold transition-all"
        >
          <LogOut className="w-4 h-4 ml-1" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
