import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
  border?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
};

export default function Card({
  children,
  title,
  padding = 'md',
  shadow = true,
  border = true
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-lg
        ${shadow ? 'shadow-sm' : ''}
        ${border ? 'border border-gray-200' : ''}
        ${paddingClasses[padding]}
      `}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
