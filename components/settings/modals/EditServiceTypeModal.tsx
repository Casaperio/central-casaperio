import React, { useState, FormEvent } from 'react';
import { Check } from 'lucide-react';
import Modal from '../../shared/Modal';
import FormInput from '../../shared/FormInput';

interface EditServiceTypeModalProps {
  serviceType: { name: string; defaultPrice?: number };
  onSave: (name: string, price?: number) => void;
  onClose: () => void;
}

export default function EditServiceTypeModal({
  serviceType,
  onSave,
  onClose
}: EditServiceTypeModalProps) {
  const [name, setName] = useState(serviceType.name);
  const [price, setPrice] = useState(serviceType.defaultPrice?.toString() || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(name, price ? Number(price) : undefined);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Editar Tipo de Serviço"
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
        <FormInput
          label="Nome do Serviço"
          value={name}
          onChange={setName}
          required
        />

        <FormInput
          label="Preço Padrão (opcional)"
          type="number"
          value={price}
          onChange={setPrice}
          placeholder="0.00"
        />
      </form>
    </Modal>
  );
}
