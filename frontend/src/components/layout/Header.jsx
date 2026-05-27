import { Search } from 'lucide-react';

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
      <div className="flex items-center gap-6">
        <div className="font-bold text-xl text-gray-900 tracking-tight">ElectionAdmin OS</div>
      </div>
    </header>
  );
}
