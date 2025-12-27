import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { PeriodPreset } from '../hooks/usePeriodFilter';

interface PeriodFilterProps {
  preset: PeriodPreset;
  from: string;
  to: string;
  onPresetChange: (preset: PeriodPreset) => void;
  onCustomPeriodChange: (from: string, to: string) => void;
}

const PRESET_LABELS: Record<PeriodPreset, string> = {
  'current-month': 'Mês Atual',
  'last-30-days': 'Últimos 30 Dias',
  'ytd': 'YTD (Ano até Hoje)',
  'last-12-months': 'Últimos 12 Meses',
  'custom': 'Personalizado',
};

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  preset,
  from,
  to,
  onPresetChange,
  onCustomPeriodChange,
}) => {
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const [showCustomInputs, setShowCustomInputs] = useState(preset === 'custom');

  const handlePresetClick = (newPreset: PeriodPreset) => {
    if (newPreset === 'custom') {
      setShowCustomInputs(true);
    } else {
      setShowCustomInputs(false);
      onPresetChange(newPreset);
    }
  };

  const handleApplyCustom = () => {
    if (customFrom && customTo) {
      onCustomPeriodChange(customFrom, customTo);
    }
  };

  return (
    <div className="bg-white p-4 rounded-none border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={16} className="text-gray-600" />
        <h4 className="text-sm font-semibold text-gray-700">Período</h4>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(Object.keys(PRESET_LABELS) as PeriodPreset[]).map((presetKey) => (
          <button
            key={presetKey}
            onClick={() => handlePresetClick(presetKey)}
            className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
              preset === presetKey
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400 hover:bg-brand-50'
            }`}
          >
            {PRESET_LABELS[presetKey]}
          </button>
        ))}
      </div>

      {/* Custom Period Inputs */}
      {showCustomInputs && (
        <div className="flex flex-col sm:flex-row gap-2 mt-3 p-3 bg-gray-50 rounded border border-gray-200">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Data Inicial</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Data Final</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyCustom}
              disabled={!customFrom || !customTo}
              className="px-4 py-1.5 text-sm font-medium bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Current Period Display */}
      <div className="text-xs text-gray-500 mt-3">
        Período selecionado: <span className="font-medium text-gray-700">
          {new Date(from).toLocaleDateString('pt-BR')} até {new Date(to).toLocaleDateString('pt-BR')}
        </span>
      </div>
    </div>
  );
};
