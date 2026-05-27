import Modal from './Modal';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  variant = 'red',
}) {
  const isRed = variant === 'red';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isRed ? 'bg-red-100' : 'bg-blue-100'
          }`}
        >
          {isRed ? (
            <FaExclamationTriangle className="text-red-600 text-2xl" />
          ) : (
            <FaInfoCircle className="text-[#1B4FD8] text-2xl" />
          )}
        </div>

        {/* Message */}
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${
              isRed
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#1B4FD8] hover:bg-[#1640B8]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
