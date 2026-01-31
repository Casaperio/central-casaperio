
import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, Reservation } from '../types';
import { FileText, Download, Search, Wrench, DollarSign, Home, User, Filter } from 'lucide-react';

interface ReportsPanelProps {
 tickets: Ticket[];
 reservations?: Reservation[];
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({ tickets, reservations = [] }) => {
 const [activeReport, setActiveReport] = useState<'maintenance' | 'financial' | 'occupancy'>('maintenance');
 const [searchTerm, setSearchTerm] = useState('');
 const [startDate, setStartDate] = useState('');
 const [endDate, setEndDate] = useState('');
 
 // New Filter State
 const [assigneeFilter, setAssigneeFilter] = useState('all');

 // Extract unique assignees for filter
 const uniqueAssignees = useMemo(() => {
  const assignees = new Set<string>();
  tickets.forEach(t => {
   if (t.assignee) assignees.add(t.assignee);
  });
  return Array.from(assignees).sort();
 }, [tickets]);

 // --- MAINTENANCE DATA LOGIC ---
 const processedMaintenance = useMemo(() => {
  return tickets.map(ticket => {
   const totalExpenses = ticket.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
   return { ...ticket, totalExpenses };
  }).filter(t => {
   const matchSearch = t.propertyCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
             t.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
             t.description.toLowerCase().includes(searchTerm.toLowerCase());
   
   let matchDate = true;
   if (startDate) matchDate = matchDate && t.createdAt >= new Date(startDate).getTime();
   if (endDate) matchDate = matchDate && t.createdAt <= (new Date(endDate).getTime() + 86400000); // End of day

   const matchAssignee = assigneeFilter === 'all' || t.assignee === assigneeFilter;

   return matchSearch && matchDate && matchAssignee;
  });
 }, [tickets, searchTerm, startDate, endDate, assigneeFilter]);

 const maintenanceTotal = processedMaintenance.reduce((sum, t) => sum + t.totalExpenses, 0);

 // --- FINANCIAL & OCCUPANCY DATA LOGIC ---
 const processedReservations = useMemo(() => {
   return reservations.filter(r => {
     const matchSearch = r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) || r.propertyCode.toLowerCase().includes(searchTerm.toLowerCase());
     let matchDate = true;
     // Use CheckIn date for financial reporting filter
     const checkInTime = new Date(r.checkInDate).getTime();
     if (startDate) matchDate = matchDate && checkInTime >= new Date(startDate).getTime();
     if (endDate) matchDate = matchDate && checkInTime <= (new Date(endDate).getTime() + 86400000);
     return matchSearch && matchDate;
   }).sort((a,b) => {
     if (activeReport === 'occupancy') {
       // Sort by Property then Date for Occupancy
       if (a.propertyCode === b.propertyCode) {
         return new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime();
       }
       return a.propertyCode.localeCompare(b.propertyCode);
     }
     // Sort by Date for Financial
     return new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime();
   });
 }, [reservations, searchTerm, startDate, endDate, activeReport]);

 const revenueTotal = processedReservations.reduce((sum, r) => sum + (r.totalValue || 0), 0);

 // Helper to calculate financial breakdown (Simulation based on Stays logic)
 const calculateFinancials = (r: Reservation) => {
   const total = r.totalValue || 0;
   let channelFee = 0;
   const channelName = (r.channel || '').toLowerCase();

   // Estimated Channel Fees
   if (channelName.includes('airbnb')) channelFee = total * 0.15; // ~15%
   else if (channelName.includes('booking')) channelFee = total * 0.18; // ~18%
   else if (channelName.includes('expedia')) channelFee = total * 0.20; // ~20%
   else channelFee = 0; // Direct

   const netRevenue = total - channelFee;
   
   // Estimated Splits (Standard Management Model)
   // Owner gets ~75-80% of Net, Company gets remainder
   const ownerAmount = netRevenue * 0.75; 
   const companyAmount = netRevenue * 0.25;

   return {
     total,
     channelFee,
     ownerAmount,
     companyAmount
   };
 };

