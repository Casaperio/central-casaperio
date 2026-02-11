import React, { useMemo, useState } from 'react';
import { Home, X } from 'lucide-react';
import { Property } from '../../types';

interface PropertyFilterProps {
  selectedProperties: string[];
  setSelectedProperties: (properties: string[]) => void;
  properties: Property[];
  variant?: 'default' | 'panel';
}

export const PropertyFilter: React.FC<PropertyFilterProps> = ({
  selectedProperties,
  setSelectedProperties,
  properties,
  variant = 'default',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const availableProperties = useMemo(() => {
    return properties
      .filter(prop => prop.code)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [properties]);

  const filteredProperties = useMemo(() => {
    if (!searchTerm.trim()) return availableProperties;

    const term = searchTerm.toLowerCase();
    return availableProperties.filter(prop =>
      prop.code.toLowerCase().includes(term) ||
      prop.address?.toLowerCase().includes(term)
    );
  }, [availableProperties, searchTerm]);

  const toggleProperty = (propertyCode: string) => {
    const newSelection = selectedProperties.includes(propertyCode)
      ? selectedProperties.filter(p => p !== propertyCode)
      : [...selectedProperties, propertyCode];

    setSelectedProperties(newSelection);
  };

  const clearAll = () => {
    setSelectedProperties([]);
    setSearchTerm('');
    setIsOpen(false);
  };

  const selectedCount = selectedProperties.length;
  const displayText = selectedCount === 0
    ? 'Todos os imóveis'
    : `${selectedCount} imóve${selectedCount > 1 ? 'is' : 'l'} selecionado${selectedCount > 1 ? 's' : ''}`;

  const filterControl = (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-colors w-full"
      >
        <Home size={16} className="text-brand-500 flex-shrink-0" />
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

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-fade-in">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Filtrar por Imóvel
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

          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por código ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                autoFocus
              />
              <svg
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="py-1 max-h-64 overflow-y-auto">
            {filteredProperties.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                {searchTerm ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel disponível'}
              </div>
            ) : (
              filteredProperties.map((property) => {
                const isSelected = selectedProperties.includes(property.code);
                return (
                  <button
                    key={property.code}
                    onClick={() => toggleProperty(property.code)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                      isSelected
                        ? 'bg-brand-50 text-brand-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-brand-600 border-brand-600'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{property.code}</div>
                      {property.address && (
                        <div className="text-xs text-gray-500 truncate">
                          {property.address}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {filteredProperties.length > 0 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
              {filteredProperties.length === availableProperties.length
                ? `${availableProperties.length} imóve${availableProperties.length !== 1 ? 'is' : 'l'} disponíve${availableProperties.length !== 1 ? 'is' : 'l'}`
                : `${filteredProperties.length} de ${availableProperties.length} imóve${availableProperties.length !== 1 ? 'is' : 'l'}`
              }
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (variant === 'panel') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-full">
        <div className="flex items-center gap-2 mb-3">
          <Home size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Imóveis</span>
        </div>
        {filterControl}
      </div>
    );
  }

  return filterControl;
};
