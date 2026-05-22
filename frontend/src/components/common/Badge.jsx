const STATUS_STYLES = {
  // Election statuses
  active: 'bg-green-100 text-green-700 ring-green-200',
  open: 'bg-green-100 text-green-700 ring-green-200',
  approved: 'bg-green-100 text-green-700 ring-green-200',
  // Negative statuses
  blocked: 'bg-red-100 text-red-700 ring-red-200',
  cancelled: 'bg-red-100 text-red-700 ring-red-200',
  rejected: 'bg-red-100 text-red-700 ring-red-200',
  deleted: 'bg-red-100 text-red-700 ring-red-200',
  // Neutral / Waiting
  pending: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  'pending approval': 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  // Draft / Inactive
  draft: 'bg-gray-100 text-gray-600 ring-gray-200',
  inactive: 'bg-gray-100 text-gray-600 ring-gray-200',
  // Closed / Finished
  closed: 'bg-blue-100 text-blue-700 ring-blue-200',
  finished: 'bg-blue-100 text-blue-700 ring-blue-200',
  completed: 'bg-blue-100 text-blue-700 ring-blue-200',
  // Roles
  admin: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  moderator: 'bg-purple-100 text-purple-700 ring-purple-200',
  voter: 'bg-teal-100 text-teal-700 ring-teal-200',
};

const DEFAULT_STYLE = 'bg-gray-100 text-gray-600 ring-gray-200';

export default function Badge({ status }) {
  if (!status) return null;
  const key = String(status).toLowerCase().trim();
  const style = STATUS_STYLES[key] ?? DEFAULT_STYLE;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 capitalize ${style}`}
    >
      {status}
    </span>
  );
}
