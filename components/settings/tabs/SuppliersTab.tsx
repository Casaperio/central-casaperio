import React, { useState, FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Supplier } from '../../../types';
import Card from '../../shared/Card';
import FormInput from '../../shared/FormInput';
import FormSelect from '../../shared/FormSelect';
import FormTextarea from '../../shared/FormTextarea';
import DeleteButton from '../../shared/DeleteButton';
import { generateId } from '../../../utils';

interface SuppliersTabProps {
  suppliers: Supplier[];
  serviceTypes: string[];
  onAddSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
}

export default function SuppliersTab({
  suppliers,
  serviceTypes,
  onAddSupplier,
  onDeleteSupplier
}: SuppliersTabProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category) return;

    onAddSupplier({
      id: generateId(),
      name,
      category,
      phone,
      email,
      notes,
      active: true
    });

    setName('');
    setCategory('');
    setPhone('');
    setEmail('');
    setNotes('');
  };

  const categoryOptions = serviceTypes.map(st => ({ value: st, label: st }));

  return (
    <div className="space-y-6">
      <Card title="Adicionar Fornecedor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Nome do Fornecedor"
            value={name}
            onChange={setName}
            required
          />

          <FormSelect
            label="Categoria"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            placeholder="Selecione uma categoria"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Telefone"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="(21) 99999-9999"
            />

            <FormInput
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="contato@fornecedor.com"
            />
          </div>

          <FormTextarea
            label="Observações"
            value={notes}
            onChange={setNotes}
            rows={2}
            placeholder="Informações adicionais..."
          />

          <button
            type="submit"
            className="w-full bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Adicionar Fornecedor
          </button>
        </form>
      </Card>

      <Card title="Fornecedores Cadastrados">
        <div className="space-y-2">
          {suppliers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum fornecedor cadastrado</p>
          ) : (
            suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
              >
                <div className="flex-1">
                  <div className="font-medium">{supplier.name}</div>
                  <div className="text-sm text-gray-500">{supplier.category}</div>
                  {supplier.phone && <div className="text-sm text-gray-500">{supplier.phone}</div>}
                  {supplier.email && <div className="text-sm text-gray-500">{supplier.email}</div>}
                </div>
                <DeleteButton
                  onDelete={() => onDeleteSupplier(supplier.id)}
                  confirmMessage={`Excluir fornecedor ${supplier.name}?`}
                  size="sm"
                />
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
