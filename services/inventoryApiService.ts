/**
 * Inventory API Service
 * Communicates with the stays-api backend for inventory management
 */

import { InventoryItem, InventoryTransaction, InventoryCategory, TransactionType } from '../types';

// In development, use Vite proxy; in production, use env variable
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? '' : (import.meta.env.VITE_API_BASE_URL || 'https://stays-api.onrender.com');
const API_KEY = import.meta.env.VITE_API_KEY || '';

// ============ API Fetch Helper ============

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string>;
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url: string;

  if (isDev) {
    url = endpoint;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
  } else {
    const fullUrl = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        fullUrl.searchParams.append(key, value);
      });
    }
    url = fullUrl.toString();
  }

  const headers: Record<string, string> = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.message || `API Error: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

// ============ API Response Types ============

interface ApiInventoryItem {
  id: string;
  _id: string;
  name: string;
  brand?: string;
  model?: string;
  dimensions?: string;
  description?: string;
  category: string; // Backend sends key like 'LINEN', 'ELECTRONICS'
  minStock: number;
  stock: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface ApiInventoryTransaction {
  id: string;
  _id: string;
  itemId: string;
  itemName: string;
  type: string; // Backend sends key like 'PURCHASE', 'TRANSFER'
  quantity: number;
  source: string;
  destination: string;
  user: string;
  notes?: string;
  timestamp: string;
  createdAt: string;
}

// ============ Category/Type Mapping ============

// Map backend category keys to frontend enum values
const categoryKeyToEnum: Record<string, InventoryCategory> = {
  'LINEN': InventoryCategory.LINEN,
  'ELECTRONICS': InventoryCategory.ELECTRONICS,
  'AMENITY': InventoryCategory.AMENITY,
  'FURNITURE': InventoryCategory.FURNITURE,
  'UTENSIL': InventoryCategory.UTENSIL,
  'OTHER': InventoryCategory.OTHER,
};

// Map frontend enum values back to backend keys
const enumToCategoryKey: Record<InventoryCategory, string> = {
  [InventoryCategory.LINEN]: 'LINEN',
  [InventoryCategory.ELECTRONICS]: 'ELECTRONICS',
  [InventoryCategory.AMENITY]: 'AMENITY',
  [InventoryCategory.FURNITURE]: 'FURNITURE',
  [InventoryCategory.UTENSIL]: 'UTENSIL',
  [InventoryCategory.OTHER]: 'OTHER',
};

// Map backend transaction type keys to frontend enum values
const typeKeyToEnum: Record<string, TransactionType> = {
  'PURCHASE': TransactionType.PURCHASE,
  'TRANSFER': TransactionType.TRANSFER,
  'CONSUMPTION': TransactionType.CONSUMPTION,
  'BREAKAGE': TransactionType.BREAKAGE,
  'LOSS': TransactionType.LOSS,
  'ADJUSTMENT': TransactionType.ADJUSTMENT,
};

// Map frontend enum values back to backend keys
const enumToTypeKey: Record<TransactionType, string> = {
  [TransactionType.PURCHASE]: 'PURCHASE',
  [TransactionType.TRANSFER]: 'TRANSFER',
  [TransactionType.CONSUMPTION]: 'CONSUMPTION',
  [TransactionType.BREAKAGE]: 'BREAKAGE',
  [TransactionType.LOSS]: 'LOSS',
  [TransactionType.ADJUSTMENT]: 'ADJUSTMENT',
};

// ============ Transform Functions ============

function transformApiItem(apiItem: ApiInventoryItem): InventoryItem {
  return {
    id: apiItem.id || apiItem._id,
    name: apiItem.name,
    brand: apiItem.brand,
    model: apiItem.model,
    dimensions: apiItem.dimensions,
    description: apiItem.description,
    category: categoryKeyToEnum[apiItem.category] || InventoryCategory.OTHER,
    minStock: apiItem.minStock,
    stock: apiItem.stock,
    updatedAt: new Date(apiItem.updatedAt).getTime(),
  };
}

function transformApiTransaction(apiTx: ApiInventoryTransaction): InventoryTransaction {
  return {
    id: apiTx.id || apiTx._id,
    itemId: apiTx.itemId,
    itemName: apiTx.itemName,
    type: typeKeyToEnum[apiTx.type] || TransactionType.ADJUSTMENT,
    quantity: apiTx.quantity,
    source: apiTx.source,
    destination: apiTx.destination,
    user: apiTx.user,
    notes: apiTx.notes,
    timestamp: new Date(apiTx.timestamp).getTime(),
  };
}

// ============ API Functions ============

/**
 * Get all inventory items
 */
export async function getInventoryItems(): Promise<InventoryItem[]> {
  const response = await fetchApi<{ items: ApiInventoryItem[] }>('/api/v1/inventory/items');
  return response.items.map(transformApiItem);
}

/**
 * Get a single inventory item
 */
export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const response = await fetchApi<{ item: ApiInventoryItem }>(`/api/v1/inventory/items/${id}`);
  return transformApiItem(response.item);
}

/**
 * Create a new inventory item
 */
export async function createInventoryItem(
  item: Omit<InventoryItem, 'id' | 'updatedAt'>
): Promise<InventoryItem> {
  const apiItem = {
    name: item.name,
    brand: item.brand,
    model: item.model,
    dimensions: item.dimensions,
    description: item.description,
    category: enumToCategoryKey[item.category],
    minStock: item.minStock,
    stock: item.stock,
  };

  const response = await fetchApi<{ item: ApiInventoryItem }>('/api/v1/inventory/items', {
    method: 'POST',
    body: apiItem,
  });

  return transformApiItem(response.item);
}

/**
 * Update an existing inventory item
 */
export async function updateInventoryItem(item: InventoryItem): Promise<InventoryItem> {
  const apiItem = {
    name: item.name,
    brand: item.brand,
    model: item.model,
    dimensions: item.dimensions,
    description: item.description,
    category: enumToCategoryKey[item.category],
    minStock: item.minStock,
    stock: item.stock,
  };

  const response = await fetchApi<{ item: ApiInventoryItem }>(
    `/api/v1/inventory/items/${item.id}`,
    {
      method: 'PUT',
      body: apiItem,
    }
  );

  return transformApiItem(response.item);
}

/**
 * Delete an inventory item
 */
export async function deleteInventoryItem(id: string): Promise<void> {
  await fetchApi(`/api/v1/inventory/items/${id}`, { method: 'DELETE' });
}

/**
 * Get all transactions, optionally filtered by item
 */
export async function getInventoryTransactions(itemId?: string): Promise<InventoryTransaction[]> {
  const params = itemId ? { itemId } : undefined;
  const response = await fetchApi<{ transactions: ApiInventoryTransaction[] }>(
    '/api/v1/inventory/transactions',
    { params }
  );
  return response.transactions.map(transformApiTransaction);
}

/**
 * Create a transaction (stock movement)
 */
export async function createInventoryTransaction(tx: {
  itemId: string;
  type: TransactionType;
  quantity: number;
  source: string;
  destination: string;
  user: string;
  notes?: string;
}): Promise<{ transaction: InventoryTransaction; updatedItem: InventoryItem }> {
  const apiTx = {
    itemId: tx.itemId,
    type: enumToTypeKey[tx.type],
    quantity: tx.quantity,
    source: tx.source,
    destination: tx.destination,
    user: tx.user,
    notes: tx.notes,
  };

  const response = await fetchApi<{
    transaction: ApiInventoryTransaction;
    updatedItem: ApiInventoryItem;
  }>('/api/v1/inventory/transactions', {
    method: 'POST',
    body: apiTx,
  });

  return {
    transaction: transformApiTransaction(response.transaction),
    updatedItem: transformApiItem(response.updatedItem),
  };
}

// ============ Reference Data ============

interface ReferenceCategory {
  _id: string;
  titlePtBr: string;
  staysCategoryId: string;
}

interface ReferenceItem {
  _id: string;
  titlePtBr: string;
  staysItemId: string;
}

/**
 * Get reference categories from Stays.net sync
 */
export async function getReferenceCategories(): Promise<ReferenceCategory[]> {
  const response = await fetchApi<{ categories: ReferenceCategory[] }>(
    '/api/v1/inventory/reference/categories'
  );
  return response.categories;
}

/**
 * Get reference items from Stays.net sync
 */
export async function getReferenceItems(): Promise<ReferenceItem[]> {
  const response = await fetchApi<{ items: ReferenceItem[] }>(
    '/api/v1/inventory/reference/items'
  );
  return response.items;
}

/**
 * Trigger reference data sync from Stays.net
 */
export async function syncReferenceData(): Promise<{ success: boolean }> {
  return fetchApi('/api/v1/inventory/reference/sync', { method: 'POST' });
}

// ============ Comprehensive Sync & Amenities ============

interface SyncCategoryStats {
  added: number;
  updated: number;
  total: number;
}

export interface InventorySyncStats {
  categories: SyncCategoryStats;
  items: SyncCategoryStats;
  conditions: SyncCategoryStats;
  amenities: SyncCategoryStats;
  properties_updated: number;
  sync_duration_ms: number;
  sync_timestamp: Date;
  errors?: string[];
}

export interface InventoryReferenceData {
  categories: Array<{
    stays_category_id: string;
    names: { pt_BR: string; en_US: string };
  }>;
  items: Array<{
    stays_item_id: string;
    stays_category_id?: string;
    names: { pt_BR: string; en_US: string };
  }>;
  conditions: Array<{
    stays_condition_id: string;
    names: { pt_BR: string; en_US: string };
  }>;
  amenities: Array<{
    stays_amenity_id: string;
    names: { pt_BR: string; en_US: string };
    category?: string;
    icon?: string;
  }>;
}

export interface PropertyAmenity {
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

/**
 * Trigger comprehensive sync of ALL Stays.net reference data
 */
export async function syncStaysData(): Promise<InventorySyncStats> {
  const response = await fetchApi<{ success: boolean; stats: InventorySyncStats; message: string }>(
    '/api/v1/inventory/sync-stays-data',
    { method: 'POST' }
  );
  return response.stats;
}

/**
 * Get all reference data for autocomplete
 */
export async function getAllReferenceData(): Promise<InventoryReferenceData> {
  return fetchApi<InventoryReferenceData>('/api/v1/inventory/reference-data');
}

/**
 * Get property amenities with suggestions
 */
export async function getPropertyAmenities(propertyId: string): Promise<PropertyAmenity[]> {
  const response = await fetchApi<{ amenities: PropertyAmenity[] }>(
    `/api/v1/inventory/property-amenities/${propertyId}`
  );
  return response.amenities;
}

/**
 * Get sync status and statistics
 */
export async function getSyncStatus(): Promise<{
  last_sync: { stats: InventorySyncStats; timestamp: Date } | null;
  collections: Record<string, number>;
}> {
  return fetchApi('/api/v1/inventory/sync-status');
}

// ============ Export Service Object ============

export const inventoryApiService = {
  // Items CRUD
  getItems: getInventoryItems,
  getItem: getInventoryItem,
  createItem: createInventoryItem,
  updateItem: updateInventoryItem,
  deleteItem: deleteInventoryItem,
  // Transactions
  getTransactions: getInventoryTransactions,
  createTransaction: createInventoryTransaction,
  // Reference data (basic)
  getReferenceCategories,
  getReferenceItems,
  syncReferenceData,
  // Comprehensive sync & reference data
  syncStaysData,
  getAllReferenceData,
  getPropertyAmenities,
  getSyncStatus,
};
