/**
 * Properties API Service
 * Communicates with the stays-api backend for property management
 */

import { Property, PropertyCharacteristics, ManualOverrides } from '../types';

// In development, use Vite proxy; in production, use env variable
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? '' : (import.meta.env.VITE_API_BASE_URL || 'https://stays-api.onrender.com');
const API_KEY = import.meta.env.VITE_API_KEY || '';

// ============ API Fetch Helper ============

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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
  };

  // Only set Content-Type if we have a body
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ============ Property Sync API ============

/**
 * Trigger property sync from Stays.net
 */
export async function syncPropertiesFromStays(): Promise<{ message: string; timestamp: string }> {
  return fetchApi('/api/v1/properties/sync', {
    method: 'POST',
  });
}

/**
 * Get property sync status
 */
export async function getPropertySyncStatus(): Promise<{
  lastSyncAt: string | null;
  status: 'success' | 'error' | 'running' | 'never';
  lastError: string | null;
  propertiesCount: number;
  durationMs: number;
}> {
  return fetchApi('/api/v1/properties/sync/status');
}

/**
 * Get all properties
 */
export async function getAllProperties(filters?: {
  active?: boolean;
  listed?: boolean;
}): Promise<{ properties: Property[]; count: number }> {
  const params: Record<string, string> = {};
  if (filters?.active !== undefined) params.active = String(filters.active);
  if (filters?.listed !== undefined) params.listed = String(filters.listed);

  return fetchApi('/api/v1/properties', { params });
}

/**
 * Get single property by code
 */
export async function getPropertyByCode(code: string): Promise<Property> {
  return fetchApi(`/api/v1/properties/${code}`);
}

/**
 * Search properties
 */
export async function searchProperties(query: string): Promise<{ properties: Property[]; count: number; query: string }> {
  return fetchApi('/api/v1/properties/search', {
    params: { q: query },
  });
}

/**
 * Get property statistics
 */
export async function getPropertyStats(): Promise<{
  totalProperties: number;
  activeProperties: number;
  listedProperties: number;
  totalRooms: number;
  totalBeds: number;
  averageRooms: number;
}> {
  return fetchApi('/api/v1/properties/stats');
}

// ============ Property Characteristics API ============

/**
 * Get property characteristics by ID or code
 */
export async function getPropertyCharacteristics(identifier: string): Promise<PropertyCharacteristics> {
  const response = await fetchApi<{ data: PropertyCharacteristics }>(
    `/api/v1/properties/${identifier}/characteristics`
  );
  return response.data;
}

/**
 * Get all properties characteristics
 */
export async function getAllPropertiesCharacteristics(filters?: {
  active?: boolean;
  listed?: boolean;
}): Promise<PropertyCharacteristics[]> {
  const params: Record<string, string> = {};
  if (filters?.active !== undefined) params.active = String(filters.active);
  if (filters?.listed !== undefined) params.listed = String(filters.listed);

  const response = await fetchApi<{ data: PropertyCharacteristics[]; count: number }>(
    '/api/v1/properties/characteristics',
    { params }
  );
  return response.data;
}

/**
 * Update property manual overrides
 */
export async function updatePropertyCharacteristics(
  propertyId: string,
  userId: string,
  updates: {
    wifi?: Partial<ManualOverrides['wifi']>;
    access?: Partial<ManualOverrides['access']>;
    specifications?: Partial<ManualOverrides['specifications']>;
    maintenance?: Partial<ManualOverrides['maintenance']>;
  }
): Promise<PropertyCharacteristics> {
  const response = await fetchApi<{ data: PropertyCharacteristics }>(
    `/api/v1/properties/${propertyId}/characteristics`,
    {
      method: 'PATCH',
      body: { userId, updates },
    }
  );
  return response.data;
}
