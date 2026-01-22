import React, { useMemo } from 'react';
import { User, X } from 'lucide-react';
import { UserWithPassword } from '../../types';

interface AssigneeFilterProps {
  selectedAssignees: string[];
  setSelectedAssignees: (assignees: string[]) => void;
  allUsers: UserWithPassword[];
}

export const AssigneeFilter: React.FC<AssigneeFilterProps> = ({
  selectedAssignees,
  setSelectedAssignees,
  allUsers,
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

  // Filtrar usuários únicos e ativos
  const availableUsers = useMemo(() => {
    const seen = new Set<string>();
    return allUsers
      .filter(user => {
        const normalized = user.name.toLowerCase().trim();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allUsers]);

  const toggleAssignee = (userName: string) => {
    const newSelection = selectedAssignees.includes(userName)
      ? selectedAssignees.filter(a => a !== userName)
      : [...selectedAssignees, userName];
    
    console.log('🔧 AssigneeFilter - Toggle:', { userName, before: selectedAssignees, after: newSelection });
    setSelectedAssignees(newSelection);
  };

  const clearAll = () => {
    console.log('🔧 AssigneeFilter - Clear all');
    setSelectedAssignees([]);
    setIsOpen(false);
  };

  const selectedCount = selectedAssignees.length;
  const displayText = selectedCount === 0 
    ? 'Todos os responsáveis' 
    : `${selectedCount} responsável${selectedCount > 1 ? 'eis' : ''} selecionado${selectedCount > 1 ? 's' : ''}`;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-colors w-full min-w-[250px]"
      >
        <User size={16} className="text-brand-500 flex-shrink-0" />
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
              Filtrar por Responsável Técnico
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
          <div className="py-1 max-h-64 overflow-y-auto">
            {availableUsers.map((user) => {
              const isSelected = selectedAssignees.includes(user.name);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleAssignee(user.name)}
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
                  <span className="flex-1">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
