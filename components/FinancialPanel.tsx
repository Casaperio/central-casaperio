
import React, { useMemo, useState } from 'react';
import { Reservation, ReservationStatus, Property } from '../types';
import {
 DollarSign, TrendingUp, TrendingDown,
 CalendarRange, BarChart3, ArrowUpRight,
 Percent, Home, RefreshCw, Loader2
} from 'lucide-react';
import {
 AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
 PieChart as RePieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { useFinancialData } from '../hooks/useFinancialData';
import { usePeriodFilter } from '../hooks/usePeriodFilter';
import { PeriodFilter } from './PeriodFilter';
import { PropertyView } from './PropertyView';
import FinancialDetailsTable from './FinancialDetailsTable';

interface FinancialPanelProps {
 reservations: Reservation[];
 properties: Property[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const shortenName = (name: string | null | undefined) => {
  if (!name) return 'N/A';
  const parts = name.split('-');
  if (parts.length >= 3) {
    return `${parts[1]}-${parts[parts.length-1]}`;
  }
  return name;
};

type TabType = 'overview' | 'by-property';

const FinancialPanel: React.FC<FinancialPanelProps> = ({ reservations, properties }) => {
 const [sameStoreFilter, setSameStoreFilter] = useState(false);
 const [revenueDistPeriod, setRevenueDistPeriod] = useState<'current' | 'lastMonth' | 'sameLastYear' | 'ytd'>('current');
 const [showAllProfitable, setShowAllProfitable] = useState(false);
 const [activeTab, setActiveTab] = useState<TabType>('overview');

 // Period Filter Hook
 const { preset, from, to, setPreset, setCustomPeriod } = usePeriodFilter();

 // --- STAYS API DATA with period params ---
 const {
  summary: apiSummary,
  byProperty: apiByProperty,
  byChannel: apiByChannel,
  trend: apiTrend,
  panel: panelData,
  loading: apiLoading,
  panelLoading,
  error: apiError,
  refetch: refetchApi,
  refreshPanel
 } = useFinancialData({ from, to });

 // --- LOCAL DATA PROCESSING (for charts that need reservation details) ---
 const processFinancials = useMemo(() => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const monthlyData: Record<string, number> = {};

  // Distribution Data Holders
  const distData = {
    current: {} as Record<string, number>,
    lastMonth: {} as Record<string, number>,
    sameLastYear: {} as Record<string, number>,
    ytd: {} as Record<string, number>
  };

  // Profitable Props Holders
  const propRevenue: Record<string, number> = {};

  // 1. Identify properties active last year for Same Store Logic
  const propertiesActiveLastYear = new Set<string>();
  if (sameStoreFilter) {
    reservations.forEach(r => {
      const d = new Date(r.checkInDate);
      if (d.getFullYear() === (currentYear - 1)) {
        propertiesActiveLastYear.add(r.propertyCode);
      }
    });
  }

  reservations.forEach(res => {
   if (res.status === ReservationStatus.CANCELED) return;

   // Apply Same Store Filter
   if (sameStoreFilter && !propertiesActiveLastYear.has(res.propertyCode)) return;

   const date = new Date(res.checkInDate);
   const value = res.totalValue || 0;
   const month = date.getMonth();
   const year = date.getFullYear();
   const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
   const channel = res.channel || 'Direto';

   // Build Monthly Chart Data (Trend)
   monthlyData[monthKey] = (monthlyData[monthKey] || 0) + value;

   // Distribution Logic
   if (year === currentYear) {
    distData.ytd[channel] = (distData.ytd[channel] || 0) + value;
    propRevenue[res.propertyCode] = (propRevenue[res.propertyCode] || 0) + value;

    if (month === currentMonth) {
     distData.current[channel] = (distData.current[channel] || 0) + value;
    }
   }

   // Last Month
   if (year === lastMonthYear && month === lastMonth) {
    distData.lastMonth[channel] = (distData.lastMonth[channel] || 0) + value;
   }

   // Same Month Last Year
   if (year === currentYear - 1 && month === currentMonth) {
     distData.sameLastYear[channel] = (distData.sameLastYear[channel] || 0) + value;
   }
  });

  // Formatting Chart Data
  const chartData = Object.keys(monthlyData).map(key => ({
   name: key,
   receita: monthlyData[key]
  })).slice(-12);

  // Pick correct distribution based on selection
  const selectedDistSource = distData[revenueDistPeriod];
  const pieData = Object.keys(selectedDistSource).map(key => ({
   name: key,
   value: selectedDistSource[key]
  }));

  // Top Properties
  const topProps = Object.keys(propRevenue)
    .map(k => ({ name: shortenName(k), fullName: k, value: propRevenue[k] }))
    .sort((a,b) => b.value - a.value);

  return {
   chartData,
   pieData,
   topProps
  };
 }, [reservations, sameStoreFilter, revenueDistPeriod]);

 const { chartData, pieData, topProps } = processFinancials;

 // Use API trend data if available, otherwise use local chart data
 const trendChartData = apiTrend.length > 0
  ? apiTrend.map(t => ({ name: t.month, receita: t.revenue }))
  : chartData;

 // Use API by-property data if available
 const topPropsData = apiByProperty.length > 0
  ? apiByProperty.map(p => ({
    name: shortenName(p.propertyCode),
    fullName: p.propertyCode,
    value: p.revenue
   }))
  : topProps;

 // Use API by-channel data if available
 const channelPieData = apiByChannel.length > 0
  ? apiByChannel.map(c => ({ name: c.channel, value: c.revenue }))
  : pieData;

 const formatCurrency = (val: number) =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

 // Get values from panel data (API) or fallback to 0
 const currentMonthRevenue = panelData?.currentMonthRevenue ?? 0;
 const previousMonthRevenue = panelData?.previousMonthRevenue ?? 0;
 const monthGrowth = panelData?.monthGrowthPercent ?? 0;
 const ytdRevenue = panelData?.ytdRevenue ?? 0;
 const ytdGrowth = panelData?.ytdGrowthPercent ?? 0;
 const averageTicket = panelData?.averageTicket ?? 0;
 const nextMonthProjection = panelData?.nextMonthProjection ?? 0;

 const isLoading = apiLoading || panelLoading;

 return (
  <div className="space-y-8 animate-fade-in p-2 pb-20">

   {/* Header & Controls */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
     <div className="flex items-center gap-3 mb-2">
      <div className="bg-green-100 p-2 rounded-lg text-green-700">
      <DollarSign size={24} />
      </div>
      <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900">Painel Financeiro</h2>
      <p className="text-gray-500 text-sm">Visão consolidada de receitas e performance de vendas.</p>
      </div>
     </div>

     <div className="flex items-center gap-4">
      <button
       onClick={() => refreshPanel()}
       disabled={isLoading}
       className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg"
      >
       <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
       Atualizar Dados
      </button>
      <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
         <input
         type="checkbox"
         checked={sameStoreFilter}
         onChange={(e) => setSameStoreFilter(e.target.checked)}
         className="rounded text-green-600 focus:ring-green-500"
         />
         <span className="text-sm text-gray-700 font-medium">Filtro Same Store (Comparar mesmos imóveis)</span>
      </label>
     </div>
   </div>

   {/* Period Filter */}
   <PeriodFilter
     preset={preset}
     from={from}
     to={to}
     onPresetChange={setPreset}
     onCustomPeriodChange={setCustomPeriod}
   />

   {/* Error Display */}
   {apiError && (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
     Erro ao carregar dados da API: {apiError}
    </div>
   )}

   {/* Tabs */}
   <div className="border-b border-gray-200">
     <div className="flex gap-1">
       <button
         onClick={() => setActiveTab('overview')}
         className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
           activeTab === 'overview'
             ? 'border-brand-500 text-brand-600'
             : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
         }`}
       >
         Visão Geral
       </button>
       <button
         onClick={() => setActiveTab('by-property')}
         className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
           activeTab === 'by-property'
             ? 'border-brand-500 text-brand-600'
             : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
         }`}
       >
         Por Imóvel
       </button>
     </div>
   </div>

   {/* Tab Content - Overview */}
   {activeTab === 'overview' && (
     <>
       {/* KPI Cards - Now using API data */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Revenue */}
        <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm relative">
         {isLoading && <div className="absolute top-2 right-2"><Loader2 size={14} className="animate-spin text-gray-400" /></div>}
         <div className="flex justify-between items-start mb-2">
          <div>
           <p className="text-sm text-gray-500 font-medium">Receita (Mês Atual)</p>
           <h3 className="text-2xl font-heading font-bold text-gray-900">{formatCurrency(currentMonthRevenue)}</h3>
          </div>
          <div className={`p-1.5 rounded-lg ${monthGrowth >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
           {monthGrowth >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
         </div>
         <div className="flex items-center gap-1 text-xs">
          <span className={`font-bold ${monthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
           {monthGrowth >= 0 ? '+' : ''}{monthGrowth.toFixed(1)}%
          </span>
          <span className="text-gray-400">vs mês anterior ({formatCurrency(previousMonthRevenue)})</span>
         </div>
        </div>

        {/* Yearly Revenue */}
        <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm relative">
         {isLoading && <div className="absolute top-2 right-2"><Loader2 size={14} className="animate-spin text-gray-400" /></div>}
         <div className="flex justify-between items-start mb-2">
          <div>
           <p className="text-sm text-gray-500 font-medium">Receita Acumulada (YTD)</p>
           <h3 className="text-2xl font-heading font-bold text-gray-900">{formatCurrency(ytdRevenue)}</h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
           <CalendarRange size={20} />
          </div>
         </div>
         <div className="flex items-center gap-1 text-xs">
           <span className={`font-bold ${ytdGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
           {ytdGrowth >= 0 ? '+' : ''}{ytdGrowth.toFixed(1)}%
          </span>
          <span className="text-gray-400">vs acumulado ano ant.</span>
         </div>
        </div>

        {/* ADR */}
        <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm relative">
         {isLoading && <div className="absolute top-2 right-2"><Loader2 size={14} className="animate-spin text-gray-400" /></div>}
         <div className="flex justify-between items-start mb-2">
          <div>
           <p className="text-sm text-gray-500 font-medium">Ticket Médio (ADR)</p>
           <h3 className="text-2xl font-heading font-bold text-gray-900">{formatCurrency(averageTicket)}</h3>
          </div>
          <div className="bg-amber-50 text-amber-600 p-1.5 rounded-lg">
           <BarChart3 size={20} />
          </div>
         </div>
         <p className="text-xs text-gray-400">Média por reserva neste mês</p>
        </div>

        {/* Projection */}
        <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-none border border-green-100 shadow-sm relative">
         {isLoading && <div className="absolute top-2 right-2"><Loader2 size={14} className="animate-spin text-gray-400" /></div>}
         <div className="flex justify-between items-start mb-2">
          <div>
           <p className="text-sm text-green-800 font-medium">Projeção Próx. Mês</p>
           <h3 className="text-2xl font-heading font-bold text-green-900">{formatCurrency(nextMonthProjection)}</h3>
          </div>
          <div className="bg-white text-green-600 p-1.5 rounded-lg shadow-sm">
           <ArrowUpRight size={20} />
          </div>
         </div>
         <p className="text-xs text-green-700">Baseado no histórico de crescimento</p>
        </div>
       </div>

       {/* API Metrics Section */}
       {apiSummary && (
        <div className="space-y-4">
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
           <h3 className="text-lg font-bold text-gray-800">Métricas Stays.net (Período Selecionado)</h3>
           {apiLoading && <Loader2 size={16} className="animate-spin text-gray-400" />}
          </div>
          <button
           onClick={() => refetchApi()}
           disabled={apiLoading}
           className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
           <RefreshCw size={14} className={apiLoading ? 'animate-spin' : ''} />
           Atualizar
          </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ADR - Average Daily Rate */}
          <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start mb-2">
            <div>
             <p className="text-sm text-gray-500 font-medium">ADR (Diária Média)</p>
             <h3 className="text-2xl font-heading font-bold text-gray-900">{formatCurrency(apiSummary.averageDailyRate)}</h3>
            </div>
            <div className="bg-purple-50 text-purple-600 p-1.5 rounded-lg">
             <BarChart3 size={20} />
            </div>
           </div>
           <p className="text-xs text-gray-400">Average Daily Rate por noite</p>
          </div>

          {/* RevPAR */}
          <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start mb-2">
            <div>
             <p className="text-sm text-gray-500 font-medium">RevPAR</p>
             <h3 className="text-2xl font-heading font-bold text-gray-900">{formatCurrency(apiSummary.revPAR)}</h3>
            </div>
            <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">
             <DollarSign size={20} />
            </div>
           </div>
           <p className="text-xs text-gray-400">Revenue Per Available Room</p>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start mb-2">
            <div>
             <p className="text-sm text-gray-500 font-medium">Taxa de Ocupação</p>
             <h3 className="text-2xl font-heading font-bold text-gray-900">{apiSummary.occupancyRate.toFixed(1)}%</h3>
            </div>
            <div className="bg-teal-50 text-teal-600 p-1.5 rounded-lg">
             <Percent size={20} />
            </div>
           </div>
           <p className="text-xs text-gray-400">{apiSummary.totalNights} noites ocupadas de {apiSummary.availableNights}</p>
          </div>

          {/* Total Reservations */}
          <div className="bg-white p-5 rounded-none border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start mb-2">
            <div>
             <p className="text-sm text-gray-500 font-medium">Total Reservas</p>
             <h3 className="text-2xl font-heading font-bold text-gray-900">{apiSummary.reservationsCount}</h3>
            </div>
            <div className="bg-orange-50 text-orange-600 p-1.5 rounded-lg">
             <Home size={20} />
            </div>
           </div>
           <p className="text-xs text-gray-400">No período selecionado</p>
          </div>
         </div>
        </div>
       )}

       {/* Charts Section */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Main Area Chart */}
        <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm">
         <h3 className="text-lg font-bold text-gray-800 mb-6">Evolução de Receita (12 Meses)</h3>
         <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
           <AreaChart data={trendChartData}>
            <defs>
             <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
             </linearGradient>
            </defs>
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
            <Tooltip
             formatter={(value: number) => formatCurrency(value)}
             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
           </AreaChart>
          </ResponsiveContainer>
         </div>
        </div>

        {/* Profitable Properties (Vertical Bar) */}
        <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm h-96 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">Top Imóveis (YTD)</h3>
            <button
              onClick={() => setShowAllProfitable(!showAllProfitable)}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              {showAllProfitable ? 'Ver Top 5' : 'Ver Todos'}
            </button>
          </div>

          {showAllProfitable ? (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {topPropsData.map((p, idx) => (
                    <tr key={p.fullName} className="hover:bg-gray-50">
                      <td className="py-2 text-xs font-medium text-gray-500 w-6">{idx+1}.</td>
                      <td className="py-2 font-medium text-gray-800">{p.fullName}</td>
                      <td className="py-2 text-right font-bold text-green-700">{formatCurrency(p.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPropsData.slice(0, 5)} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={60} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Channel Pie Chart */}
        <div className="bg-white p-6 rounded-none border border-gray-200 shadow-sm">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
           <h3 className="text-lg font-bold text-gray-800">Distribuição de Receita por Canal</h3>
         </div>

         <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
           <RePieChart>
            <Pie
             data={channelPieData}
             cx="50%"
             cy="50%"
             innerRadius={60}
             outerRadius={80}
             paddingAngle={5}
             dataKey="value"
            >
             {channelPieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
             ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend verticalAlign="bottom" height={36}/>
           </RePieChart>
          </ResponsiveContainer>
         </div>
        </div>
       </div>

       {/* Detailed Financial Table */}
       <div className="mt-8">
        <FinancialDetailsTable from={from} to={to} />
       </div>
     </>
   )}

   {/* Tab Content - By Property */}
   {activeTab === 'by-property' && (
     <PropertyView
       reservations={reservations}
       properties={properties}
       from={from}
       to={to}
       loading={isLoading}
     />
   )}

  </div>
 );
};

export default FinancialPanel;
