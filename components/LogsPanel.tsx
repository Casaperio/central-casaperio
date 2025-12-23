import React, { useState, useMemo } from 'react';
import { LogEntry } from '../types';
import { ScrollText, Search, Clock, User, Activity } from 'lucide-react';

interface LogsPanelProps {
 logs: LogEntry[];
}

const LogsPanel: React.FC<LogsPanelProps> = ({ logs }) => {
 const [searchTerm, setSearchTerm] = useState('');

 const filteredLogs = useMemo(() => {
  return logs
   .filter(log => 
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
   )
   .sort((a, b) => b.timestamp - a.timestamp);
 }, [logs, searchTerm]);

 return (
  <div className="space-y-6">
   <div className="flex items-center gap-3 mb-6">
    <div className="bg-brand-100 p-2 rounded-lg text-brand-700">
     <ScrollText size={24} />
    </div>
    <div>
     <h2 className="text-2xl font-heading font-bold text-gray-900">Logs do Sistema</h2>
     <p className="text-gray-500 text-sm">Registro de auditoria de todas as ações realizadas.</p>
    </div>
   </div>

   <div className="relative">
    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
    <input 
     type="text" 
     placeholder="Buscar nos logs..." 
     value={searchTerm}
     onChange={(e) => setSearchTerm(e.target.value)}
     className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm mb-4"
    />
   </div>

   <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
    <div className="overflow-x-auto">
     <table className="w-full text-left text-sm">
      <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
       <tr>
        <th className="p-4 w-48">Data e Hora</th>
        <th className="p-4 w-48">Responsável</th>
        <th className="p-4 w-48">Ação</th>
        <th className="p-4">Detalhes</th>
       </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
       {filteredLogs.map(log => (
        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
         <td className="p-4 text-gray-500 whitespace-nowrap">
          <div className="flex items-center gap-2">
           <Clock size={14} />
           {new Date(log.timestamp).toLocaleString('pt-BR')}
          </div>
         </td>
         <td className="p-4 font-medium text-gray-900">
          <div className="flex items-center gap-2">
           <User size={14} className="text-gray-400" />
           {log.userName}
          </div>
         </td>
         <td className="p-4 text-brand-700 font-medium">
          <div className="flex items-center gap-2">
           <Activity size={14} />
           {log.action}
          </div>
         </td>
         <td className="p-4 text-gray-600 break-words max-w-xs sm:max-w-none">
          {log.details}
         </td>
        </tr>
       ))}
       {filteredLogs.length === 0 && (
        <tr>
         <td colSpan={4} className="p-8 text-center text-gray-400">
          Nenhum registro encontrado.
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

export default LogsPanel;