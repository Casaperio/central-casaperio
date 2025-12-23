import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
 Wrench,
 Briefcase,
 Users,
 XCircle,
 Calendar,
 Clock,
 DollarSign,
 TrendingUp,
 Home,
 Activity,
} from 'lucide-react';

// Hooks
import { useOperationalData } from '../hooks/useOperationalData';
import { useCommercialData } from '../hooks/useCommercialData';
import { useGuestTeamData } from '../hooks/useGuestTeamData';

// Components
import { KPICard } from './stats/KPICard';
import { DataTable } from './stats/DataTable';
import { LoadingState } from './stats/LoadingState';
import { DateRangePicker } from './stats/DateRangePicker';

// Charts
import {
 BarChart,
 Bar,
 XAxis,
 YAxis,
 Tooltip,
 ResponsiveContainer,
 PieChart,
 Pie,
 Cell,
 Legend,
} from 'recharts';

const COLORS = [
 '#0088FE',
 '#00C49F',
 '#FFBB28',
 '#FF8042',
 '#8884d8',
 '#82ca9d',
 '#ff6b6b',
 '#4ecdc4',
];

// Função auxiliar para formatar valores monetários de forma segura
function formatCurrency(value: number | undefined | null): string {
 if (value === undefined || value === null || isNaN(value)) {
  return 'R$ 0';
 }
 return `R$ ${value.toLocaleString('pt-BR')}`;
}

