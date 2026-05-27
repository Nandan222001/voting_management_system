import { FaInbox } from 'react-icons/fa';
import CommonButton from './CommonButton';

export default function EmptyState({
  icon: Icon = FaInbox,
  title = 'No data found',
  message = 'There are no records to display.',
  action,
  actionLabel = 'Add New',
}) {
  const renderIcon = () => {
    if (typeof Icon === 'function') {
      return <Icon className="text-2xl text-gray-400" />
    }
    return Icon
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {renderIcon()}
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm leading-relaxed">{message}</p>
      {action && (
        <CommonButton onClick={action} className="mt-5">
          {actionLabel}
        </CommonButton>
      )}
    </div>
  );
}
