import React, { Fragment, useState } from 'react'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react'
import { FaChevronDown, FaCheck } from 'react-icons/fa'

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
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-white text-left border border-gray-200 shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent hover:shadow-md disabled:opacity-60">
            <ComboboxInput
              className="w-full border-none py-2.5 pl-4 pr-10 text-sm leading-5 text-gray-800 focus:ring-0 outline-none"
              displayValue={() => selectedOption?.label || ''}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder || 'Select option...'}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
              <FaChevronDown
                className="h-3 w-3 text-gray-400 hover:text-gray-600 transition-colors"
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
              className="z-50 mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-xl bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm [--anchor-gap:4px]"
            >
              {filteredOptions.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Nothing found.
                </div>
              ) : (
                filteredOptions.map((option, idx) => (
                  <ComboboxOption
                    key={idx}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors ${
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={option.value}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-semibold' : 'font-normal'
                          }`}
                        >
                          {option.label}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-indigo-600'
                            }`}
                          >
                            <FaCheck className="h-3 w-3" aria-hidden="true" />
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
