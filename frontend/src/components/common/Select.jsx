import { Fragment } from 'react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'

export default function Select({ 
  label, 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select option...', 
  required, 
  disabled,
  className = '',
  hasError = false
}) {
  // Normalize options to { value, label }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.value ?? '', label: opt.label ?? String(opt) }
    }
    return { value: opt, label: String(opt) }
  })

  // Find currently selected option label
  const selectedOption = normalizedOptions.find(o => String(o.value) === String(value))

  // Wrap onChange to mimic standard event for compatibility
  const handleChange = (val) => {
    if (onChange) {
      onChange({
        target: {
          value: val
        }
      })
    }
  }

  return (
    <div className={`w-full space-y-1.5 ${className} ${disabled ? 'opacity-50' : ''}`}>
      {label && (
        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <Listbox value={value} onChange={handleChange} disabled={disabled}>
        <div className="relative group">
          <ListboxButton className={`relative w-full cursor-default rounded-xl border bg-white py-2.5 pl-4 pr-10 text-left text-sm font-bold text-[#1a337e] transition-all hover:border-gray-300 focus:border-[#1a337e] focus:outline-none focus:ring-2 focus:ring-[#1a337e]/10 disabled:bg-gray-50 disabled:text-gray-400 ${
            hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'
          }`}>
            <span className={`block truncate ${!selectedOption ? 'text-gray-400 font-normal' : ''}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDown
                className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-1 scale-95"
          >
            <ListboxOptions className="absolute z-[9999] mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-1.5 text-base shadow-2xl ring-1 ring-black/5 focus:outline-none sm:text-sm transform-gpu">
              {normalizedOptions.map((option, idx) => (
                <ListboxOption
                  key={idx}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors ${
                      active ? 'bg-blue-50 text-[#1a337e]' : 'text-gray-700'
                    }`
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-black' : 'font-bold'}`}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1a337e]">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}
