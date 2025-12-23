import React from 'react';
import { Edit2 } from 'lucide-react';
import { InventoryItem } from '../../../types';
import Card from '../../shared/Card';
import DeleteButton from '../../shared/DeleteButton';
import EmptyState from '../../shared/EmptyState';

interface CatalogTabProps {
  inventoryItems: InventoryItem[];
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function CatalogTab({
  inventoryItems,
  onUpdateItem,
  onDeleteItem
}: CatalogTabProps) {
  return (
    <Card title="Catálogo de Produtos">
      <p className="text-sm text-gray-600 mb-4">
        Para adicionar novos produtos, use a aba Inventário.
      </p>

      {inventoryItems.length === 0 ? (
        <EmptyState title="Nenhum produto cadastrado" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nome</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Categoria</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Estoque Min</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.minStock}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onUpdateItem(item)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        aria-label="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <DeleteButton
                        onDelete={() => onDeleteItem(item.id)}
                        confirmMessage={`Excluir ${item.name}?`}
                        size="sm"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
