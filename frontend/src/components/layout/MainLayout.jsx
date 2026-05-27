import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F0F2F7] flex">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Header />
        
        {/* Dashboard Content */}
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
