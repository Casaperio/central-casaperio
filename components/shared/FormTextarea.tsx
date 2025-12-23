import React from 'react';

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  showCounter?: boolean;
  required?: boolean;
  error?: string;
}

export default function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  showCounter = false,
  required = false,
  error
}: FormTextareaProps) {
  const currentLength = value.length;
  const showCount = showCounter && maxLength;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {showCount && (
          <span className="text-xs text-gray-500">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        required={required}
        className={`
          w-full p-2 border rounded-lg text-sm transition-colors resize-none
          focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      />

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