export function StatsDashboard() {
 const [activeTab, setActiveTab] = useState<'operational' | 'commercial' | 'guest_team'>(
  'commercial'
 );

 // Date range state - default to current month
 const [dateRange, setDateRange] = useState({
  from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
 });

 // Fetch data using custom hooks
 const operational = useOperationalData(dateRange.from, dateRange.to);
 const commercial = useCommercialData(dateRange.from, dateRange.to);
 const guestTeam = useGuestTeamData();

 // Render Operational Tab
 function renderOperationalTab() {
  if (operational.loading) {
   return (
    <div className="flex items-center justify-center h-64">
     <LoadingState lastUpdated={null} loading={true} />
    </div>
   );
  }

  if (operational.error) {
   return (
    <div className="text-red-500 p-4 bg-red-50 rounded-lg">
     Erro ao carregar dados operacionais: {operational.error.message}
    </div>
   );
  }

  if (!operational.data) return null;

  const { ticketStats } = operational.data;

  // Prepare chart data
  const categoryData = Object.entries(ticketStats.byCategory).map(([name, value]) => ({
   name,
   value,
  }));

  const priorityData = Object.entries(ticketStats.byPriority).map(([name, value]) => ({
   name,
   value,
  }));

  const assigneeData = Object.entries(ticketStats.byAssignee).map(([name, stats]) => ({
   name,
   count: stats.count,
   avgTime: Math.round(stats.avgTime),
  }));

  return (
   <div className="space-y-6">
    {/* Header com controles */}
    <div className="flex items-center justify-between">
     <h2 className="text-xl font-semibold">Dados Operacionais</h2>
     <div className="flex items-center gap-4">
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      <LoadingState lastUpdated={operational.lastUpdated} />
     </div>
    </div>

    {/* KPIs */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
     <KPICard
      title="Total de Tickets"
      value={ticketStats.totalTickets}
      subtitle="Todos os tickets"
      icon={<Wrench className="h-5 w-5" />}
     />
     <KPICard
      title="Tickets Abertos"
      value={ticketStats.openTickets}
      subtitle="Aguardando atenção"
      icon={<Activity className="h-5 w-5" />}
     />
     <KPICard
      title="Em Andamento"
      value={ticketStats.inProgressTickets}
      subtitle="Sendo resolvidos"
      icon={<Clock className="h-5 w-5" />}
     />
     <KPICard
      title="Tempo Médio"
      value={`${ticketStats.averageResolutionTime} min`}
      subtitle="Tempo de resolução"
      icon={<TrendingUp className="h-5 w-5" />}
     />
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     {/* Category Distribution */}
     <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Tickets por Categoria</h3>
      <ResponsiveContainer width="100%" height={350}>
       <PieChart>
        <Pie
         data={categoryData}
         dataKey="value"
         nameKey="name"
         cx="50%"
         cy="45%"
         outerRadius={80}
         label={false}
        >
         {categoryData.map((_, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
         ))}
        </Pie>
        <Tooltip />
        <Legend
         layout="horizontal"
         verticalAlign="bottom"
         align="center"
         wrapperStyle={{ paddingTop: '20px' }}
         iconSize={10}
        />
       </PieChart>
      </ResponsiveContainer>
     </div>

     {/* Priority Distribution */}
     <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Tickets por Prioridade</h3>
      <ResponsiveContainer width="100%" height={300}>
       <BarChart data={priorityData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#0088FE" />
       </BarChart>
      </ResponsiveContainer>
     </div>
    </div>

    {/* Team Performance Table */}
    <div className="bg-white rounded-lg shadow p-6">
     <h3 className="text-lg font-semibold mb-4">Performance da Equipe</h3>
     <DataTable
      data={assigneeData}
      columns={[
       { header: 'Responsável', accessor: 'name', align: 'left' },
       { header: 'Tickets', accessor: 'count', align: 'right' },
       {
        header: 'Tempo Médio (min)',
        accessor: (row) => row.avgTime || '-',
        align: 'right',
       },
      ]}
     />
    </div>
   </div>
  );
 }

 // Render Commercial Tab
 function renderCommercialTab() {
  if (commercial.loading) {
   return (
    <div className="flex items-center justify-center h-64">
     <LoadingState lastUpdated={null} loading={true} />
    </div>
   );
  }

  if (commercial.error) {
   return (
    <div className="text-red-500 p-4 bg-red-50 rounded-lg">
     Erro ao carregar dados comerciais: {commercial.error.message}
    </div>
   );
  }

  if (!commercial.data) return null;

  const { bookingStats, occupancy, cancellations, guestSummary, financials } = commercial.data;

  // Prepare chart data
  const sourceData = Object.entries(bookingStats.bySource).map(([name, value]) => ({
   name,
   value,
  }));

  return (
   <div className="space-y-6">
    {/* Header com controles */}
    <div className="flex items-center justify-between">
     <h2 className="text-xl font-semibold">Dados Comerciais</h2>
     <div className="flex items-center gap-4">
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      <LoadingState lastUpdated={commercial.lastUpdated} />
     </div>
    </div>

    {/* KPIs */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
     <KPICard
      title="Taxa de Cancelamento"
      value={`${bookingStats.cancellationRate}%`}
      subtitle={`${bookingStats.canceledBookings} de ${bookingStats.totalBookings} reservas`}
      icon={<XCircle className="h-5 w-5" />}
     />
     <KPICard
      title="Lead Time Médio"
      value={`${bookingStats.averageLeadTime} dias`}
      subtitle="Antecedência da reserva"
      icon={<Calendar className="h-5 w-5" />}
     />
     <KPICard
      title="Permanência Média"
      value={`${bookingStats.averageStayLength} noites`}
      subtitle="Duração das estadias"
      icon={<Clock className="h-5 w-5" />}
     />
     <KPICard
      title="Hóspedes Únicos"
      value={guestSummary.totalUniqueGuests}
      subtitle={`${guestSummary.returningGuestsRate}% retornantes`}
      icon={<Users className="h-5 w-5" />}
     />
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     {/* Reservation Sources */}
     <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Origem das Reservas</h3>
      <ResponsiveContainer width="100%" height={350}>
       <PieChart>
        <Pie
         data={sourceData}
         dataKey="value"
         nameKey="name"
         cx="50%"
         cy="45%"
         outerRadius={80}
         label={false}
        >
         {sourceData.map((_, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
         ))}
        </Pie>
        <Tooltip />
        <Legend
         layout="horizontal"
         verticalAlign="bottom"
         align="center"
         wrapperStyle={{ paddingTop: '20px' }}
         iconSize={10}
        />
       </PieChart>
      </ResponsiveContainer>
     </div>

     {/* Occupancy by Property */}
     <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Ocupação por Propriedade</h3>
      <ResponsiveContainer width="100%" height={300}>
       <BarChart data={occupancy.slice(0, 10)}>
        <XAxis dataKey="propertyCode" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="occupancyRate" fill="#00C49F" />
       </BarChart>
      </ResponsiveContainer>
     </div>
    </div>

    {/* Property Rankings */}
    <div className="bg-white rounded-lg shadow p-6">
     <h3 className="text-lg font-semibold mb-4">Ranking de Propriedades</h3>
     <DataTable
      data={financials.byProperty.slice(0, 10)}
      columns={[
       {
        header: 'Propriedade',
        accessor: (row) => row.propertyName || row.propertyCode,
        align: 'left',
       },
       {
        header: 'Receita',
        accessor: (row) => formatCurrency(row.totalRevenue),
        align: 'right',
       },
       { header: 'Reservas', accessor: 'bookingCount', align: 'right' },
       {
        header: 'ADR',
        accessor: (row) => formatCurrency(row.averageDailyRate),
        align: 'right',
       },
      ]}
     />
    </div>

    {/* Channel Performance */}
    <div className="bg-white rounded-lg shadow p-6">
     <h3 className="text-lg font-semibold mb-4">Performance por Canal</h3>
     <DataTable
      data={financials.byChannel}
      columns={[
       { header: 'Canal', accessor: 'channel', align: 'left' },
       {
        header: 'Receita',
        accessor: (row) => formatCurrency(row.revenue),
        align: 'right',
       },
       { header: 'Reservas', accessor: 'bookingsCount', align: 'right' },
       {
        header: 'Valor Médio',
        accessor: (row) => formatCurrency(row.averageValue),
        align: 'right',
       },
       {
        header: 'Participação',
        accessor: (row) => `${(row.percentage || 0).toFixed(1)}%`,
        align: 'right',
       },
      ]}
     />
    </div>
   </div>
  );
 }

 // Render Guest Team Tab
 function renderGuestTeamTab() {
  if (guestTeam.loading) {
   return (
    <div className="flex items-center justify-center h-64">
     <LoadingState lastUpdated={null} loading={true} />
    </div>
   );
  }

  if (guestTeam.error) {
   return (
    <div className="text-red-500 p-4 bg-red-50 rounded-lg">
     Erro ao carregar dados da equipe: {guestTeam.error.message}
    </div>
   );
  }

  if (!guestTeam.data) return null;

  const { members, distribution, monthlyComparison } = guestTeam.data;

  // Prepare chart data
  const distributionData = Object.entries(distribution).map(([name, value]) => ({
   name,
   value,
  }));

  const comparisonData = members.map((member) => ({
   name: member.userName,
   mesAtual: monthlyComparison.currentMonth[member.userName] || 0,
   mesAnterior: monthlyComparison.previousMonth[member.userName] || 0,
  }));

  return (
   <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
     <h2 className="text-xl font-semibold">Equipe Guest Relations</h2>
     <div className="flex items-center gap-4">
      <LoadingState lastUpdated={guestTeam.lastUpdated} />
     </div>
    </div>

    {/* KPIs */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
     <KPICard
      title="Total de Membros"
      value={members.length}
      subtitle="Equipe ativa"
      icon={<Users className="h-5 w-5" />}
     />
     <KPICard
      title="Reservas Atribuídas"
      value={Object.values(distribution).reduce((a, b) => a + b, 0)}
      subtitle="Total geral"
      icon={<Briefcase className="h-5 w-5" />}
     />
     <KPICard
      title="Avaliação Média"
      value={
       members.length > 0
        ? (
          members.reduce((sum, m) => sum + (m.averageRating || 0), 0) / members.length
         ).toFixed(1)
        : '0.0'
      }
      subtitle="Satisfação geral"
      icon={<TrendingUp className="h-5 w-5" />}
     />
     <KPICard
      title="Receita Total"
      value={formatCurrency(members.reduce((sum, m) => sum + (m.totalRevenue || 0), 0))}
      subtitle="Gerada pela equipe"
      icon={<DollarSign className="h-5 w-5" />}
     />
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
     {/* Distribution */}
     <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Distribuição de Reservas</h3>
      <ResponsiveContainer width="100%" height={350}>
       <PieChart>
        <Pie
         data={distributionData}
         dataKey="value"
         nameKey="name"
         cx="50%"
         cy="45%"
         outerRadius={80}
         label={false}
        >
         {distributionData.map((_, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
         ))}
        </Pie>
        <Tooltip />
        <Legend
         layout="horizontal"
         verticalAlign="bottom"
         align="center"
         wrapperStyle={{ paddingTop: '20px' }}
         iconSize={10}
        />
       </PieChart>
      </ResponsiveContainer>
     </div>

     {/* Monthly Comparison */}
     <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Comparação Mensal</h3>
      <ResponsiveContainer width="100%" height={300}>
       <BarChart data={comparisonData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="mesAtual" fill="#0088FE" name="Mês Atual" />
        <Bar dataKey="mesAnterior" fill="#00C49F" name="Mês Anterior" />
       </BarChart>
      </ResponsiveContainer>
     </div>
    </div>

    {/* Team Performance Table */}
    <div className="bg-white rounded-lg shadow p-6">
     <h3 className="text-lg font-semibold mb-4">Performance Individual</h3>
     <DataTable
      data={members}
      columns={[
       { header: 'Nome', accessor: 'userName', align: 'left' },
       { header: 'Total Reservas', accessor: 'totalReservations', align: 'right' },
       { header: 'Mês Atual', accessor: 'currentMonthReservations', align: 'right' },
       { header: 'Futuras', accessor: 'futureReservations', align: 'right' },
       {
        header: 'Avaliação',
        accessor: (row) =>
         row.ratingsCount > 0 ? `${(row.averageRating || 0).toFixed(1)} ⭐` : '-',
        align: 'right',
       },
       {
        header: 'Receita Total',
        accessor: (row) => formatCurrency(row.totalRevenue),
        align: 'right',
       },
      ]}
     />
    </div>
   </div>
  );
 }

 return (
  <div className="p-6 space-y-6">
   {/* Tab Navigation */}
   <div className="bg-white rounded-lg shadow">
    <div className="border-b border-gray-200">
     <nav className="flex -mb-px">
      <button
       onClick={() => setActiveTab('commercial')}
       className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
        activeTab === 'commercial'
         ? 'border-blue-500 text-blue-600'
         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
       }`}
      >
       <div className="flex items-center gap-2">
        <Briefcase className="h-5 w-5" />
        <span>Comercial</span>
       </div>
      </button>
      <button
       onClick={() => setActiveTab('operational')}
       className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
        activeTab === 'operational'
         ? 'border-blue-500 text-blue-600'
         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
       }`}
      >
       <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5" />
        <span>Operacional</span>
       </div>
      </button>
      <button
       onClick={() => setActiveTab('guest_team')}
       className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
        activeTab === 'guest_team'
         ? 'border-blue-500 text-blue-600'
         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
       }`}
      >
       <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <span>Equipe Guest</span>
       </div>
      </button>
     </nav>
    </div>
   </div>

   {/* Tab Content */}
   {activeTab === 'operational' && renderOperationalTab()}
   {activeTab === 'commercial' && renderCommercialTab()}
   {activeTab === 'guest_team' && renderGuestTeamTab()}
  </div>
 );
}
