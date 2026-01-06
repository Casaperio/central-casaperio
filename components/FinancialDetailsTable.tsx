import React, { useState, useEffect } from 'react';
import { Loader2, Download, Calendar, Search, X } from 'lucide-react';
import type { ReservationFinancialDetails } from '../services/staysApiService';
import { getDetailedFinancials } from '../services/staysApiService';

interface FinancialDetailsTableProps {
 from?: string;
 to?: string;
 selectedPropertyCodes?: string[];
}

const FinancialDetailsTable: React.FC<FinancialDetailsTableProps> = ({ from, to, selectedPropertyCodes = [] }) => {
 const [reservations, setReservations] = useState<ReservationFinancialDetails[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [searchTerm, setSearchTerm] = useState('');
 const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

 useEffect(() => {
  loadData();
 }, [from, to]);

 const loadData = async () => {
  setLoading(true);
  setError(null);
  try {
   const response = await getDetailedFinancials(from, to);
   setReservations(response.reservations);
  } catch (err) {
   setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
   console.error('Error loading detailed financials:', err);
  } finally {
   setLoading(false);
  }
 };

 const formatCurrency = (val: number) =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

 const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

 const toggleRow = (id: string) => {
  const newExpanded = new Set(expandedRows);
  if (newExpanded.has(id)) {
   newExpanded.delete(id);
  } else {
   newExpanded.add(id);
  }
  setExpandedRows(newExpanded);
 };

 // Aplicar filtros em sequência: 1) imóveis selecionados, 2) busca
 const filteredReservations = reservations
   .filter(r => {
     // Filtro de imóveis selecionados
     if (selectedPropertyCodes.length > 0) {
       return selectedPropertyCodes.includes(r.propertyCode);
     }
     return true;
   })
   .filter(r => {
     // Filtro de busca
     if (!searchTerm) return true;
     const term = searchTerm.toLowerCase();
     return (
       r.guestName.toLowerCase().includes(term) ||
       r.propertyCode.toLowerCase().includes(term) ||
       r.bookingCode.toLowerCase().includes(term)
     );
   });

 const exportToCSV = () => {
  const headers = [
   'Código',
   'Hóspede',
   'Imóvel',
   'Check-in',
   'Check-out',
   'Noites',
   'Canal',
   'Valor por Noite',
   'Total da Reserva',
   'Base Cálculo Imp',
   'Preço Venda Corrig',
   'Comissão Empresa',
   'Preço Compra',
   'Taxa Limpeza',
   'Total Taxas',
  ];

  const rows = filteredReservations.map((r) => [
   r.bookingCode,
   r.guestName,
   r.propertyCode,
   formatDate(r.checkInDate),
   formatDate(r.checkOutDate),
   r.nights,
   r.channel,
   r.pricePerNight,
   r.reserveTotal,
   r.baseAmountForwarding,
   r.sellPriceCorrected,
   r.companyCommission,
   r.buyPrice,
   r.cleaningFee,
   r.totalForwardFee,
  ]);

  const csv = [
   headers.join(','),
   ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `financeiro_detalhado_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
 };

 if (loading) {
  return (
   <div className="flex items-center justify-center py-12">
    <Loader2 className="animate-spin text-gray-400" size={32} />
    <span className="ml-3 text-gray-600">Carregando dados financeiros detalhados...</span>
   </div>
  );
 }

 if (error) {
  return (
   <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
    Erro: {error}
   </div>
  );
 }

 return (
  <div className="space-y-4">
   {/* Header & Controls */}
   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
     <h3 className="text-lg font-bold text-gray-800">Detalhamento Financeiro de Reservas</h3>
     <p className="text-sm text-gray-500">{filteredReservations.length} reservas encontradas</p>
    </div>

    <div className="flex items-center gap-3">
     {/* Search */}
     <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
      <input
       type="text"
       placeholder="Buscar hóspede, imóvel..."
       value={searchTerm}
       onChange={(e) => setSearchTerm(e.target.value)}
       className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      {searchTerm && (
       <button
        onClick={() => setSearchTerm('')}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
       >
        <X size={16} />
       </button>
      )}
     </div>

     {/* Export Button */}
     <button
      onClick={exportToCSV}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
     >
      <Download size={16} />
      Exportar CSV
     </button>
    </div>
   </div>

   {/* Table */}
   <div className="overflow-x-auto bg-white rounded-none border border-gray-200 shadow-sm">
    <table className="w-full text-sm">
     <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Código</th>
       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Hóspede</th>
       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Imóvel</th>
       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Período</th>
       <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Noites</th>
       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Canal</th>
       <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Valor/Noite</th>
       <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total</th>
       <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Comissão</th>
       <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Ações</th>
      </tr>
     </thead>
     <tbody className="divide-y divide-gray-100">
      {filteredReservations.map((reservation) => {
       const isExpanded = expandedRows.has(reservation.reservationId);
       return (
        <React.Fragment key={reservation.reservationId}>
         {/* Main Row */}
         <tr className="hover:bg-gray-50 transition-colors">
          <td className="px-4 py-3 font-medium text-gray-900">{reservation.bookingCode}</td>
          <td className="px-4 py-3 text-gray-700">{reservation.guestName}</td>
          <td className="px-4 py-3 text-gray-700 font-mono text-xs">{reservation.propertyCode}</td>
          <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
           <div className="flex items-center gap-1">
            <Calendar size={12} className="text-gray-400" />
            {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
           </div>
          </td>
          <td className="px-4 py-3 text-center text-gray-700">{reservation.nights}</td>
          <td className="px-4 py-3 text-gray-600 text-xs">{reservation.channel}</td>
          <td className="px-4 py-3 text-right font-medium text-gray-900">
           {formatCurrency(reservation.pricePerNight)}
          </td>
          <td className="px-4 py-3 text-right font-bold text-green-700">
           {formatCurrency(reservation.reserveTotal)}
          </td>
          <td className="px-4 py-3 text-right font-medium text-blue-700">
           {formatCurrency(reservation.companyCommission)}
          </td>
          <td className="px-4 py-3 text-center">
           <button
            onClick={() => toggleRow(reservation.reservationId)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
           >
            {isExpanded ? 'Ocultar' : 'Ver Mais'}
           </button>
          </td>
         </tr>

         {/* Expanded Row */}
         {isExpanded && (
          <tr className="bg-gray-50">
           <td colSpan={10} className="px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
             <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Base Cálculo Imp</p>
              <p className="font-semibold text-gray-900">
               {formatCurrency(reservation.baseAmountForwarding)}
              </p>
             </div>
             <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Preço Venda Corrig</p>
              <p className="font-semibold text-gray-900">
               {formatCurrency(reservation.sellPriceCorrected)}
              </p>
             </div>
             <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Preço de Compra</p>
              <p className="font-semibold text-gray-900">{formatCurrency(reservation.buyPrice)}</p>
             </div>
             <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Taxa de Limpeza</p>
              <p className="font-semibold text-gray-900">{formatCurrency(reservation.cleaningFee)}</p>
             </div>
             <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Total de Taxas</p>
              <p className="font-semibold text-amber-700">
               {formatCurrency(reservation.totalForwardFee)}
              </p>
             </div>
             {reservation.ownerFees.length > 0 && (
              <div className="col-span-2">
               <p className="text-xs text-gray-500 font-medium mb-1">Taxas do Proprietário</p>
               <div className="space-y-1">
                {reservation.ownerFees.map((fee, idx) => (
                 <p key={idx} className="text-xs text-gray-700">
                  {fee.name}: {formatCurrency(fee.value)}
                 </p>
                ))}
               </div>
              </div>
             )}
            </div>
           </td>
          </tr>
         )}
        </React.Fragment>
       );
      })}
     </tbody>
    </table>

    {filteredReservations.length === 0 && (
     <div className="text-center py-12 text-gray-500">
      <p>Nenhuma reserva encontrada para o período selecionado.</p>
     </div>
    )}
   </div>
  </div>
 );
};

export default FinancialDetailsTable;
