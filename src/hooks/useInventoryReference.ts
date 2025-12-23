import { useState, useEffect } from 'react';

// Use Vite proxy in development, production URL in production
const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'https://stays-api.onrender.com');
const API_KEY = import.meta.env.VITE_API_KEY || '';

interface ReferenceCategory {
  id: string;
  name: string;
  nameEn: string;
}

interface ReferenceItem {
  id: string;
  categoryId?: string;
  name: string;
  nameEn: string;
}

interface ReferenceCondition {
  id: string;
  name: string;
  nameEn: string;
}

interface ReferenceAmenity {
  id: string;
  name: string;
  nameEn: string;
  category?: string;
  icon?: string;
}

interface UseInventoryReferenceReturn {
  categories: ReferenceCategory[];
  items: ReferenceItem[];
  conditions: ReferenceCondition[];
  amenities: ReferenceAmenity[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch Stays.net reference data for inventory
 * Provides categories, items, conditions, and amenities for autocomplete
 */
export function useInventoryReference(): UseInventoryReferenceReturn {
  const [categories, setCategories] = useState<ReferenceCategory[]>([]);
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [conditions, setConditions] = useState<ReferenceCondition[]>([]);
  const [amenities, setAmenities] = useState<ReferenceAmenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/v1/inventory/reference-data`, {
        headers: {
          'X-API-Key': API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reference data');
      }

      const data = await response.json();

      // Transform data for frontend consumption
      setCategories(
        (data.categories || []).map((c: any) => ({
          id: c.stays_category_id,
          name: c.names.pt_BR,
          nameEn: c.names.en_US
        }))
      );

      setItems(
        (data.items || []).map((i: any) => ({
          id: i.stays_item_id,
          categoryId: i.stays_category_id,
          name: i.names.pt_BR,
          nameEn: i.names.en_US
        }))
      );

      setConditions(
        (data.conditions || []).map((c: any) => ({
          id: c.stays_condition_id,
          name: c.names.pt_BR,
          nameEn: c.names.en_US
        }))
      );

      setAmenities(
        (data.amenities || []).map((a: any) => ({
          id: a.stays_amenity_id,
          name: a.names.pt_BR,
          nameEn: a.names.en_US,
          category: a.category,
          icon: a.icon
        }))
      );
    } catch (err) {
      setError((err as Error).message);
      console.error('Error fetching reference data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    categories,
    items,
    conditions,
    amenities,
    loading,
    error,
    refresh: fetchData
  };
}
