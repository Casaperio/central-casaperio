import React, { useState } from 'react';
import { Ticket, TicketStatus } from '../types';
import { X, Calendar, User, Clock, CheckCircle2, AlertTriangle, FileText, Shield, DollarSign, Plus, Trash2, ChevronLeft, LogOut, MessageSquare } from 'lucide-react';
import { generateId } from '../utils';

interface TicketDetailModalProps {
 ticket: Ticket;
 onClose: () => void;
 onUpdateStatus: (id: string, status: TicketStatus, date?: string, startedAt?: number, completionReport?: Ticket['completionReport']) => void;
 onAssign: (id: string, assignee: string, date: string) => void;
 onAddExpense: (ticketId: string, description: string, amount: number) => void;
 onDeleteExpense: (ticketId: string, expenseId: string) => void;
 onDeleteTicket: (id: string) => void;
 onDismissCheckoutTicket?: (ticket: Ticket) => void;
 onSaveObservations: (ticketId: string, observationText: string, userName: string) => void;
 allUsers: { name: string; role: string }[];
 currentUser?: { id: string; name: string };
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, onClose, onUpdateStatus, onAssign, onAddExpense, onDeleteExpense, onDeleteTicket, onDismissCheckoutTicket, onSaveObservations, allUsers, currentUser }) => {
 const isUrgent = ticket.priority.toLowerCase().includes('urgente');
 const isVirtualTicket = (ticket as any)._isVirtual === true;
 const [showCompletionDate, setShowCompletionDate] = useState(false);
 const [completionDate, setCompletionDate] = useState(() => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
 });

 const [assignMode, setAssignMode] = useState(false);
 const [tempAssignee, setTempAssignee] = useState(ticket.assignee || '');
 const [tempScheduledDate, setTempScheduledDate] = useState(ticket.scheduledDate || '');

 // Expense State
 const [expenseDesc, setExpenseDesc] = useState('');
 const [expenseAmount, setExpenseAmount] = useState('');
 const [showExpenseForm, setShowExpenseForm] = useState(false);

 // Task 38: Completion Report State (optional comment and attachment)
 const [showCompletionReport, setShowCompletionReport] = useState(false);
 const [completionNotes, setCompletionNotes] = useState('');
 const [completionPhoto, setCompletionPhoto] = useState<string | null>(null);

 // Observações Internas State
 const [observationText, setObservationText] = useState('');
 const [showObservationForm, setShowObservationForm] = useState(false);

 const renderStatusBadge = (status: TicketStatus) => {
  switch (status) {
   case TicketStatus.OPEN: return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap">Aberto</span>;
   case TicketStatus.IN_PROGRESS: return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap">Em Andamento</span>;
   case TicketStatus.DONE: return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap">Concluído</span>;
  }
 };

 const handleAssignSubmit = () => {
  if (tempAssignee && tempScheduledDate) {
   onAssign(ticket.id, tempAssignee, tempScheduledDate);
   setAssignMode(false);
  } else {
   alert("Selecione um responsável e uma data de realização.");
  }
 };

 const handleStartTicket = () => {
  if (!ticket.assignee || ticket.assignee === 'Não atribuído') {
   alert("Para iniciar o chamado, é necessário atribuir um responsável técnico primeiro.");
   setAssignMode(true);
   return;
  }
  onUpdateStatus(ticket.id, TicketStatus.IN_PROGRESS, undefined, Date.now());
 };

 // Task 38: Handle file upload and convert to base64
 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
   const reader = new FileReader();
   reader.onloadend = () => {
    setCompletionPhoto(reader.result as string);
   };
   reader.readAsDataURL(file);
  }
 };

 const handleCompletionSubmit = () => {
  if (completionDate) {
   // Task 38: Build completion report if user added notes or photo
   let completionReport = undefined;
   if (completionNotes || completionPhoto) {
    completionReport = {
     condition: 'perfect' as const,
     notes: completionNotes || undefined,
     photos: completionPhoto ? [completionPhoto] : undefined,
    };
   }

   onUpdateStatus(ticket.id, TicketStatus.DONE, completionDate, undefined, completionReport);
   setShowCompletionDate(false);
   setShowCompletionReport(false);
   setCompletionNotes('');
   setCompletionPhoto(null);
  } else {
   alert("Informe a data de conclusão.");
  }
 };

 const handleAddExpenseSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!expenseDesc || !expenseAmount) return;
  
  const amount = parseFloat(expenseAmount.replace(',', '.'));
  if (isNaN(amount) || amount <= 0) {
   alert("Valor inválido");
   return;
  }

  onAddExpense(ticket.id, expenseDesc, amount);
  setExpenseDesc('');
  setExpenseAmount('');
  setShowExpenseForm(false);
 };

 const handleSaveObservation = () => {
  if (!observationText.trim()) {
   alert("Digite uma observação antes de salvar.");
   return;
  }
  
  const userName = currentUser?.name || 'Usuário';
  onSaveObservations(ticket.id, observationText.trim(), userName);
  setObservationText('');
  setShowObservationForm(false);
 };

 const handleDelete = () => {
  if (window.confirm("Tem certeza que deseja excluir este chamado permanentemente?")) {
   onDeleteTicket(ticket.id);
   onClose();
  }
 };

 const handleDismiss = () => {
  if (window.confirm("Dispensar este chamado de checkout da lista de manutenção?\n\nEle não aparecerá mais na visualização.")) {
   if (onDismissCheckoutTicket) {
    onDismissCheckoutTicket(ticket);
    onClose();
   }
  }
 };

 return (
  <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 animate-in fade-in slide-in-from-bottom-5">
   <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-none shadow-2xl overflow-hidden flex flex-col">
    
    {/* Header */}
    <div className={`flex justify-between items-start p-4 md:p-6 border-b border-gray-100 sticky top-0 z-10 flex-shrink-0 ${isUrgent ? 'bg-orange-50' : 'bg-white'}`}>
     <div className="flex-1 pr-4 min-w-0">
       <div className="md:hidden mb-2">
         <button onClick={onClose} className="flex items-center text-gray-500 -ml-2 p-1 active:bg-gray-100 rounded">
          <ChevronLeft size={20} /> <span className="font-medium">Voltar</span>
         </button>
       </div>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
       <span className="text-sm font-mono text-gray-400">#{ticket.id.slice(-4)}</span>
       {renderStatusBadge(ticket.status)}
      </div>
      <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-900 leading-tight truncate">{ticket.propertyCode}</h2>
      <p className="text-gray-500 text-sm truncate">{ticket.propertyName}</p>
     </div>
     <button onClick={onClose} className="hidden md:block p-2 hover:bg-black/5 rounded-full transition-colors">
      <X size={24} className="text-gray-500" />
     </button>
    </div>

    {/* Body */}
    <div className="p-4 md:p-6 space-y-6 flex-1 overflow-y-auto pb-28 md:pb-6">
     
     {/* Priority & Service Banner */}
     <div className="flex flex-wrap gap-2 md:gap-4">
      <div className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border text-sm md:text-base ${isUrgent ? 'bg-orange-100 border-orange-200 text-orange-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
       <AlertTriangle size={16} />
       <span className="font-semibold">{ticket.priority}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-blue-100 bg-blue-50 text-blue-800 text-sm md:text-base">
       <FileText size={16} />
       <span className="font-semibold">{ticket.serviceType}</span>
      </div>
       {ticket.guestAuth && (
       <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-green-100 bg-green-50 text-green-800 text-sm md:text-base">
        <Shield size={16} />
        <span className="font-semibold">Entrada Autorizada</span>
       </div>
      )}
      {ticket.isPreventive && (
       <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-blue-200 bg-blue-100 text-blue-900 text-sm md:text-base">
        <CheckCircle2 size={16} />
        <span className="font-semibold">Preventiva: {ticket.recurrence}</span>
       </div>
      )}
      {ticket.isCheckoutTicket && (
       <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-violet-200 bg-violet-100 text-violet-900 text-sm md:text-base">
        <LogOut size={16} />
        <span className="font-semibold">Checkout Automático</span>
       </div>
      )}
     </div>

     {/* Description */}
     <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Descrição do Problema</h3>
      <div className="p-4 bg-gray-50 rounded-none border border-gray-100 text-gray-800 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
       {ticket.description}
      </div>
     </div>

     {/* Task 38: Completion Report Display */}
     {ticket.completionReport && (ticket.completionReport.notes || ticket.completionReport.photos) && (
      <div>
       <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Relatório de Conclusão</h3>
       <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
        {ticket.completionReport.notes && (
         <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Comentário:</p>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
           {ticket.completionReport.notes}
          </p>
         </div>
        )}
        {ticket.completionReport.photos && ticket.completionReport.photos.length > 0 && (
         <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Anexo:</p>
          <div className="space-y-2">
           {ticket.completionReport.photos.map((photo, idx) => (
            <img
             key={idx}
             src={photo}
             alt={`Anexo ${idx + 1}`}
             className="max-w-full h-auto rounded border border-gray-200 cursor-pointer hover:opacity-90"
             onClick={() => window.open(photo, '_blank')}
            />
           ))}
          </div>
         </div>
        )}
       </div>
      </div>
     )}

     {/* Metadata Grid */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
       <div className="flex items-start gap-3">
        <Calendar className="text-brand-500 mt-0.5" size={20} />
        <div>
         <p className="text-sm font-medium text-gray-900">
          {ticket.isPreventive ? 'Data Programada' : 'Data Desejada'}
         </p>
         <p className="text-sm text-gray-600">
          {new Date(ticket.desiredDate).toLocaleString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
         </p>
        </div>
       </div>
       
       {ticket.scheduledDate && (
        <div className="flex items-start gap-3">
         <Calendar className="text-blue-500 mt-0.5" size={20} />
         <div>
          <p className="text-sm font-medium text-gray-900">Data de Realização (Prevista)</p>
          <p className="text-sm text-gray-600">
           {new Date(ticket.scheduledDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
         </div>
        </div>
       )}

       {ticket.completedDate && (
         <div className="flex items-start gap-3">
         <CheckCircle2 className="text-green-500 mt-0.5" size={20} />
         <div>
          <p className="text-sm font-medium text-gray-900">Concluído em</p>
          <p className="text-sm text-gray-600">
           {new Date(ticket.completedDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
         </div>
        </div>
       )}
        
       <div className="flex items-start gap-3">
        <Clock className="text-brand-500 mt-0.5" size={20} />
        <div>
         <p className="text-sm font-medium text-gray-900">Criado em</p>
         <p className="text-sm text-gray-600">
          {new Date(ticket.createdAt).toLocaleString('pt-BR')} por {ticket.createdByName || 'N/A'}
         </p>
        </div>
       </div>
      </div>

      <div className="space-y-4">
       <div className="flex items-start gap-3">
        <User className="text-brand-500 mt-0.5" size={20} />
        <div className="w-full">
         <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-medium text-gray-900">Responsável Técnico</p>
          {!assignMode && (
           <button onClick={() => setAssignMode(true)} className="text-xs text-brand-600 hover:underline p-1">
            {ticket.assignee ? 'Alterar' : 'Atribuir'}
           </button>
          )}
         </div>
         
         {!assignMode ? (
           <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded border border-gray-100">
            {ticket.assignee || 'Não atribuído'}
           </p>
         ) : (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
            <select 
            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
            value={tempAssignee}
            onChange={(e) => setTempAssignee(e.target.value)}
           >
            <option value="">Selecione...</option>
            {allUsers.filter(u => u.role !== 'Guest Relations').map(u => (
             <option key={u.name} value={u.name}>{u.name}</option>
            ))}
           </select>
           <input 
            type="datetime-local"
            value={tempScheduledDate}
            onChange={(e) => setTempScheduledDate(e.target.value)}
            className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm"
           />
           <div className="flex gap-2">
            <button onClick={handleAssignSubmit} className="flex-1 bg-brand-600 text-white text-xs py-2 rounded">Salvar</button>
            <button onClick={() => setAssignMode(false)} className="flex-1 bg-white border border-gray-300 text-gray-600 text-xs py-2 rounded">Cancelar</button>
           </div>
          </div>
         )}
        </div>
       </div>
      </div>
     </div>

     {/* Observações Internas */}
     <div className="border-t border-gray-100 pt-6">
      <div className="flex justify-between items-center mb-2">
       <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Observações</h3>
       {!showObservationForm && (
        <button
         onClick={() => setShowObservationForm(true)}
         className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
        >
         <Plus size={14} /> Nova Observação
        </button>
       )}
      </div>

      {/* Formulário de Nova Observação */}
      {showObservationForm && (
       <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3 mb-3 animate-fade-in">
        <textarea
         value={observationText}
         onChange={(e) => setObservationText(e.target.value)}
         placeholder="Anotações internas sobre este chamado..."
         className="w-full border border-gray-300 rounded p-3 text-sm min-h-[100px] resize-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
         autoFocus
        />
        <div className="flex gap-2">
         <button
          onClick={handleSaveObservation}
          className="flex-1 bg-brand-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-700 transition-colors"
         >
          Salvar Observação
         </button>
         <button
          onClick={() => {
           setObservationText('');
           setShowObservationForm(false);
          }}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
         >
          Cancelar
         </button>
        </div>
       </div>
      )}

      {/* Histórico de Observações */}
      {ticket.observations && ticket.observations.length > 0 ? (
       <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
        {ticket.observations.slice().reverse().map((obs) => (
         <div key={obs.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-2">
           {obs.text}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
           <User size={12} />
           <span className="font-medium">{obs.createdByName || 'Usuário'}</span>
           <span>•</span>
           <Clock size={12} />
           <span>{new Date(obs.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
         </div>
        ))}
       </div>
      ) : (
       <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <MessageSquare size={24} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Nenhuma observação registrada ainda.</p>
       </div>
      )}
     </div>

     {/* Expenses Section */}
     <div className="border-t border-gray-100 pt-6">
      <div className="flex justify-between items-center mb-4">
       <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
        <DollarSign size={16} /> Custos e Despesas
       </h3>
       {!showExpenseForm && (
        <button
         onClick={() => setShowExpenseForm(true)}
         className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 hover:bg-brand-50 px-2 py-1 rounded transition-colors"
        >
         <Plus size={14} /> Adicionar
        </button>
       )}
      </div>

      {/* List of Expenses */}
      <div className="space-y-2 mb-4">
       {ticket.expenses && ticket.expenses.length > 0 ? (
        ticket.expenses.map(exp => (
         <div key={exp.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm group">
          <div className="flex-1 min-w-0 pr-2">
           <p className="font-medium text-gray-900 truncate">{exp.description}</p>
           <p className="text-xs text-gray-500 truncate">
            {new Date(exp.createdAt).toLocaleDateString()} • {exp.paymentMethod}
           </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <p className="font-bold text-gray-800">
            R$ {exp.amount.toFixed(2).replace('.', ',')}
            </p>
            <button 
              onClick={() => {
                if(window.confirm("Tem certeza que deseja excluir esta despesa?")) {
                  onDeleteExpense(ticket.id, exp.id);
                }
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Excluir despesa"
            >
              <Trash2 size={16} />
            </button>
          </div>
         </div>
        ))
       ) : (
        !showExpenseForm && <p className="text-sm text-gray-400 italic">Nenhuma despesa registrada.</p>
       )}
      </div>

      {/* Add Expense Form */}
      {showExpenseForm && (
       <form onSubmit={handleAddExpenseSubmit} className="bg-brand-50/50 p-4 rounded-none border border-brand-100 animate-fade-in">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Nova Despesa</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
         <div className="col-span-1 md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
          <input 
           type="text" 
           value={expenseDesc}
           onChange={e => setExpenseDesc(e.target.value)}
           placeholder="Ex: Torneira nova..."
           className="w-full p-2.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-500 focus:outline-none"
           autoFocus
           required
          />
         </div>
         <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
          <input 
           type="number" 
           step="0.01"
           min="0.01"
           value={expenseAmount}
           onChange={e => setExpenseAmount(e.target.value)}
           placeholder="0,00"
           className="w-full p-2.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-500 focus:outline-none"
           required
          />
         </div>
         <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento</label>
          <input 
           type="text" 
           value="Caju" 
           disabled 
           className="w-full p-2.5 text-sm border border-gray-200 bg-gray-100 text-gray-500 rounded cursor-not-allowed font-medium"
          />
         </div>
        </div>
        <div className="flex justify-end gap-2">
         <button 
          type="button" 
          onClick={() => setShowExpenseForm(false)}
          className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded"
         >
          Cancelar
         </button>
         <button 
          type="submit" 
          className="px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded shadow-sm"
         >
          Registrar
         </button>
        </div>
       </form>
      )}
     </div>

    </div>

    {/* Footer Actions - Sticky on Mobile */}
    <div className="p-4 md:p-6 border-t border-gray-100 bg-white md:bg-gray-50 md:rounded-b-2xl fixed md:static bottom-0 left-0 right-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none pb-safe">
      
      {!showCompletionDate ? (
       <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-3">
        
        {/* Delete/Dismiss Button */}
        <button
          onClick={ticket.isCheckoutTicket && onDismissCheckoutTicket ? handleDismiss : handleDelete}
          className="text-red-500 hover:text-red-700 text-sm font-medium px-4 py-3 md:py-2 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <Trash2 size={18} /> {ticket.isCheckoutTicket && onDismissCheckoutTicket ? 'Dispensar' : 'Excluir'}
        </button>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto justify-end">
         {ticket.status !== TicketStatus.DONE && (
          <button
           onClick={() => {
            if (ticket.status === TicketStatus.OPEN) {
             handleStartTicket();
            } else {
             setShowCompletionDate(true);
            }
           }}
           className={`flex items-center justify-center gap-2 px-6 py-3 md:py-2.5 rounded-lg font-semibold text-white transition-colors shadow-lg shadow-brand-500/10 active:scale-95 duration-200 w-full md:w-auto
            ${ticket.status === TicketStatus.OPEN ? 'bg-brand-600 hover:bg-brand-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
           {ticket.status === TicketStatus.OPEN ? (
            <>Iniciar Atendimento</>
           ) : (
            <><CheckCircle2 size={20} /> Concluir Chamado</>
           )}
          </button>
         )}
         {ticket.status === TicketStatus.DONE && (
          <button
           onClick={() => onUpdateStatus(ticket.id, TicketStatus.IN_PROGRESS)}
           className="px-6 py-3 md:py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 w-full md:w-auto"
          >
           Reabrir Chamado
          </button>
         )}
        </div>
       </div>
      ) : (
       <div className="bg-white border border-green-200 rounded-lg p-4 animate-fade-in space-y-4">
        <div>
         <p className="text-sm font-semibold text-gray-800 mb-2">Confirme a data de conclusão:</p>
         <input
          type="datetime-local"
          value={completionDate}
          onChange={(e) => setCompletionDate(e.target.value)}
          className="w-full border border-gray-300 rounded p-2.5 text-sm"
         />
        </div>

        {/* Task 38: Optional comment and attachment */}
        {!showCompletionReport ? (
         <button
          onClick={() => setShowCompletionReport(true)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
         >
          + Adicionar comentário ou anexo (opcional)
         </button>
        ) : (
         <div className="space-y-3 pt-2 border-t border-gray-200">
          <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Comentário (opcional)</label>
           <textarea
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="Adicione observações sobre a conclusão do chamado..."
            className="w-full border border-gray-300 rounded p-2.5 text-sm min-h-[80px] resize-none"
           />
          </div>
          <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Anexo (opcional)</label>
           <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
           />
           {completionPhoto && (
            <p className="text-xs text-green-600 mt-1">✓ Foto anexada</p>
           )}
          </div>
          <button
           onClick={() => {
            setShowCompletionReport(false);
            setCompletionNotes('');
            setCompletionPhoto(null);
           }}
           className="text-sm text-gray-600 hover:text-gray-700 font-medium"
          >
           Remover comentário e anexo
          </button>
         </div>
        )}

        <div className="flex gap-2 pt-2">
         <button onClick={handleCompletionSubmit} className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded text-sm font-medium hover:bg-green-700">Confirmar</button>
         <button
          onClick={() => {
           setShowCompletionDate(false);
           setShowCompletionReport(false);
           setCompletionNotes('');
           setCompletionPhoto(null);
          }}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded text-sm font-medium hover:bg-gray-200"
         >
          Cancelar
         </button>
        </div>
       </div>
      )}

    </div>

   </div>
  </div>
 );
};

export default TicketDetailModal;