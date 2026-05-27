import { TrendingUp, TrendingDown } from 'lucide-react';

const COLOR_MAP = {
  primary: 'border-[#e6edfb] text-[#0051D5] bg-[#e6edfb]',
  secondary: 'border-secondary-100 text-secondary-600 bg-secondary-50',
  green: 'border-green-100 text-green-600 bg-green-50',
  blue: 'border-[#e6edfb] text-[#0051D5] bg-[#e6edfb]',
  orange: 'border-orange-100 text-orange-600 bg-orange-50',
  yellow: 'border-warning-100 text-warning-600 bg-warning-50',
  amber: 'border-warning-100 text-warning-600 bg-warning-50',
  red: 'border-red-100 text-red-600 bg-red-50',
  black: 'border-gray-800 text-white bg-black',
  gray: 'border-gray-200 text-gray-800 bg-gray-100',
};

export default function StatsCard({ title, value, icon: Icon, color = 'primary', change }) {
  const colorClass = COLOR_MAP[color] ?? COLOR_MAP.primary;
  const isPositive = typeof change === 'number' ? change >= 0 : true;
  const absChange = typeof change === 'number' ? Math.abs(change) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-all group hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorClass} transition-colors group-hover:bg-white shadow-sm`}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
      
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {value !== undefined && value !== null ? value.toLocaleString() : '0'}
      </div>

      {absChange !== null && (
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {absChange}%
          </div>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">vs last month</span>
        </div>
      )}
    </div>
  );
}
