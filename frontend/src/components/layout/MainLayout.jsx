import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/elections': 'Elections',
  '/candidates': 'Candidates',
  '/users': 'User Management',
  '/results': 'Results & Reports',
  '/audit-logs': 'Audit Logs',
  '/superadmin': 'Platform Overview',
  '/tenants': 'Tenant Management',
};

function getTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Handle dynamic routes like /elections/:id
  if (pathname.startsWith('/elections/')) return 'Election Detail';
  return 'VoteAdmin';
}

export default function MainLayout({ children }) {
  const { pathname } = useLocation();
  const title = getTitle(pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main content area offset by sidebar width */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header title={title} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
