import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children, title }) {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) return children;

  return (
    <div className="min-h-screen bg-[#F0F2F7]">
      <Sidebar />
      <div className="pl-64">
        <Header title={title} />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
