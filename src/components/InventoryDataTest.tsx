import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader2, Database } from 'lucide-react';

// Always use empty string in development to use Vite proxy
const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'https://stays-api.onrender.com');
const API_KEY = import.meta.env.VITE_API_KEY || '';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  data?: any;
  duration?: number;
}

export function InventoryDataTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const updateResult = (name: string, update: Partial<TestResult>) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, ...update } : r);
      } else {
        return [...prev, { name, status: 'pending', ...update } as TestResult];
      }
    });
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Health Check
    updateResult('Health Check', { status: 'pending' });
    try {
      const start = Date.now();
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      const duration = Date.now() - start;

      if (response.ok) {
        updateResult('Health Check', {
          status: 'success',
          message: `Backend está online (${duration}ms)`,
          data,
          duration
        });
      } else {
        updateResult('Health Check', {
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`
        });
      }
    } catch (error) {
      updateResult('Health Check', {
        status: 'error',
        message: `Erro: ${(error as Error).message}`
      });
    }

    // Test 2: Fetch Reference Data
    updateResult('Reference Data', { status: 'pending' });
    try {
      const start = Date.now();
      const response = await fetch(`${API_URL}/api/v1/inventory/reference-data`, {
        headers: {
          'X-API-Key': API_KEY,
        },
      });
      const data = await response.json();
      const duration = Date.now() - start;

      if (response.ok) {
        const summary = {
          categories: data.categories?.length || 0,
          items: data.items?.length || 0,
          conditions: data.conditions?.length || 0,
          amenities: data.amenities?.length || 0
        };

        updateResult('Reference Data', {
          status: 'success',
          message: `${summary.categories} categorias, ${summary.items} itens, ${summary.conditions} condições, ${summary.amenities} amenidades (${duration}ms)`,
          data: { summary, sample: data.items?.slice(0, 3) },
          duration
        });
      } else {
        updateResult('Reference Data', {
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`
        });
      }
    } catch (error) {
      updateResult('Reference Data', {
        status: 'error',
        message: `Erro: ${(error as Error).message}`
      });
    }

    // Test 3: Check Sync Status
    updateResult('Sync Status', { status: 'pending' });
    try {
      const start = Date.now();
      const response = await fetch(`${API_URL}/api/v1/inventory/sync-status`, {
        headers: {
          'X-API-Key': API_KEY,
        },
      });
      const data = await response.json();
      const duration = Date.now() - start;

      if (response.ok) {
        const lastSync = data.last_sync?.timestamp
          ? new Date(data.last_sync.timestamp).toLocaleString('pt-BR')
          : 'Nunca sincronizado';

        updateResult('Sync Status', {
          status: 'success',
          message: `Última sync: ${lastSync} (${duration}ms)`,
          data,
          duration
        });
      } else {
        updateResult('Sync Status', {
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`
        });
      }
    } catch (error) {
      updateResult('Sync Status', {
        status: 'error',
        message: `Erro: ${(error as Error).message}`
      });
    }

    // Test 4: Trigger Sync
    updateResult('Trigger Sync', { status: 'pending' });
    try {
      const start = Date.now();
      const response = await fetch(`${API_URL}/api/v1/inventory/sync-stays-data`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ populate: true }), // Criar todos os 486 itens automaticamente
      });
      const data = await response.json();
      const duration = Date.now() - start;

      if (response.ok && data.stats) {
        const stats = data.stats;
        let message = `Sync concluída! Categorias: ${stats.categories.total}, Itens: ${stats.items.total}, Amenidades: ${stats.amenities.total}`;
        if (stats.inventory_populated) {
          message += ` | ${stats.inventory_populated.created} itens criados na tabela`;
        }
        message += ` (${duration}ms)`;

        updateResult('Trigger Sync', {
          status: 'success',
          message,
          data,
          duration
        });
      } else {
        updateResult('Trigger Sync', {
          status: 'error',
          message: data.error || `HTTP ${response.status}: ${response.statusText}`
        });
      }
    } catch (error) {
      updateResult('Trigger Sync', {
        status: 'error',
        message: `Erro: ${(error as Error).message}`
      });
    }

    // Test 5: Verify MongoDB Collections
    updateResult('MongoDB Collections', { status: 'pending' });
    try {
      const start = Date.now();
      const response = await fetch(`${API_URL}/api/v1/inventory/sync-status`, {
        headers: {
          'X-API-Key': API_KEY,
        },
      });
      const data = await response.json();
      const duration = Date.now() - start;

      if (response.ok && data.collections) {
        const cols = data.collections;
        updateResult('MongoDB Collections', {
          status: 'success',
          message: `Categories: ${cols.categories}, Items: ${cols.items}, Conditions: ${cols.conditions}, Amenities: ${cols.amenities} (${duration}ms)`,
          data: cols,
          duration
        });
      } else {
        updateResult('MongoDB Collections', {
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`
        });
      }
    } catch (error) {
      updateResult('MongoDB Collections', {
        status: 'error',
        message: `Erro: ${(error as Error).message}`
      });
    }

    setTesting(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">🧪 Teste de Integração Stays.net</h3>
            <p className="text-sm text-gray-500">Verificando conexão stays-api → Stays.net → MongoDB</p>
          </div>
        </div>
        <button
          onClick={runTests}
          disabled={testing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Executar Testes
            </>
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-l-4 ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-500'
                  : result.status === 'error'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {result.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {result.status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                  {result.status === 'pending' && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900 mb-1">
                    {result.name}
                    {result.duration && (
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        ({result.duration}ms)
                      </span>
                    )}
                  </div>
                  {result.message && (
                    <div className="text-sm text-gray-700">{result.message}</div>
                  )}
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                        Ver dados
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-sm text-blue-900 mb-2">ℹ️ Sobre este teste</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>Não usa Firebase</strong> - Conecta diretamente no stays-api via proxy Vite</li>
          <li>• <strong>stays-api puxa da Stays.net</strong> - Usando a API externa oficial</li>
          <li>• <strong>Salva no MongoDB</strong> - Dados são persistidos no banco do stays-api</li>
          <li>• <strong>Proxy Vite</strong>: /api/v1 → localhost:3001</li>
        </ul>
      </div>
    </div>
  );
}
