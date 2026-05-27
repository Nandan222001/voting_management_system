const STATUS_STYLES = {
  // Positive
  active: 'bg-green-50 text-green-700 border-green-100',
  open: 'bg-green-50 text-green-700 border-green-100',
  approved: 'bg-green-50 text-green-700 border-green-100',
  // Negative
  blocked: 'bg-red-50 text-red-700 border-red-100',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  deleted: 'bg-red-50 text-red-700 border-red-100',
  suspended: 'bg-red-50 text-red-700 border-red-100',
  // Neutral
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  'pending approval': 'bg-yellow-50 text-yellow-700 border-yellow-100',
  trial: 'bg-primary-50 text-primary-600 border-primary-100',
  provisioning: 'bg-primary-50 text-primary-600 border-primary-100',
  // Draft
  draft: 'bg-gray-50 text-gray-500 border-gray-100',
  inactive: 'bg-gray-50 text-gray-500 border-gray-100',
  // Roles
  admin: 'bg-primary-50 text-primary-600 border-primary-100',
  superadmin: 'bg-purple-50 text-purple-700 border-purple-100',
};

const DEFAULT_STYLE = 'bg-gray-50 text-gray-500 border-gray-100';

export default function Badge({ status }) {
  if (!status) return null;
  const key = String(status).toLowerCase().trim();
  const style = STATUS_STYLES[key] ?? DEFAULT_STYLE;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${style}`}
    >
      {status}
    </span>
  );
}
