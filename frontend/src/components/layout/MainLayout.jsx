import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
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
