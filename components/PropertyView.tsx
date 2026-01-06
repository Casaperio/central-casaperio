import React, { useMemo, useState, useEffect } from 'react';
import { Reservation, ReservationStatus, Property } from '../types';
import {
  DollarSign, Percent, Home, BarChart3, Calendar,
  TrendingUp, TrendingDown, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import {
  getFinancialsByProperty,
  PropertyFinancials,
  getCalendar,
  CalendarReservation
} from '../services/staysApiService';

// Tipo estendido para incluir propertyCode
interface CalendarReservationWithProperty extends CalendarReservation {
  propertyCode: string;
}

interface PropertyViewProps {
  reservations: Reservation[];
  properties: Property[];
  from: string;
  to: string;
  loading?: boolean;
  selectedPropertyCodes?: string[]; // Lista de códigos de imóveis pré-selecionados (modo multi)
}

/**
 * Calcula o overlap (em dias) entre uma reserva e um período
 */
function calculateOverlapDays(
  checkIn: string,
  checkOut: string,
  periodFrom: string,
  periodTo: string
): number {
  const resStart = new Date(checkIn);
  const resEnd = new Date(checkOut);
  const periodStart = new Date(periodFrom);
  const periodEnd = new Date(periodTo);

  // Overlap start é o máximo entre check-in e period start
  const overlapStart = resStart > periodStart ? resStart : periodStart;

  // Overlap end é o mínimo entre check-out e period end
  const overlapEnd = resEnd < periodEnd ? resEnd : periodEnd;

  // Se não há overlap
  if (overlapStart >= overlapEnd) {
    return 0;
  }

  // Calcular diferença em dias
  const diffMs = overlapEnd.getTime() - overlapStart.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calcula número total de dias no período
 */
function calculatePeriodDays(from: string, to: string): number {
  const start = new Date(from);
  const end = new Date(to);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos os dias
}

export const PropertyView: React.FC<PropertyViewProps> = ({
  reservations,
  properties,
  from,
  to,
  loading = false,
  selectedPropertyCodes = [], // Modo multi-seleção (se fornecido)
}) => {
  const [selectedPropertyCode, setSelectedPropertyCode] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFinancials, setPropertyFinancials] = useState<PropertyFinancials[]>([]);
  const [apiReservations, setApiReservations] = useState<CalendarReservationWithProperty[]>([]);
  const [financialsLoading, setFinancialsLoading] = useState(false);

  // Modo multi-seleção: se selectedPropertyCodes tiver itens, usar ele; senão usar seleção manual
  const isMultiMode = selectedPropertyCodes.length > 0;
  const propertiesToShow = isMultiMode ? selectedPropertyCodes : (selectedPropertyCode ? [selectedPropertyCode] : []);

  // Buscar dados financeiros e reservas da API quando o período mudar
  useEffect(() => {
    const fetchData = async () => {
      if (!from || !to) return;

      console.log('🔍 Fetching data for period:', { from, to });

      setFinancialsLoading(true);
      try {
        // Buscar financeiros e reservas em paralelo
        const [financialsResponse, calendarResponse] = await Promise.all([
          getFinancialsByProperty(from, to),
          getCalendar(from, to)
        ]);

        console.log('🔍 Calendar response units:', calendarResponse.units.length);

        // Debug: Verificar se API retorna priceValue
        const ritaLudolf17 = calendarResponse.units.find(u => u.code.includes('L-RL-17-101'));
        if (ritaLudolf17 && ritaLudolf17.reservations.length > 0) {
          console.log('🔍 Rita Ludolf 17/101 first reservation RAW:', ritaLudolf17.reservations[0]);
        }

        setPropertyFinancials(financialsResponse.properties);

        // Extrair todas as reservas de todas as unidades
        const allReservations = calendarResponse.units.flatMap(unit =>
          unit.reservations.map(res => ({
            ...res,
            propertyCode: unit.code // Adicionar código da propriedade
          }))
        );

        // Debug: verificar uma reserva específica
        const sample = allReservations.find(r => r.guestName?.includes('Lara'));
        console.log('🔍 Sample reservation (Lara):', sample);
        console.log('🔍 Total reservations loaded:', allReservations.length);

        setApiReservations(allReservations);
      } catch (error) {
        console.error('Error fetching property data:', error);
        setPropertyFinancials([]);
        setApiReservations([]);
      } finally {
        setFinancialsLoading(false);
      }
    };

    fetchData();
  }, [from, to]);

  // Filtra properties baseado na busca
  const filteredProperties = useMemo(() => {
    if (!searchQuery) return properties;

    const query = searchQuery.toLowerCase();
    return properties.filter(
      (p) =>
        p.code.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query)
    );
  }, [properties, searchQuery]);

  // Função para buscar KPIs de um imóvel específico
  const getPropertyKPIs = (propertyCode: string) => {
    if (!propertyCode || propertyFinancials.length === 0) {
      return null;
    }

    // Encontrar dados financeiros do imóvel
    const financialData = propertyFinancials.find(
      (pf) => pf.propertyCode === propertyCode
    );

    if (!financialData) {
      return {
        revenue: 0,
        adr: 0,
        occupancy: 0,
        revPAR: 0,
        reservationsCount: 0,
        totalNights: 0,
        availableDays: 0,
        monthlyData: [],
      };
    }

    // Calcular RevPAR (Revenue Per Available Room)
    const revPAR = financialData.averageDailyRate * (financialData.occupancyRate / 100);

    // Criar dados mensais vazios por enquanto
    const monthlyData: Array<{ name: string; receita: number }> = [];

    return {
      revenue: financialData.revenue,
      adr: financialData.averageDailyRate,
      occupancy: financialData.occupancyRate,
      revPAR,
      reservationsCount: financialData.bookingsCount,
      totalNights: financialData.nights,
      availableDays: 0,
      monthlyData,
    };
  };

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Função para obter reservas de um imóvel específico
  const getPropertyReservations = (propertyCode: string) => {
    if (!propertyCode) return [];

    // Filtrar reservas da propriedade vindas da API
    const filtered = apiReservations.filter(
      (res) => res.propertyCode === propertyCode
    );

    return filtered;
  };

  // Componente interno para renderizar KPIs e tabela de um imóvel
  const renderPropertyData = (propertyCode: string) => {
    const propertyKPIs = getPropertyKPIs(propertyCode);
    const propertyReservations = getPropertyReservations(propertyCode);

    if (!propertyKPIs) return null;

    return (
      <div key={propertyCode} className="space-y-6">
        {/* Título do imóvel (apenas no modo multi) */}
        {isMultiMode && (
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">{propertyCode}</h3>
            {properties.find(p => p.code === propertyCode)?.address && (
              <p className="text-sm text-gray-600 mt-1">
                {properties.find(p => p.code === propertyCode)?.address}
              </p>
            )}
          </div>
        )}

        {/* No Data State */}
        {propertyKPIs.reservationsCount === 0 && (
          <div className="bg-white p-8 rounded-none border border-gray-200 shadow-sm text-center">
            <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Nenhuma reserva encontrada para <strong>{propertyCode}</strong> no período selecionado
            </p>
          </div>
        )}

        {/* KPIs do Imóvel */}
        {propertyKPIs.reservationsCount > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Receita */}
              <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Receita (Período)</p>
                    <h3 className="text-2xl font-heading font-bold text-gray-900">
                      {formatCurrency(propertyKPIs.revenue)}
                    </h3>
                  </div>
                  <div className="bg-green-50 text-green-600 p-1.5 rounded-lg">
                    <DollarSign size={20} />
                  </div>
                </div>
                <p className="text-xs text-gray-400">{propertyKPIs.reservationsCount} reservas</p>
              </div>

              {/* ADR */}
              <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">ADR (Diária Média)</p>
                    <h3 className="text-2xl font-heading font-bold text-gray-900">
                      {formatCurrency(propertyKPIs.adr)}
                    </h3>
                  </div>
                  <div className="bg-purple-50 text-purple-600 p-1.5 rounded-lg">
                    <BarChart3 size={20} />
                  </div>
                </div>
                <p className="text-xs text-gray-400">Average Daily Rate</p>
              </div>

              {/* Ocupação */}
              <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Taxa de Ocupação</p>
                    <h3 className="text-2xl font-heading font-bold text-gray-900">
                      {propertyKPIs.occupancy.toFixed(1)}%
                    </h3>
                  </div>
                  <div className="bg-teal-50 text-teal-600 p-1.5 rounded-lg">
                    <Percent size={20} />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {propertyKPIs.totalNights} de {propertyKPIs.availableDays} dias
                </p>
              </div>

              {/* RevPAR */}
              <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">RevPAR</p>
                    <h3 className="text-2xl font-heading font-bold text-gray-900">
                      {formatCurrency(propertyKPIs.revPAR)}
                    </h3>
                  </div>
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">
                    <DollarSign size={20} />
                  </div>
                </div>
                <p className="text-xs text-gray-400">Revenue Per Available Room</p>
              </div>

              {/* Total Reservas */}
              <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Reservas</p>
                    <h3 className="text-2xl font-heading font-bold text-gray-900">
                      {propertyKPIs.reservationsCount}
                    </h3>
                  </div>
                  <div className="bg-orange-50 text-orange-600 p-1.5 rounded-lg">
                    <Home size={20} />
                  </div>
                </div>
                <p className="text-xs text-gray-400">No período selecionado</p>
              </div>
            </div>

            {/* Tabela de Reservas do Imóvel */}
            <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Reservas - {propertyCode}
              </h3>

              {propertyReservations.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhuma reserva encontrada para este imóvel no período.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Hóspede
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Check-in
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Check-out
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Noites
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Canal
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Valor Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {propertyReservations.map((res) => {
                        const checkIn = new Date(res.startDate);
                        const checkOut = new Date(res.endDate);

                        return (
                          <tr key={res.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">{res.guestName}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {checkIn.toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {checkOut.toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{res.nights}</td>
                            <td className="px-4 py-3 text-gray-700">{res.platform || 'Direto'}</td>
                            <td className="px-4 py-3 text-right font-semibold text-green-700">
                              {formatCurrency(res.priceValue || 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Imóvel - Apenas no modo single (não-multi) */}
      {!isMultiMode && (
        <div className="bg-white p-4 rounded-none border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Home size={16} className="text-gray-600" />
            <h4 className="text-sm font-semibold text-gray-700">Selecione um Imóvel</h4>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar por código ou endereço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="mt-3 max-h-48 overflow-y-auto border border-gray-200 rounded">
            {filteredProperties.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                Nenhum imóvel encontrado
              </div>
            ) : (
              filteredProperties.map((prop) => (
                <button
                  key={prop.code}
                  onClick={() => setSelectedPropertyCode(prop.code)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 border-b border-gray-100 last:border-0 transition-colors ${
                    selectedPropertyCode === prop.code
                      ? 'bg-brand-100 font-medium text-brand-900'
                      : 'text-gray-700'
                  }`}
                >
                  <div className="font-medium">{prop.code}</div>
                  {prop.address && (
                    <div className="text-xs text-gray-500 mt-0.5">{prop.address}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {(loading || financialsLoading) && (
        <div className="bg-white p-8 rounded-none border border-gray-200 shadow-sm flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-brand-500" />
          <span className="ml-3 text-gray-600">Carregando dados...</span>
        </div>
      )}

      {/* Empty State - Apenas no modo single */}
      {!loading && !isMultiMode && propertiesToShow.length === 0 && (
        <div className="bg-white p-8 rounded-none border border-gray-200 shadow-sm text-center">
          <Home size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Selecione um imóvel para ver os detalhes financeiros</p>
        </div>
      )}

      {/* Renderizar dados dos imóveis (single ou multi) */}
      {!loading && !financialsLoading && propertiesToShow.map((propertyCode) => (
        renderPropertyData(propertyCode)
      ))}
    </div>
  );
};
