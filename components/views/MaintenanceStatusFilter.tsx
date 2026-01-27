import React from 'react';
import { CheckCircle2, Filter } from 'lucide-react';

interface MaintenanceStatusFilterProps {
  selectedStatus: 'all' | 'in_progress';
  setSelectedStatus: (status: 'all' | 'in_progress') => void;
}

export const MaintenanceStatusFilter: React.FC<MaintenanceStatusFilterProps> = ({
  selectedStatus,
  setSelectedStatus
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

  const statusOptions = [
    { value: 'all' as const, label: 'Todos', description: 'Exibir todos os chamados' },
    { value: 'in_progress' as const, label: 'Em andamento', description: 'Somente não concluídos' }
  ];

  const selectStatus = (status: 'all' | 'in_progress') => {
    console.log('🎯 MaintenanceStatusFilter - Mudando status:', { from: selectedStatus, to: status });
    setSelectedStatus(status);
    setIsOpen(false);
  };

  const selectedOption = statusOptions.find(opt => opt.value === selectedStatus);
  const displayText = selectedOption?.label || 'Todos';

  console.log('🎯 MaintenanceStatusFilter - Render:', { selectedStatus, displayText });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-colors w-full"
      >
        <Filter size={16} className="text-brand-500 flex-shrink-0" />
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
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status do Chamado
            </span>
          </div>

          {/* Options */}
          <div className="py-1">
            {statusOptions.map((option) => {
              const isSelected = selectedStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => selectStatus(option.value)}
                  className={`w-full px-3 py-2.5 text-left text-sm flex items-start gap-2 transition-colors ${
                    isSelected 
                      ? 'bg-brand-50 text-brand-700 font-medium' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isSelected ? (
                      <CheckCircle2 size={16} className="text-brand-600" />
                    ) : (
                      <div className="w-4 h-4 rounded border border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
