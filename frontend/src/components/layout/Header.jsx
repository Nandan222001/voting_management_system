import { useState, Fragment } from 'react';
import { FaBell, FaUserCircle, FaChevronDown, FaSignOutAlt } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { selectCurrentUser, logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin: 'bg-indigo-100 text-indigo-700',
  superadmin: 'bg-purple-100 text-purple-700',
  moderator: 'bg-indigo-100 text-indigo-700',
};

export default function Header({ title }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  
  const SHOW_NOTIFICATIONS = false;
  const [notifOpen, setNotifOpen] = useState(false);

  const roleLabel = user?.role ?? 'Admin';
  const roleBadgeClass = ROLE_COLORS[user?.role?.toLowerCase()] ?? ROLE_COLORS.admin;

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 sticky top-0 z-40 shadow-sm">
      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notification Bell (hidden when SHOW_NOTIFICATIONS=false) */}
        {SHOW_NOTIFICATIONS ? (
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <FaBell className="text-gray-500 text-lg" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>
        ) : (
          <div className="w-10 h-10 md:hidden" aria-hidden />
        )}

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200 hidden sm:block" />

        {/* User Profile Dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-3 p-1 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none group">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white text-sm font-bold uppercase">
                {user?.full_name ? user.full_name.charAt(0) : user?.email?.charAt(0) ?? 'A'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                {user?.full_name ?? 'Admin User'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${roleBadgeClass}`}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
            <FaChevronDown className="text-gray-400 text-xs transition-transform group-aria-expanded:rotate-180" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white border border-gray-100 divide-y divide-gray-50 rounded-2xl shadow-xl z-50 focus:outline-none ring-1 ring-black ring-opacity-5">
              <div className="px-4 py-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Signed in as</p>
                <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-red-50 text-red-600' : 'text-gray-700'
                      } group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors`}
                    >
                      <FaSignOutAlt className={`${active ? 'text-red-500' : 'text-gray-400'} transition-colors`} />
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
