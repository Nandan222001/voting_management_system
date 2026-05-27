import { useState } from 'react';
import { FaBell, FaChevronDown } from 'react-icons/fa';
import { Search } from 'lucide-react';
import { useSelector } from 'react-redux';

const ROLE_COLORS = {
  admin: 'bg-[#e6edfb] text-[rgb(16_102_177)]',
  superadmin: 'bg-purple-100 text-purple-700',
  moderator: 'bg-orange-100 text-orange-700',
  viewer: 'bg-gray-100 text-gray-600',
};

export default function Header({ title }) {
  const { user } = useSelector((state) => state.auth);
  const [notifOpen, setNotifOpen] = useState(false);

  const roleLabel = user?.role ?? 'Admin';
  const roleBadgeClass = ROLE_COLORS[user?.role?.toLowerCase()] ?? ROLE_COLORS.admin;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        {title && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
        <div className="relative w-96 group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[rgb(16_102_177)] transition-colors" />
          <input 
            type="text" 
            placeholder="Search tenants, nodes, or logs..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[rgb(16_102_177)]/5 focus:border-[rgb(16_102_177)] transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <FaBell className="text-gray-500 text-lg" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <p className="font-bold text-gray-900 text-sm">Notifications</p>
              </div>
              <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                <li className="px-5 py-4 text-sm hover:bg-gray-50 cursor-pointer transition-colors">
                  <p className="font-semibold text-gray-800">New user registered</p>
                  <p className="text-gray-400 text-xs mt-1">2 minutes ago</p>
                </li>
                <li className="px-5 py-4 text-sm hover:bg-gray-50 cursor-pointer transition-colors">
                  <p className="font-semibold text-gray-800">Election &quot;City Council 2026&quot; started</p>
                  <p className="text-gray-400 text-xs mt-1">1 hour ago</p>
                </li>
                <li className="px-5 py-4 text-sm hover:bg-gray-50 cursor-pointer transition-colors">
                  <p className="font-semibold text-gray-800">3 pending approvals</p>
                  <p className="text-gray-400 text-xs mt-1">3 hours ago</p>
                </li>
              </ul>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                <button className="text-[rgb(16_102_177)] text-xs font-bold hover:underline w-full text-center">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200" />

        {/* User Info */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-[rgb(16_102_177)] flex items-center justify-center flex-shrink-0 shadow-sm shadow-[rgb(16_102_177)]/20">
            <span className="text-white text-sm font-bold uppercase">
              {user?.full_name ? user.full_name.charAt(0) : user?.email?.charAt(0) ?? 'A'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-tight">
              {user?.full_name ?? 'Admin User'}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${roleBadgeClass}`}
              >
                {roleLabel}
              </span>
            </div>
          </div>
          <FaChevronDown className="text-gray-400 text-[10px] hidden sm:block group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </header>
  );
}
