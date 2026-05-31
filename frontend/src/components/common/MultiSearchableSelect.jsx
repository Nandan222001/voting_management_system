import { Fragment, useState } from 'react'
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react'
import { Check, ChevronDown, Search, X, Plus } from 'lucide-react'

export default function MultiSearchableSelect({ 
  label, 
  options = [], 
  value = [], 
  onChange, 
  placeholder = 'Search/Select multiple...', 
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

  const selectedOptions = options.filter(o => value.includes(o.id))

  const handleToggle = (id) => {
    let nextValue
    if (value.includes(id)) {
      nextValue = value.filter(v => v !== id)
    } else {
      nextValue = [...value, id]
    }
    onChange(nextValue)
  }

  const handleRemove = (e, id) => {
    e.stopPropagation()
    onChange(value.filter(v => v !== id))
  }

  return (
    <div className={`w-full space-y-1.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {label && (
        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative group">
        {/* Selected Tags Display */}
        <div className={`min-h-[42px] flex flex-wrap gap-1.5 w-full p-1.5 rounded-xl border border-gray-200 bg-white transition-all focus-within:ring-2 focus-within:ring-[#1a337e]/10 focus-within:border-[#1a337e] hover:border-gray-300 shadow-sm ${disabled ? 'bg-gray-50' : ''}`}>
          {selectedOptions.map(opt => (
            <span key={opt.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-[#1a337e] text-xs font-bold border border-blue-100 animate-in zoom-in-95 duration-150">
              {opt.name}
              <button 
                type="button" 
                onClick={(e) => handleRemove(e, opt.id)}
                className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          
          <Combobox value={null} onChange={handleToggle} disabled={disabled}>
            <div className="flex-1 min-w-[120px]">
              <div className="relative">
                <ComboboxInput
                  className="w-full border-none py-1 px-2 text-sm leading-5 text-gray-900 font-bold bg-transparent focus:ring-0 outline-none placeholder-gray-400"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={selectedOptions.length === 0 ? placeholder : ''}
                />
                <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-1">
                  <ChevronDown
                    className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors"
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
                      No results found.
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
                        {({ active }) => {
                          const isSelected = value.includes(option.id)
                          return (
                            <>
                              <span
                                className={`block truncate ${
                                  isSelected ? 'font-black text-[#1a337e]' : 'font-bold'
                                }`}
                              >
                                {option.name}
                              </span>
                              {isSelected ? (
                                <span
                                  className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1a337e]"
                                >
                                  <Check className="h-4 w-4" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )
                        }}
                      </ComboboxOption>
                    ))
                  )}
                </ComboboxOptions>
              </Transition>
            </div>
          </Combobox>
        </div>
      </div>
    </div>
  )
}
