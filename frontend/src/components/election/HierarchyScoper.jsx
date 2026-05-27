import { useState } from 'react';
import {
  FaMapMarkerAlt,
  FaUsers,
  FaChevronDown,
} from 'react-icons/fa';

const LEVEL_CONFIG = [
  { id: 'state', title: 'State Committee', subtitle: 'Regional Authority', icon: FaMapMarkerAlt, color: 'blue' },
  { id: 'district', title: 'District Committee', subtitle: 'District Level', icon: FaMapMarkerAlt, color: 'blue' },
  { id: 'block', title: 'Block Committee', subtitle: 'Block / Taluka / City', icon: FaUsers, color: 'blue' },
];

export default function HierarchyScoper({ selectedId, onSelect, loading }) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = LEVEL_CONFIG.find(l => l.id === selectedId) || LEVEL_CONFIG[0];

  return (
    <div className="relative inline-block text-left w-full sm:w-72">
      <button
        onClick={() => !loading && setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all focus:outline-none focus:ring-4 focus:ring-black/5 disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <selected.icon size={16} />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Scope</p>
            <p className="text-sm font-bold text-gray-900 leading-none">{selected.title}</p>
          </div>
        </div>
        <FaChevronDown className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 left-0 mt-2 z-20 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden py-1">
            {LEVEL_CONFIG.map((level) => (
              <button
                key={level.id}
                onClick={() => {
                  onSelect(level.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50 transition-colors text-left ${
                  selectedId === level.id ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                   selectedId === level.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 text-gray-400'
                }`}>
                  <level.icon size={20} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${selectedId === level.id ? 'text-blue-600' : 'text-gray-900'}`}>
                    {level.title}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{level.subtitle}</p>
                </div>
                {selectedId === level.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