 // --- EXPORT ---
 const handleExportCSV = () => {
  let headers: string[] = [];
  let rows: string[] = [];
  const sanitize = (s: string) => `"${s?.toString().replace(/"/g, '""').replace(/\n/g, ' ')}"`;

  if (activeReport === 'maintenance') {
    headers = ['ID', 'Imóvel', 'Responsável', 'Tipo', 'Status', 'Data', 'Custo Total'];
    rows = processedMaintenance.map(t => [
      sanitize(t.id), sanitize(t.propertyCode), sanitize(t.assignee || 'N/A'), sanitize(t.serviceType), sanitize(t.status), 
      new Date(t.createdAt).toLocaleDateString(), t.totalExpenses.toFixed(2).replace('.', ',')
    ].join(';'));
  } else if (activeReport === 'financial') {
    headers = ['Reserva', 'Imóvel', 'Hóspede', 'Check-in', 'Canal', 'Valor Total', 'Taxa Canal', 'Repasse Prop.', 'Receita Casapē'];
    rows = processedReservations.map(r => {
      const f = calculateFinancials(r);
      return [
        sanitize(r.id), sanitize(r.propertyCode), sanitize(r.guestName),
        new Date(r.checkInDate).toLocaleDateString(), sanitize(r.channel || 'Direto'),
        f.total.toFixed(2).replace('.', ','),
        f.channelFee.toFixed(2).replace('.', ','),
        f.ownerAmount.toFixed(2).replace('.', ','),
        f.companyAmount.toFixed(2).replace('.', ',')
      ].join(';');
    });
  } else if (activeReport === 'occupancy') {
    headers = ['Imóvel', 'Hóspede', 'Check-in', 'Check-out', 'Noites', 'Origem', 'Valor'];
    rows = processedReservations.map(r => [
      sanitize(r.propertyCode), sanitize(r.guestName), 
      new Date(r.checkInDate).toLocaleDateString(), new Date(r.checkOutDate).toLocaleDateString(),
      sanitize((r.nights || 0).toString()), sanitize(r.channel || 'Direto'),
      (r.totalValue || 0).toFixed(2).replace('.', ',')
    ].join(';'));
  }

  const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `relatorio_${activeReport}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
 };

 return (
  <div className="space-y-6 animate-fade-in pb-20">
   {/* Header */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div className="flex items-center gap-3">
     <div className="bg-purple-100 p-2 rounded-lg text-purple-700">
      <FileText size={24} />
     </div>
     <div>
      <h2 className="text-2xl font-heading font-bold text-gray-900">Central de Relatórios</h2>
      <p className="text-gray-500 text-sm">Extraia dados detalhados para gestão.</p>
     </div>
    </div>
    
    <button 
     onClick={handleExportCSV}
     className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 font-medium transition-all"
    >
     <Download size={18} /> Exportar Excel
    </button>
   </div>

   {/* Report Type Selector - Grid Layout Fix */}
   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
     <button 
      onClick={() => setActiveReport('maintenance')}
      className={`p-4 rounded-none border flex items-center gap-3 transition-all shadow-sm ${activeReport === 'maintenance' ? 'bg-brand-50 border-brand-200 text-brand-800 ring-1 ring-brand-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
     >
       <div className={`p-2 rounded-lg ${activeReport === 'maintenance' ? 'bg-white' : 'bg-gray-100'}`}><Wrench size={20}/></div>
       <div className="text-left">
         <span className="block text-xs font-bold uppercase tracking-wider opacity-70">Operacional</span>
         <span className="font-bold text-lg">Manutenção</span>
       </div>
     </button>

     <button 
      onClick={() => setActiveReport('financial')}
      className={`p-4 rounded-none border flex items-center gap-3 transition-all shadow-sm ${activeReport === 'financial' ? 'bg-green-50 border-green-200 text-green-800 ring-1 ring-green-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
     >
       <div className={`p-2 rounded-lg ${activeReport === 'financial' ? 'bg-white' : 'bg-gray-100'}`}><DollarSign size={20}/></div>
       <div className="text-left">
         <span className="block text-xs font-bold uppercase tracking-wider opacity-70">Financeiro</span>
         <span className="font-bold text-lg">Receita</span>
       </div>
     </button>

     <button 
      onClick={() => setActiveReport('occupancy')}
      className={`p-4 rounded-none border flex items-center gap-3 transition-all shadow-sm ${activeReport === 'occupancy' ? 'bg-blue-50 border-blue-200 text-blue-800 ring-1 ring-blue-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
     >
       <div className={`p-2 rounded-lg ${activeReport === 'occupancy' ? 'bg-white' : 'bg-gray-100'}`}><Home size={20}/></div>
       <div className="text-left">
         <span className="block text-xs font-bold uppercase tracking-wider opacity-70">Comercial</span>
         <span className="font-bold text-lg">Ocupação</span>
       </div>
     </button>
   </div>

   {/* Filters */}
   <div className="bg-white p-4 rounded-none shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
     <div className="relative flex-1 w-full">
      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar</label>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input 
        type="text" 
        placeholder={activeReport === 'maintenance' ? "Buscar por imóvel, serviço..." : "Buscar por hóspede, imóvel..."} 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>
     </div>
     
     {activeReport === 'maintenance' && (
       <div className="w-full md:w-48">
         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Responsável</label>
         <div className="relative">
           <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
           <select 
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none"
           >
             <option value="all">Todos</option>
             {uniqueAssignees.map(u => (
               <option key={u} value={u}>{u}</option>
             ))}
           </select>
           <Filter className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={14} />
         </div>
       </div>
     )}

     <div className="flex gap-2 w-full md:w-auto">
      <div className="flex-1">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Início</label>
        <input 
          type="date" 
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full pl-3 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Final</label>
        <input 
          type="date" 
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full pl-3 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>
     </div>
   </div>

   {/* Summary Row */}
   <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
     <span className="font-bold text-gray-600 uppercase text-xs">Resumo do Período:</span>
     {activeReport === 'maintenance' ? (
       <>
        <span className="bg-white px-3 py-1 rounded border border-gray-200 text-gray-800">Total: <strong>{processedMaintenance.length}</strong> chamados</span>
        <span className="bg-white px-3 py-1 rounded border border-gray-200 text-gray-800">Custo Total: <strong>R$ {maintenanceTotal.toFixed(2)}</strong></span>
       </>
     ) : (
       <>
        <span className="bg-white px-3 py-1 rounded border border-gray-200 text-gray-800">Total: <strong>{processedReservations.length}</strong> reservas</span>
        <span className="bg-white px-3 py-1 rounded border border-gray-200 text-gray-800">Receita Bruta: <strong>R$ {revenueTotal.toFixed(2)}</strong></span>
       </>
     )}
   </div>

   {/* Tables */}
   <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
    <div className="overflow-x-auto">
     <table className="w-full text-left text-sm">
      <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
       <tr>
        {activeReport === 'maintenance' ? (
          <>
            <th className="p-4">Chamado / Imóvel</th>
            <th className="p-4">Responsável</th>
            <th className="p-4">Tipo</th>
            <th className="p-4">Data</th>
            <th className="p-4 text-right">Custo (R$)</th>
          </>
        ) : activeReport === 'financial' ? (
          <>
            <th className="p-4">Imóvel</th>
            <th className="p-4">Hóspede</th>
            <th className="p-4">Canal</th>
            <th className="p-4 text-right bg-gray-100 border-l border-gray-200">Valor Total</th>
            <th className="p-4 text-right text-red-600 border-l border-gray-100">Taxa Canal</th>
            <th className="p-4 text-right text-blue-600 border-l border-gray-100">Repasse Prop.</th>
            <th className="p-4 text-right text-green-600 border-l border-gray-100">Receita Casapē</th>
          </>
        ) : (
          // Occupancy Columns
          <>
            <th className="p-4">Imóvel</th>
            <th className="p-4">Hóspede</th>
            <th className="p-4">Check-in / Check-out</th>
            <th className="p-4 text-center">Noites</th>
            <th className="p-4 text-center">Origem</th>
            <th className="p-4 text-right">Valor Estadia</th>
          </>
        )}
       </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
       
       {/* MAINTENANCE ROWS */}
       {activeReport === 'maintenance' && processedMaintenance.map(ticket => (
        <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
          <td className="p-4">
            <div className="font-bold text-gray-900">{ticket.propertyCode}</div>
            <div className="text-xs text-gray-500">{ticket.status}</div>
          </td>
          <td className="p-4 text-gray-700 font-medium">{ticket.assignees && ticket.assignees.length > 0 ? ticket.assignees.join(' • ') : ticket.assignee || '-'}</td>
          <td className="p-4 text-gray-700">{ticket.serviceType}</td>
          <td className="p-4 text-gray-600">{new Date(ticket.createdAt).toLocaleDateString()}</td>
          <td className="p-4 text-right font-bold text-gray-800">R$ {ticket.totalExpenses.toFixed(2).replace('.', ',')}</td>
        </tr>
       ))}

       {/* FINANCIAL ROWS */}
       {activeReport === 'financial' && processedReservations.map(res => {
         const fin = calculateFinancials(res);
         return (
          <tr key={res.id} className="hover:bg-gray-50 transition-colors">
            <td className="p-4 font-medium text-gray-900">{res.propertyCode}</td>
            <td className="p-4 text-gray-700">
              {res.guestName}
              <div className="text-xs text-gray-400">{new Date(res.checkInDate).toLocaleDateString()}</div>
            </td>
            <td className="p-4">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold uppercase">{res.channel || 'Direto'}</span>
            </td>
            <td className="p-4 text-right font-bold text-gray-900 bg-gray-50/50 border-l border-gray-200">
              R$ {fin.total.toFixed(2).replace('.', ',')}
            </td>
            <td className="p-4 text-right text-red-600 border-l border-gray-100 text-xs">
              - R$ {fin.channelFee.toFixed(2).replace('.', ',')}
            </td>
            <td className="p-4 text-right text-blue-600 border-l border-gray-100">
              R$ {fin.ownerAmount.toFixed(2).replace('.', ',')}
            </td>
            <td className="p-4 text-right font-bold text-green-700 border-l border-gray-100">
              R$ {fin.companyAmount.toFixed(2).replace('.', ',')}
            </td>
          </tr>
         );
       })}

       {/* OCCUPANCY ROWS */}
       {activeReport === 'occupancy' && processedReservations.map(res => (
        <tr key={res.id} className="hover:bg-gray-50 transition-colors">
          <td className="p-4 font-bold text-gray-900">{res.propertyCode}</td>
          <td className="p-4 text-gray-700">{res.guestName}</td>
          <td className="p-4 text-gray-600 text-xs">
            {new Date(res.checkInDate).toLocaleDateString()} <span className="text-gray-400">{'->'}</span> {new Date(res.checkOutDate).toLocaleDateString()}
          </td>
          <td className="p-4 text-center font-medium text-gray-800">
            {res.nights || 0}
          </td>
          <td className="p-4 text-center">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold uppercase">{res.channel || 'Direto'}</span>
          </td>
          <td className="p-4 text-right font-medium text-gray-700">
            R$ {(res.totalValue || 0).toFixed(2).replace('.', ',')}
          </td>
        </tr>
       ))}

       {((activeReport === 'maintenance' && processedMaintenance.length === 0) || 
        (activeReport !== 'maintenance' && processedReservations.length === 0)) && (
        <tr>
         <td colSpan={7} className="p-8 text-center text-gray-400">
          Nenhum registro encontrado para o filtro selecionado.
         </td>
        </tr>
       )}
      </tbody>
     </table>
    </div>
   </div>
  </div>
 );
};

export default ReportsPanel;
