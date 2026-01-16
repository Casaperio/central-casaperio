import React from 'react';
import { Filter } from 'lucide-react';

export type ReservationStatus = 'CHECKIN' | 'CHECKOUT' | 'INHOUSE' | 'ALL';

interface StatusFilterProps {
  selectedStatuses: ReservationStatus[];
  onStatusChange: (statuses: ReservationStatus[]) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({
  selectedStatuses,
  onStatusChange,
}) => {
  const statuses = [
    { id: 'ALL' as ReservationStatus, label: 'Todos' },
    { id: 'CHECKIN' as ReservationStatus, label: 'Check-in' },
    { id: 'CHECKOUT' as ReservationStatus, label: 'Check-out' },
    { id: 'INHOUSE' as ReservationStatus, label: 'In-house' },
  ];

  const handleStatusToggle = (statusId: ReservationStatus) => {
    let newStatuses: ReservationStatus[];

    if (statusId === 'ALL') {
      // Se clicar em "Todos", seleciona apenas "Todos"
      newStatuses = ['ALL'];
    } else {
      // Remove "Todos" se estiver selecionado
      const withoutAll = selectedStatuses.filter(s => s !== 'ALL');
      
      // Toggle do status clicado
      if (withoutAll.includes(statusId)) {
        newStatuses = withoutAll.filter(s => s !== statusId);
        
        // Se ficar vazio, volta para "Todos"
        if (newStatuses.length === 0) {
          newStatuses = ['ALL'];
        }
      } else {
        newStatuses = [...withoutAll, statusId];
      }
    }

    onStatusChange(newStatuses);
  };

  const isSelected = (statusId: ReservationStatus): boolean => {
    return selectedStatuses.includes(statusId);
  };

  // Retorna classes de cor baseadas no status
  const getStatusColors = (statusId: ReservationStatus, selected: boolean): string => {
    if (selected) {
      switch (statusId) {
        case 'CHECKIN':
          return 'bg-green-600 text-white';
        case 'CHECKOUT':
          return 'bg-orange-600 text-white';
        case 'INHOUSE':
          return 'bg-blue-600 text-white';
        case 'ALL':
        default:
          return 'bg-[#02475F] text-white';
      }
    } else {
      // Todos ficam com a mesma cor padrão quando não selecionados
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter size={18} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Status da Reserva</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            key={status.id}
            onClick={() => handleStatusToggle(status.id)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${
              getStatusColors(status.id, isSelected(status.id))
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StatusFilter;
