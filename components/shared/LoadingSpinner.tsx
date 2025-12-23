import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
}

export default function LoadingSpinner({
  size = 24,
  text
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <Loader2 size={size} className="animate-spin text-brand-600" />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );
}
