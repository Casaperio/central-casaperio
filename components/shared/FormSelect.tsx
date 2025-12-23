import React from 'react';

export interface Option {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  required?: boolean;
  placeholder?: string;
  error?: string;
}

export default function FormSelect({
  label,
  value,
  onChange,
  options,
  required = false,
  placeholder,
  error
}: FormSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`
          w-full p-2 border rounded-lg text-sm transition-colors
          focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
