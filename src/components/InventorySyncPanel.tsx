import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

// Use Vite proxy in development, production URL in production
const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'https://stays-api.onrender.com');
const API_KEY = import.meta.env.VITE_API_KEY || '';

interface SyncCategoryStats {
  added: number;
  updated: number;
  total: number;
}

interface InventorySyncStats {
  categories: SyncCategoryStats;
  items: SyncCategoryStats;
  conditions: SyncCategoryStats;
  amenities: SyncCategoryStats;
  properties_updated: number;
  inventory_populated?: {
    created: number;
    skipped: number;
    total: number;
  };
  sync_duration_ms: number;
  sync_timestamp: Date;
  errors?: string[];
}

export function InventorySyncPanel() {
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<InventorySyncStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);

  // Auto-sync on component mount
  useEffect(() => {
    autoSync();
  }, []);

  const autoSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      // Execute synchronization automatically
      const response = await fetch(`${API_URL}/api/v1/inventory/sync-stays-data`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ populate: true }),
      });

      if (!response.ok) {
        throw new Error('Auto-sync failed');
      }

      const result = await response.json();
      setStats(result.stats);
      setLastSyncDate(new Date(result.stats.sync_timestamp));
    } catch (err) {
      console.error('Auto-sync error:', err);
      setError((err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin text-blue-600' : 'text-gray-400'}`} />
          Sincronização Automática Stays.net
        </h3>

        {syncing && (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Sincronizando...
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {stats && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700 mb-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              Sincronização concluída em {(stats.sync_duration_ms / 1000).toFixed(2)}s
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Categorias"
              added={stats.categories.added}
              updated={stats.categories.updated}
              total={stats.categories.total}
            />
            <StatCard
              title="Itens"
              added={stats.items.added}
              updated={stats.items.updated}
              total={stats.items.total}
            />
            <StatCard
              title="Condições"
              added={stats.conditions.added}
              updated={stats.conditions.updated}
              total={stats.conditions.total}
            />
            <StatCard
              title="Amenidades"
              added={stats.amenities.added}
              updated={stats.amenities.updated}
              total={stats.amenities.total}
            />
          </div>

          {stats.properties_updated > 0 && (
            <div className="pt-3 border-t text-sm text-gray-700">
              <span className="font-medium">{stats.properties_updated}</span> propriedades atualizadas com amenidades
            </div>
          )}

          {stats.inventory_populated && (
            <div className="pt-3 border-t text-sm">
              <div className="font-medium text-green-700 mb-1">
                📦 Itens de Inventário Criados
              </div>
              <div className="text-gray-700">
                <span className="font-medium text-green-600">{stats.inventory_populated.created}</span> novos itens criados com quantidade 0
              </div>
              {stats.inventory_populated.skipped > 0 && (
                <div className="text-gray-600 text-xs mt-1">
                  {stats.inventory_populated.skipped} itens já existentes (preservados)
                </div>
              )}
            </div>
          )}

          {lastSyncDate && (
            <div className="pt-3 border-t text-sm text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Última sincronização: {lastSyncDate.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  added: number;
  updated: number;
  total: number;
}

function StatCard({ title, added, updated, total }: StatCardProps) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{total}</div>
      <div className="text-xs text-gray-600 mt-1">
        {added > 0 && <span className="text-green-600">+{added} novos</span>}
        {added > 0 && updated > 0 && <span className="mx-1">•</span>}
        {updated > 0 && <span className="text-blue-600">{updated} atualizados</span>}
        {added === 0 && updated === 0 && <span className="text-gray-500">Sem alterações</span>}
      </div>
    </div>
  );
}
