import React, { useState, FormEvent } from 'react';
import { Plus } from 'lucide-react';
import Card from '../../shared/Card';
import FormInput from '../../shared/FormInput';
import DeleteButton from '../../shared/DeleteButton';

interface PrioritiesTabProps {
  priorities: string[];
  onAddPriority: (priority: string) => void;
  onDeletePriority: (priority: string) => void;
}

export default function PrioritiesTab({
  priorities,
  onAddPriority,
  onDeletePriority
}: PrioritiesTabProps) {
  const [newItem, setNewItem] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    onAddPriority(newItem);
    setNewItem('');
  };

  return (
    <Card title="Prioridades">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Nova Prioridade"
          value={newItem}
          onChange={setNewItem}
          placeholder="Ex: Urgente"
          required
        />

        <button
          type="submit"
          className="w-full bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Adicionar
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {priorities.map((priority) => (
          <div
            key={priority}
            className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
          >
            <span className="font-medium">{priority}</span>
            <DeleteButton
              onDelete={() => onDeletePriority(priority)}
              confirmMessage={`Excluir prioridade "${priority}"?`}
              size="sm"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
