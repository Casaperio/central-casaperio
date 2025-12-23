import React, { useState, FormEvent } from 'react';
import { Check } from 'lucide-react';
import { InventoryItem, InventoryCategory } from '../../../types';
import Modal from '../../shared/Modal';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import FormTextarea from '../../shared/FormTextarea';

interface EditInventoryItemModalProps {
  item: InventoryItem;
  onSave: (item: InventoryItem) => void;
  onClose: () => void;
}

export default function EditInventoryItemModal({
  item,
  onSave,
  onClose
}: EditInventoryItemModalProps) {
  const [editedItem, setEditedItem] = useState<InventoryItem>(item);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(editedItem);
  };

  const categoryOptions = Object.values(InventoryCategory).map(c => ({
    value: c,
    label: c
  }));

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Editar Produto"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 flex items-center gap-2"
          >
            <Check size={16} /> Salvar
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormSelect
          label="Categoria"
          value={editedItem.category}
          onChange={(value) => setEditedItem({ ...editedItem, category: value as InventoryCategory })}
          options={categoryOptions}
          required
        />

        <FormInput
          label="Nome"
          value={editedItem.name}
          onChange={(value) => setEditedItem({ ...editedItem, name: value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Marca"
            value={editedItem.brand || ''}
            onChange={(value) => setEditedItem({ ...editedItem, brand: value })}
          />

          <FormInput
            label="Modelo"
            value={editedItem.model || ''}
            onChange={(value) => setEditedItem({ ...editedItem, model: value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Tamanho/Dimensão"
            value={editedItem.dimensions || ''}
            onChange={(value) => setEditedItem({ ...editedItem, dimensions: value })}
          />

          <FormInput
            label="Estoque Mínimo"
            type="number"
            value={String(editedItem.minStock)}
            onChange={(value) => setEditedItem({ ...editedItem, minStock: Number(value) })}
            required
          />
        </div>

        <FormTextarea
          label="Descrição"
          value={editedItem.description || ''}
          onChange={(value) => setEditedItem({ ...editedItem, description: value })}
          rows={2}
        />
      </form>
    </Modal>
  );
}
