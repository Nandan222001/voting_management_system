import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`w-full ${sizeClass} bg-white rounded-2xl border border-gray-100 shadow-2xl transform transition-all overflow-hidden`}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                  <Dialog.Title className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-8">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
