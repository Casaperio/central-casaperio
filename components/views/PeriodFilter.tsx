import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export type PeriodPreset = 'all' | 'today' | '7days' | '30days' | 'thisMonth' | 'custom';

interface PeriodFilterProps {
  selectedPreset: PeriodPreset;
  customStartDate: string;
  customEndDate: string;
  onPresetChange: (preset: PeriodPreset) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({
  selectedPreset,
  customStartDate,
  customEndDate,
  onPresetChange,
  onCustomDateChange,
}) => {
  const [localStartDate, setLocalStartDate] = useState(customStartDate);
  const [localEndDate, setLocalEndDate] = useState(customEndDate);

  useEffect(() => {
    setLocalStartDate(customStartDate);
    setLocalEndDate(customEndDate);
  }, [customStartDate, customEndDate]);

  const handlePresetClick = (preset: PeriodPreset) => {
    onPresetChange(preset);
  };

  const handleDateChange = () => {
    if (localStartDate && localEndDate) {
      onCustomDateChange(localStartDate, localEndDate);
    }
  };

  const presets = [
    { id: 'all' as PeriodPreset, label: 'Todos' },
    { id: 'today' as PeriodPreset, label: 'Hoje' },
    { id: '7days' as PeriodPreset, label: '7 dias' },
    { id: '30days' as PeriodPreset, label: '30 dias' },
    { id: 'thisMonth' as PeriodPreset, label: 'Este mês' },
    { id: 'custom' as PeriodPreset, label: 'Personalizado' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={18} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Período</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              selectedPreset === preset.id
                ? 'bg-brand-600 text-white font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {selectedPreset === 'custom' && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                onBlur={handleDateChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                onBlur={handleDateChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodFilter;
