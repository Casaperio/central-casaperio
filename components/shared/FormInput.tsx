import React, { ReactNode } from 'react';

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon?: ReactNode;
}

export default function FormInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  error,
  icon
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`
            w-full p-2 border rounded-lg text-sm transition-colors
            focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none
            ${icon ? 'pl-10' : 'pl-3'}
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
