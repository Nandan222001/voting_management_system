import Modal from './Modal';
import { AlertTriangle, Info } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  variant = 'primary',
}) {
  const isRed = variant === 'red' || variant === 'danger';
  const isBlack = variant === 'black';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-6">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isRed ? 'bg-red-100' : 'bg-blue-100'
          }`}
        >
          {isRed ? (
            <AlertTriangle className="text-red-600 w-8 h-8" />
          ) : isBlack ? (
            <Info className="text-gray-900 w-8 h-8" />
          ) : (
            <Info className="text-[#1a337e] w-8 h-8" />
          )}
        </div>

        <p className="text-gray-600 font-medium text-sm leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all ${
              isRed
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#1a337e] hover:bg-[rgb(12_85_148)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
