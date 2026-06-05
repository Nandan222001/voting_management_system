import { TrendingUp, TrendingDown } from 'lucide-react';

const COLOR_MAP = {
  indigo: {
    bg: 'bg-[#e8eaf6]',
    icon: 'bg-[#1a337e] text-white',
    ring: 'ring-[#1a337e]/20',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    ring: 'ring-green-200',
  },
  blue: {
    bg: 'bg-[#e8eaf6]',
    icon: 'bg-[#1a337e] text-white',
    ring: 'ring-[#1a337e]/20',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-100 text-orange-600',
    ring: 'ring-orange-200',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    ring: 'ring-red-200',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    ring: 'ring-purple-200',
  },
};

export default function StatsCard({ title, value, icon: Icon, color = 'indigo', change }) {
  const colorClass = COLOR_MAP[color] ?? COLOR_MAP.indigo;
  const isPositive = typeof change === 'number' ? change >= 0 : true;
  const absChange = typeof change === 'number' ? Math.abs(change) : null;

  return (
    <div className="rounded-lg border border-[#c4c6d0] bg-white p-5 shadow-sm transition-all group hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#74777f]">{title}</h3>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass.icon} shadow-sm`}>
          {Icon && <Icon size={20} />}
        </div>
      </div>
      
      <div className="mb-1 text-3xl font-bold text-[#1b1b1f]">
        {value !== undefined && value !== null ? value.toLocaleString() : '0'}
      </div>

      {absChange !== null && (
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {isPositive ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {absChange}%
          </span>
          <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">vs last month</span>
        </div>
      )}
    </div>
  );
}
