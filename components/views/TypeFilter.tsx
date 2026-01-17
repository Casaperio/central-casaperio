import React from 'react';
import { Tag, X } from 'lucide-react';

interface TypeFilterProps {
  filterMaintenanceType: string[];
  setFilterMaintenanceType: (types: string[]) => void;
}

const maintenanceTypes = [
  { value: 'checkout', label: '🚪 Checkout', color: 'violet' },
  { value: 'preventive', label: '🔧 Preventiva', color: 'blue' },
  { value: 'guest', label: '👤 Solicitação de Hóspede', color: 'yellow' },
  { value: 'regular', label: '📋 Regular', color: 'gray' }
];

export const TypeFilter: React.FC<TypeFilterProps> = ({
  filterMaintenanceType,
  setFilterMaintenanceType
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleType = (type: string) => {
    if (filterMaintenanceType.includes(type)) {
      setFilterMaintenanceType(filterMaintenanceType.filter(t => t !== type));
    } else {
      setFilterMaintenanceType([...filterMaintenanceType, type]);
    }
  };

  const clearAll = () => {
    setFilterMaintenanceType([]);
    setIsOpen(false);
  };

  const selectedCount = filterMaintenanceType.length;
  const displayText = selectedCount === 0 
    ? 'Todos os tipos' 
    : `${selectedCount} tipo${selectedCount > 1 ? 's' : ''} selecionado${selectedCount > 1 ? 's' : ''}`;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-colors w-full min-w-[250px]"
      >
        <Tag size={16} className="text-brand-500 flex-shrink-0" />
        <span className="flex-1 text-left text-sm text-gray-700 font-medium">
          {displayText}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Tipos de Manutenção
            </span>
            {selectedCount > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Limpar seleção
              </button>
            )}
          </div>

          {/* Options */}
          <div className="py-1">
            {maintenanceTypes.map((type) => {
              const isSelected = filterMaintenanceType.includes(type.value);
              return (
                <button
                  key={type.value}
                  onClick={() => toggleType(type.value)}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                    isSelected 
                      ? 'bg-brand-50 text-brand-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected 
                      ? 'bg-brand-500 border-brand-500' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Chips */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {filterMaintenanceType.map((typeValue) => {
            const type = maintenanceTypes.find(t => t.value === typeValue);
            if (!type) return null;
            
            return (
              <span
                key={typeValue}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-brand-100 text-brand-700 border border-brand-200"
              >
                {type.label}
                <button
                  onClick={() => toggleType(typeValue)}
                  className="hover:bg-brand-200 rounded-full p-0.5 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
