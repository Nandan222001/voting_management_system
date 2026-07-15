import { Fragment, useState } from 'react'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react'
import { Check, ChevronDown, Search, Plus } from 'lucide-react'

export default function SearchableSelect({ 
  label, 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Search/Select...', 
  onAddNew, 
  disabled = false,
  required = false
}) {
  const [query, setQuery] = useState('')

  const filteredOptions = query === ''
    ? options
    : options.filter((option) =>
        (option.name || '')
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.toLowerCase().replace(/\s+/g, ''))
      )

  const selectedOption = options.find(o => String(o.id) === String(value))

  return (
    <div className={`w-full space-y-1.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {label && (
        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Combobox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative group">
          <div className={`relative w-full cursor-default overflow-hidden rounded-xl bg-white text-left border border-gray-200 transition-all focus-within:ring-2 focus-within:ring-[#1a337e]/10 focus-within:border-[#1a337e] hover:border-gray-300 shadow-sm ${disabled ? 'bg-gray-50' : ''}`}>
            <ComboboxInput
              className="w-full border-none py-2.5 pl-4 pr-10 text-sm leading-5 text-gray-900 font-bold bg-transparent focus:ring-0 outline-none placeholder-gray-400"
              displayValue={() => selectedOption?.name || ''}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDown
                className="h-4 w-4 text-gray-300 group-hover:text-gray-400 group-focus-within:text-[#1a337e] transition-colors"
                aria-hidden="true"
              />
            </ComboboxButton>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-1 scale-95"
            afterLeave={() => setQuery('')}
          >
            <ComboboxOptions 
              anchor="bottom start" 
              className="z-[9999] mt-2 max-h-60 w-[var(--input-width)] overflow-auto rounded-xl bg-white py-1.5 text-base shadow-2xl ring-1 ring-black/5 focus:outline-none sm:text-sm [--anchor-gap:4px] transform-gpu"
            >
              {filteredOptions.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-3 px-4 text-gray-400 font-medium italic text-center">
                  No matching results.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <ComboboxOption
                    key={option.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors ${
                        active ? 'bg-blue-50 text-[#1a337e]' : 'text-gray-700'
                      }`
                    }
                    value={option.id}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-black' : 'font-bold'
                          }`}
                        >
                          {option.name}
                        </span>
                        {selected ? (
                          <span
                            className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1a337e]"
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </ComboboxOption>
                ))
              )}

              {onAddNew && query.trim() !== '' && (
                <div 
                  className="sticky bottom-0 p-2 mt-1 border-t border-gray-100 bg-gray-50 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-xs font-black text-[#1a337e] uppercase tracking-wider transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddNew(query);
                    setQuery('');
                  }}
                >
                  <Plus size={14} className="bg-[#1a337e] text-white rounded p-0.5" />
                  Add New "{query}"
                </div>
              )}
            </ComboboxOptions>
          </Transition>
        </div>
      </Combobox>
    </div>
  )
}
