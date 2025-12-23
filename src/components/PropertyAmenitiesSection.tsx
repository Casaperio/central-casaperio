import React, { useEffect, useState } from 'react';
import { Package, Link2, Sparkles, Plus } from 'lucide-react';

// Use Vite proxy in development, production URL in production
const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'https://stays-api.onrender.com');
const API_KEY = import.meta.env.VITE_API_KEY || '';

interface PropertyAmenity {
  stays_amenity_id: string;
  name: {
    pt_BR: string;
    en_US: string;
  };
  description?: {
    pt_BR?: string;
    en_US?: string;
  };
  category?: string;
  icon?: string;
  linked_inventory_item_id?: string;
  suggested_inventory_items?: string[];
  last_verified: Date;
}

interface PropertyAmenitiesSectionProps {
  propertyCode: string;
}

export function PropertyAmenitiesSection({ propertyCode }: PropertyAmenitiesSectionProps) {
  const [amenities, setAmenities] = useState<PropertyAmenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAmenities();
  }, [propertyCode]);

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/v1/inventory/property-amenities/${propertyCode}`,
        {
          headers: {
            'X-API-Key': API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch property amenities');
      }

      const data = await response.json();
      setAmenities(data.amenities || []);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error fetching property amenities:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-red-800 text-sm">Erro ao carregar amenidades: {error}</p>
      </div>
    );
  }

  if (!amenities.length) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-gray-600 text-sm">
          Nenhuma amenidade encontrada para esta propriedade. Execute a sincronização para atualizar.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-purple-600" />
        Amenidades da Propriedade ({amenities.length})
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {amenities.map((amenity, index) => (
          <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{amenity.name.pt_BR}</div>
                {amenity.name.en_US !== amenity.name.pt_BR && (
                  <div className="text-sm text-gray-600 italic">{amenity.name.en_US}</div>
                )}
                {amenity.category && (
                  <div className="text-xs text-gray-500 mt-1">
                    Categoria: <span className="capitalize">{amenity.category}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                {amenity.linked_inventory_item_id ? (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1 whitespace-nowrap">
                    <Link2 className="w-3 h-3" />
                    Vinculado
                  </span>
                ) : amenity.suggested_inventory_items && amenity.suggested_inventory_items.length > 0 ? (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1 whitespace-nowrap">
                    <Sparkles className="w-3 h-3" />
                    {amenity.suggested_inventory_items.length} sugestões
                  </span>
                ) : (
                  <button className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 flex items-center gap-1 whitespace-nowrap transition-colors">
                    <Plus className="w-3 h-3" />
                    Criar Item
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-purple-200 text-xs text-gray-600">
        💡 <strong>Dica:</strong> Amenidades vinculadas aparecem automaticamente no inventário.
        Clique em "Criar Item" para adicionar amenidades ao controle de estoque.
      </div>
    </div>
  );
}
