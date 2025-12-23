/**
 * Hook for inventory data management
 * Provides polling-based updates from stays-api
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { InventoryItem, InventoryTransaction, TransactionType } from '../types';
import { inventoryApiService } from '../services/inventoryApiService';

const POLL_INTERVAL = 30000; // 30 seconds

interface UseInventoryDataResult {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => Promise<InventoryItem>;
  updateItem: (item: InventoryItem) => Promise<InventoryItem>;
  deleteItem: (id: string) => Promise<void>;
  createTransaction: (tx: {
    itemId: string;
    type: TransactionType;
    quantity: number;
    source: string;
    destination: string;
    user: string;
    notes?: string;
  }) => Promise<void>;
}

export function useInventoryData(): UseInventoryDataResult {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstLoad = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      // Only show loading on first fetch
      if (isFirstLoad.current) {
        setLoading(true);
      }

      const [fetchedItems, fetchedTransactions] = await Promise.all([
        inventoryApiService.getItems(),
        inventoryApiService.getTransactions(),
      ]);

      setItems(fetchedItems);
      setTransactions(fetchedTransactions);
      setError(null);
      isFirstLoad.current = false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar dados do inventário';
      setError(message);
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchData();

    // Set up polling
    pollRef.current = setInterval(fetchData, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchData]);

  // Create item
  const createItem = useCallback(
    async (item: Omit<InventoryItem, 'id' | 'updatedAt'>): Promise<InventoryItem> => {
      const newItem = await inventoryApiService.createItem(item);
      // Update local state optimistically
      setItems((prev) => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
      return newItem;
    },
    []
  );

  // Update item
  const updateItem = useCallback(async (item: InventoryItem): Promise<InventoryItem> => {
    const updated = await inventoryApiService.updateItem(item);
    // Update local state
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    return updated;
  }, []);

  // Delete item
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    await inventoryApiService.deleteItem(id);
    // Update local state
    setItems((prev) => prev.filter((i) => i.id !== id));
    // Also remove transactions for this item from local state
    setTransactions((prev) => prev.filter((t) => t.itemId !== id));
  }, []);

  // Create transaction
  const createTransaction = useCallback(
    async (tx: {
      itemId: string;
      type: TransactionType;
      quantity: number;
      source: string;
      destination: string;
      user: string;
      notes?: string;
    }): Promise<void> => {
      const result = await inventoryApiService.createTransaction(tx);
      // Update local state with the new transaction and updated item
      setTransactions((prev) => [result.transaction, ...prev]);
      setItems((prev) => prev.map((i) => (i.id === result.updatedItem.id ? result.updatedItem : i)));
    },
    []
  );

  return {
    items,
    transactions,
    loading,
    error,
    refresh: fetchData,
    createItem,
    updateItem,
    deleteItem,
    createTransaction,
  };
}
