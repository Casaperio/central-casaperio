import React, { useState, FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Property } from '../../../types';
import Card from '../../shared/Card';
import FormInput from '../../shared/FormInput';
import DeleteButton from '../../shared/DeleteButton';

interface PropertiesTabProps {
  properties: Property[];
  onAddProperty: (code: string, address: string) => void;
  onDeleteProperty: (code: string) => void;
}

export default function PropertiesTab({
  properties,
  onAddProperty,
  onDeleteProperty
}: PropertiesTabProps) {
  const [newCode, setNewCode] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newAddress.trim()) return;

    onAddProperty(newCode, newAddress);

    setNewCode('');
    setNewAddress('');
  };

  return (
    <div className="space-y-6">
      <Card title="Adicionar Imóvel">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Código"
              value={newCode}
              onChange={setNewCode}
              placeholder="501A"
              required
            />

            <FormInput
              label="Endereço"
              value={newAddress}
              onChange={setNewAddress}
              placeholder="Rua X, 123"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Adicionar Imóvel
          </button>
        </form>
      </Card>

      <Card title="Imóveis Cadastrados">
        <div className="space-y-2">
          {properties.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum imóvel cadastrado</p>
          ) : (
            properties.map((prop) => (
              <div
                key={prop.code}
                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
              >
                <div>
                  <span className="font-medium">{prop.code}</span>
                  <span className="text-gray-500 text-sm ml-2">{prop.address}</span>
                </div>
                <DeleteButton
                  onDelete={() => onDeleteProperty(prop.code)}
                  confirmMessage={`Excluir imóvel ${prop.code}?`}
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
