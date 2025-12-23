import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../tests/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryTransactions,
  createInventoryTransaction,
  getReferenceCategories,
  getReferenceItems,
  syncReferenceData,
  syncStaysData,
  getAllReferenceData,
  getSyncStatus
} from './inventoryApiService';
import { InventoryCategory, TransactionType } from '../types';

describe('inventoryApiService', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('Inventory Items', () => {
    it('should fetch all inventory items', async () => {
      server.use(
        http.get(/.*\/api\/v1\/inventory\/items/, () => {
          return HttpResponse.json({
            items: [
              {
                id: 'item-1',
                _id: 'item-1',
                name: 'Toalha',
                category: 'LINEN',
                minStock: 10,
                stock: { 'Central': 50 },
                createdAt: '2025-01-01',
                updatedAt: '2025-01-01'
              }
            ]
          });
        })
      );

      const result = await getInventoryItems();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Toalha');
    });

    it('should fetch single inventory item', async () => {
      server.use(
        http.get(/.*\/api\/v1\/inventory\/items\/item-1/, () => {
          return HttpResponse.json({
            item: {
              id: 'item-1',
              _id: 'item-1',
              name: 'Shampoo',
              category: 'AMENITY',
              minStock: 20,
              stock: { 'Central': 100 },
              createdAt: '2025-01-01',
              updatedAt: '2025-01-01'
            }
          });
        })
      );

      const result = await getInventoryItem('item-1');

      expect(result.id).toBe('item-1');
      expect(result.name).toBe('Shampoo');
    });

    it('should create inventory item', async () => {
      server.use(
        http.post(/.*\/api\/v1\/inventory\/items/, () => {
          return HttpResponse.json({
            item: {
              id: 'new-id',
              _id: 'new-id',
              name: 'New Item',
              category: 'ELECTRONICS',
              minStock: 2,
              stock: { 'Central': 5 },
              createdAt: '2025-12-20',
              updatedAt: '2025-12-20'
            }
          });
        })
      );

      const result = await createInventoryItem({
        name: 'New Item',
        category: InventoryCategory.ELECTRONICS,
        minStock: 2,
        stock: { 'Central': 5 },
        location: 'Central'
      });

      expect(result.id).toBe('new-id');
    });

    it('should update inventory item', async () => {
      server.use(
        http.put(/.*\/api\/v1\/inventory\/items\/item-1/, () => {
          return HttpResponse.json({
            item: {
              id: 'item-1',
              _id: 'item-1',
              name: 'Updated',
              category: 'LINEN',
              minStock: 15,
              stock: { 'Central': 60 },
              createdAt: '2025-01-01',
              updatedAt: '2025-12-20'
            }
          });
        })
      );

      const result = await updateInventoryItem({
        id: 'item-1',
        name: 'Updated',
        category: InventoryCategory.LINEN,
        minStock: 15,
        stock: { 'Central': 60 },
        location: 'Central'
      } as any);

      expect(result.name).toBe('Updated');
    });

  });

  describe('Inventory Transactions', () => {
    it('should fetch all transactions', async () => {
      server.use(
        http.get(/.*\/api\/v1\/inventory\/transactions/, () => {
          return HttpResponse.json({
            transactions: [
              {
                id: 'tx-1',
                _id: 'tx-1',
                itemId: 'item-1',
                type: 'ADDITION',
                quantity: 10,
                location: 'Central',
                userId: 'user-1',
                timestamp: '2025-12-20T00:00:00Z'
              }
            ]
          });
        })
      );

      const result = await getInventoryTransactions();

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(10);
    });

    it('should fetch transactions for specific item', async () => {
      server.use(
        http.get(/.*\/api\/v1\/inventory\/transactions/, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('itemId')).toBe('item-1');

          return HttpResponse.json({
            transactions: []
          });
        })
      );

      const result = await getInventoryTransactions('item-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('Reference Data', () => {
    it('should sync reference data', async () => {
      server.use(
        http.post(/.*\/api\/v1\/inventory\/reference\/sync/, () => {
          return HttpResponse.json({ success: true });
        })
      );

      const result = await syncReferenceData();

      expect(result.success).toBe(true);
    });

    it('should fetch all reference data', async () => {
      server.use(
        http.get(/.*\/api\/v1\/inventory\/reference/, () => {
          return HttpResponse.json({
            categories: [{ key: 'LINEN', label: 'Lençóis' }],
            items: [{ id: '1', name: 'Toalha' }],
            conditions: [{ key: 'NEW', label: 'Novo' }],
            amenities: [{ amenityId: 'wifi', amenityName: 'WiFi' }]
          });
        })
      );

      const result = await getAllReferenceData();

      expect(result.categories).toHaveLength(1);
      expect(result.items).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      server.use(
        http.get(/.*\/api\/v1\/inventory\/items/, () => {
          return HttpResponse.json({ message: 'Server error' }, { status: 500 });
        })
      );

      await expect(getInventoryItems()).rejects.toThrow('Server error');
    });
  });
});
