import { Fragment, useState } from 'react'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react'
import { Check, ChevronDown, Search } from 'lucide-react'

export default function FancySelect({ 
  id, 
  name, 
  value, 
  onChange, 
  options = [], 
  className = '', 
  placeholder, 
  disabled = false 
}) {
  const [query, setQuery] = useState('')

  // Normalize options to { value, label }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.value ?? '', label: opt.label ?? String(opt) }
    }
    return { value: opt, label: String(opt) }
  })

  // If there's a placeholder, add it to the top if not already there
  let displayOptions = normalizedOptions
  if (placeholder && !normalizedOptions.some(o => o.value === '')) {
    displayOptions = [{ value: '', label: placeholder }, ...normalizedOptions]
  }

  const filteredOptions = query === ''
    ? displayOptions
    : displayOptions.filter((option) =>
        option.label
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.toLowerCase().replace(/\s+/g, ''))
      )

  // Find selected option
  const selectedOption = displayOptions.find(o => String(o.value) === String(value)) || displayOptions[0]

  const handleChange = (val) => {
    if (onChange) {
      onChange({
        target: {
          name,
          id,
          value: val
        }
      })
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <Combobox value={value} onChange={handleChange} disabled={disabled}>
        <div className="relative group">
          <div className={`relative w-full cursor-default overflow-hidden rounded-xl bg-white text-left border border-gray-200 transition-all focus-within:ring-2 focus-within:ring-[#1A237E]/10 focus-within:border-[#1A237E] hover:border-gray-300 disabled:opacity-60 shadow-sm ${disabled ? 'bg-gray-50' : ''}`}>
            <ComboboxInput
              className="w-full border-none py-2.5 pl-4 pr-10 text-sm leading-5 text-gray-900 font-bold bg-transparent focus:ring-0 outline-none placeholder-gray-400"
              displayValue={() => selectedOption?.label || ''}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder || 'Select...'}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDown
                className="h-4 w-4 text-gray-300 group-hover:text-gray-400 group-focus-within:text-[#1A237E] transition-colors"
                aria-hidden="true"
              />
            </ComboboxButton>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <ComboboxOptions 
              anchor="bottom start" 
              className="z-[9999] mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-xl bg-white py-1.5 text-base shadow-2xl ring-1 ring-black/5 focus:outline-none sm:text-sm [--anchor-gap:4px] animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {filteredOptions.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-3 px-4 text-gray-400 font-medium italic text-center">
                  No matching options found.
                </div>
              ) : (
                filteredOptions.map((option, idx) => (
                  <ComboboxOption
                    key={idx}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors ${
                        active ? 'bg-blue-50 text-[#1A237E]' : 'text-gray-700'
                      }`
                    }
                    value={option.value}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-black' : 'font-bold'
                          }`}
                        >
                          {option.label}
                        </span>
                        {selected ? (
                          <span
                            className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1A237E]"
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          </Transition>
        </div>
      </Combobox>
    </div>
  )
}

