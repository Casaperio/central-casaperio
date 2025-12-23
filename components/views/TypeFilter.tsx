import React from 'react';
import { Tag } from 'lucide-react';

interface TypeFilterProps {
  filterMaintenanceType: string;
  setFilterMaintenanceType: (type: string) => void;
}

export const TypeFilter: React.FC<TypeFilterProps> = ({
  filterMaintenanceType,
  setFilterMaintenanceType
}) => {
  return (
    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
      <Tag size={16} className="text-brand-500 flex-shrink-0" />
      <select
        value={filterMaintenanceType}
        onChange={(e) => setFilterMaintenanceType(e.target.value)}
        className="flex-1 text-sm text-gray-700 font-medium bg-transparent focus:outline-none cursor-pointer appearance-none pr-6"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.25rem center'
        }}
      >
        <option value="all">Todos os tipos</option>
        <option value="checkout">🚪 Checkout</option>
        <option value="preventive">🔧 Preventiva</option>
        <option value="guest">👤 Solicitação de Hóspede</option>
        <option value="regular">📋 Regular</option>
      </select>
    </div>
  );
};
