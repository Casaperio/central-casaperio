import React, { useState, FormEvent } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import Card from '../../shared/Card';
import FormInput from '../../shared/FormInput';
import DeleteButton from '../../shared/DeleteButton';

interface ServicesTabProps {
  serviceTypes: string[];
  onAddServiceType: (serviceType: string) => void;
  onDeleteServiceType: (serviceType: string) => void;
  onUpdateServiceType: (oldName: string, newName: string, defaultPrice?: number) => void;
  onEditService?: (serviceType: { name: string; defaultPrice?: number }) => void;
}

export default function ServicesTab({
  serviceTypes,
  onAddServiceType,
  onDeleteServiceType,
  onEditService
}: ServicesTabProps) {
  const [newItem, setNewItem] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    onAddServiceType(newItem);
    setNewItem('');
    setNewPrice('');
  };

  return (
    <Card title="Tipos de Serviço">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Novo Tipo de Serviço"
            value={newItem}
            onChange={setNewItem}
            placeholder="Ex: Hidráulica"
            required
          />

          <FormInput
            label="Preço Padrão (R$)"
            type="number"
            value={newPrice}
            onChange={setNewPrice}
            placeholder="0.00"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Adicionar
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {serviceTypes.map((serviceType) => (
          <div
            key={serviceType}
            className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
          >
            <span className="font-medium">{serviceType}</span>
            <div className="flex items-center gap-2">
              {onEditService && (
                <button
                  onClick={() => onEditService({ name: serviceType })}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  aria-label="Editar"
                >
                  <Edit2 size={14} />
                </button>
              )}
              <DeleteButton
                onDelete={() => onDeleteServiceType(serviceType)}
                confirmMessage={`Excluir tipo "${serviceType}"?`}
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
