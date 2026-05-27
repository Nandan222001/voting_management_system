import { useState } from 'react';
import { FaBell, FaUserCircle, FaChevronDown } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const ROLE_COLORS = {
  admin: 'bg-blue-100 text-[#1B4FD8]',
  moderator: 'bg-purple-100 text-purple-700',
  viewer: 'bg-gray-100 text-gray-600',
};

export default function Header({ title }) {
  const { user } = useSelector((state) => state.auth);
  const [notifOpen, setNotifOpen] = useState(false);

  const roleLabel = user?.role ?? 'Admin';
  const roleBadgeClass = ROLE_COLORS[user?.role?.toLowerCase()] ?? ROLE_COLORS.admin;

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="relative w-96 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-black transition-colors" />
        <input 
          type="text" 
          placeholder="Search tenants, nodes, or logs..." 
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all shadow-sm"
        />
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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-800 text-sm">Notifications</p>
              </div>
              <ul className="divide-y divide-gray-50">
                <li className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <p className="font-medium">New user registered</p>
                  <p className="text-gray-400 text-xs mt-0.5">2 minutes ago</p>
                </li>
                <li className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <p className="font-medium">Election "City Council 2026" started</p>
                  <p className="text-gray-400 text-xs mt-0.5">1 hour ago</p>
                </li>
                <li className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <p className="font-medium">3 pending approvals</p>
                  <p className="text-gray-400 text-xs mt-0.5">3 hours ago</p>
                </li>
              </ul>
              <div className="px-4 py-2 border-t border-gray-100">
                <button className="text-[#1B4FD8] text-xs font-semibold hover:underline">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200" />

        {/* User Info */}
        <div className="flex items-center gap-3 cursor-default select-none">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold uppercase">
              {user?.full_name ? user.full_name.charAt(0) : user?.email?.charAt(0) ?? 'A'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {user?.full_name ?? 'Admin User'}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${roleBadgeClass}`}
              >
                {roleLabel}
              </span>
            </div>
          </div>
          <FaChevronDown className="text-gray-400 text-xs hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
