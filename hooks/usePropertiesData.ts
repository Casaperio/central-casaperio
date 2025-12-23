/**
 * Properties Data Hook
 * Fetches property data from stays-api (MongoDB)
 * Properties are synced from Stays.net to MongoDB via backend
 */

import { useState, useEffect, useCallback } from 'react';
import { getAllPropertiesCharacteristics, syncPropertiesFromStays, getPropertySyncStatus } from '../services/propertiesApiService';
import { PropertyCharacteristics } from '../types';

export function usePropertiesData() {
  const [properties, setProperties] = useState<PropertyCharacteristics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Load all properties from MongoDB
   */
  const loadProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getAllPropertiesCharacteristics({ active: true });
      console.log('✅ Loaded', data.length, 'properties from MongoDB');

      setProperties(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar imóveis';
      console.error('❌ Error loading properties:', err);
      setError(errorMessage);
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sync properties from Stays.net
   */
  const syncProperties = useCallback(async () => {
    try {
      setIsSyncing(true);
      console.log('🔄 Starting property sync from Stays.net...');

      // Trigger sync
      await syncPropertiesFromStays();

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30;

      const checkStatus = async (): Promise<void> => {
        const status = await getPropertySyncStatus();

        if (status.status === 'running' && attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 1000);
        } else if (status.status === 'success') {
          console.log(`✅ Sync completed: ${status.propertiesCount} properties in ${(status.durationMs / 1000).toFixed(1)}s`);

          // Reload properties
          await loadProperties();
          setIsSyncing(false);

          return;
        } else if (status.status === 'error') {
          throw new Error(status.lastError || 'Sync failed');
        } else {
          throw new Error('Sync timeout');
        }
      };

      // Start checking after 2 seconds
      setTimeout(checkStatus, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na sincronização';
      console.error('❌ Sync error:', err);
      setError(errorMessage);
      setIsSyncing(false);
      throw err;
    }
  }, [loadProperties]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  /**
   * Update a single property in local state (optimistic update)
   */
  const updatePropertyInState = useCallback((updatedProperty: PropertyCharacteristics) => {
    setProperties(prev => prev.map(p =>
      p.propertyId === updatedProperty.propertyId ? updatedProperty : p
    ));
  }, []);

  return {
    properties,
    isLoading,
    error,
    isSyncing,
    loadProperties,
    syncProperties,
    updatePropertyInState,
  };
}
