import React from 'react';

const WEEKDAYS = [
  { key: 'dom', label: 'Dom' },
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' }
];

interface WeekdaySelectorProps {
  selectedDays: string[];
  onChange: (days: string[]) => void;
}

export default function WeekdaySelector({
  selectedDays,
  onChange
}: WeekdaySelectorProps) {
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  return (
    <div className="flex gap-2">
      {WEEKDAYS.map((day) => {
        const isSelected = selectedDays.includes(day.key);

        return (
          <button
            key={day.key}
            type="button"
            onClick={() => toggleDay(day.key)}
            className={`
              w-10 h-10 rounded-full text-sm font-medium transition-colors
              ${
                isSelected
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
            aria-label={day.label}
            aria-pressed={isSelected}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}
