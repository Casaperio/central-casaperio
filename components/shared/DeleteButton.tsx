import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteButtonProps {
  onDelete: () => void;
  confirmMessage?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function DeleteButton({
  onDelete,
  confirmMessage = 'Tem certeza que deseja excluir?',
  disabled = false,
  size = 'md'
}: DeleteButtonProps) {
  const handleClick = () => {
    if (window.confirm(confirmMessage)) {
      onDelete();
    }
  };

  const sizeClass = size === 'sm' ? 'p-1' : 'p-2';
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${sizeClass}
        text-red-600 hover:bg-red-50 rounded-lg transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      aria-label="Excluir"
    >
      <Trash2 size={iconSize} />
    </button>
  );
}
