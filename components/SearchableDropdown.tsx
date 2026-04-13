
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';

interface Option {
  id: string;
  label: string;
  description?: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  error,
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>}
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-gray-50 text-black rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 outline-none ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-300'
        } ${
          isOpen ? 'ring-4 ring-blue-50 border-blue-500' : error ? 'border-red-400 ring-red-50' : 'border-gray-100'
        }`}
      >
        <span className={`text-sm font-medium truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <Icons.ChevronDown size={18} />
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-500 font-semibold">{error}</p>}

      {isOpen && (
        <div className="absolute z-[200] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn origin-top">
          <div className="p-3 border-b border-gray-50">
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icons.Search size={16} />
              </div>
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors flex flex-col ${
                    value === opt.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className={`text-sm font-bold ${value === opt.id ? 'text-blue-700' : 'text-gray-900'}`}>
                    {opt.label}
                  </span>
                  {opt.description && (
                    <span className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 font-medium">
                      {opt.description}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-400 text-sm italic font-medium">
                No results found
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
};

export default SearchableDropdown;
