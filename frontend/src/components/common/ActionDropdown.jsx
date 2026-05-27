import { Fragment, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu, Transition } from '@headlessui/react';
import { MoreVertical } from 'lucide-react';

function DropdownItems({ actions, align, open, updatePosition, position }) {
  const itemsRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return undefined;

    updatePosition(itemsRef.current);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <Transition
      show={open}
      as={Fragment}
      enter="transition ease-out duration-150"
      enterFrom="opacity-0 scale-95 translate-y-1"
      enterTo="opacity-100 scale-100 translate-y-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100 scale-100 translate-y-0"
      leaveTo="opacity-0 scale-95 translate-y-1"
      afterEnter={() => updatePosition(itemsRef.current)}
    >
      <Menu.Items
        static
        ref={itemsRef}
        style={{ top: position.top, left: position.left }}
        className={`fixed z-[99999] w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-none ${
          align === 'right' ? 'origin-top-right' : 'origin-top-left'
        }`}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Menu.Item key={action.key || action.label} disabled={action.disabled}>
              {({ active, disabled }) => (
                <button
                  type="button"
                  onClick={action.onClick}
                  disabled={disabled}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-150 ${
                    active ? 'bg-[#0051D5] text-white' : action.danger ? 'text-red-600' : 'text-gray-700'
                  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                  <span className="truncate">{action.label}</span>
                </button>
              )}
            </Menu.Item>
          );
        })}
      </Menu.Items>
    </Transition>,
    document.body
  );
}

export default function ActionDropdown({ actions = [], label = 'Open actions', align = 'right' }) {
  const visibleActions = actions.filter(Boolean);
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback((menuElement) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 192;
    const menuHeight = menuElement?.offsetHeight || Math.min(visibleActions.length * 42 + 12, 320);
    const viewportPadding = 8;

    let left = align === 'right' ? rect.right - menuWidth : rect.left;
    left = Math.min(Math.max(viewportPadding, left), window.innerWidth - menuWidth - viewportPadding);

    let top = rect.bottom + viewportPadding;
    if (top + menuHeight > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, rect.top - menuHeight - viewportPadding);
    }

    setPosition({ top, left });
  }, [align, visibleActions.length]);

  if (visibleActions.length === 0) return null;

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => {
        return (
          <>
            <Menu.Button
              ref={buttonRef}
              aria-label={label}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-150 hover:border-[#0051D5] hover:bg-[#e6edfb] hover:text-[#0051D5] focus:outline-none focus:ring-2 focus:ring-[#0051D5]/30 focus:ring-offset-2"
            >
              <MoreVertical className="h-4 w-4" />
            </Menu.Button>

            <DropdownItems
              actions={visibleActions}
              align={align}
              open={open}
              position={position}
              updatePosition={updatePosition}
            />
          </>
        );
      }}
    </Menu>
  );
}
