import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

const COLOR_MAP = {
  indigo: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-[#1B4FD8]',
    ring: 'ring-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    ring: 'ring-green-200',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    ring: 'ring-blue-200',
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
  const colors = COLOR_MAP[color] ?? COLOR_MAP.indigo;
  const isPositive = typeof change === 'number' ? change >= 0 : true;
  const absChange = typeof change === 'number' ? Math.abs(change) : null;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow ring-1 ${colors.ring}`}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
        {Icon && <Icon className="text-xl" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-sm font-medium truncate">{title}</p>
        <p className="text-3xl font-bold text-[#1066b1] mt-0.5 leading-tight">
          {value !== undefined && value !== null ? value.toLocaleString() : '—'}
        </p>

        {/* Change Badge */}
        {absChange !== null && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                isPositive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isPositive ? (
                <FaArrowUp className="text-[10px]" />
              ) : (
                <FaArrowDown className="text-[10px]" />
              )}
              {absChange}%
            </span>
            <span className="text-gray-400 text-xs">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
