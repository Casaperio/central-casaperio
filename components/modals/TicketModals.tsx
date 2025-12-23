import React from 'react';
import TicketForm from '../TicketForm';
import TicketDetailModal from '../TicketDetailModal';
import type { Ticket, TicketStatus, Property, User, UserWithPassword, Expense, AppModule, Reservation } from '../../types';
import { storageService } from '../../services/storage';
import { generateId } from '../../utils';
import { CONCIERGE_SERVICE_TYPES } from '../../constants';

interface TicketModalsProps {
 // TicketForm modal
 showTicketForm: boolean;
 setShowTicketForm: (show: boolean) => void;
 ticketFormMode: 'corrective' | 'preventive';
 ticketPreFill: { propertyCode?: string; description?: string; reservationId?: string } | undefined;
 setTicketPreFill: (data: { propertyCode?: string; description?: string; reservationId?: string } | undefined) => void;
 onTicketSubmit: (ticket: Omit<Ticket, 'id'>) => void;

 // TicketDetailModal
 selectedTicket: Ticket | null;
 setSelectedTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
 users: UserWithPassword[];
 onUpdateStatus: (id: string, status: TicketStatus, date?: number, startedAt?: number) => void;
 onAssignTicket: (id: string, assignee: string, date?: number) => void;
 onAddExpense: (ticketId: string, description: string, amount: number) => void;
 onDeleteExpense: (ticketId: string, expenseId: string) => void;
 onDeleteTicket: (id: string) => void;

 // Shared data
 properties: Property[];
 settings: {
  priorities: string[];
  serviceTypes: (string | { name: string })[];
 };
 activeModule: AppModule | null;
 reservations: Reservation[];
 currentUser: User;
 addLog: (action: string, details: string) => void;
 addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const TicketModals: React.FC<TicketModalsProps> = ({
 showTicketForm,
 setShowTicketForm,
 ticketFormMode,
 ticketPreFill,
 setTicketPreFill,
 selectedTicket,
 setSelectedTicket,
 users,
 onUpdateStatus,
 onAssignTicket,
 onAddExpense,
 onDeleteExpense,
 onDeleteTicket,
 properties,
 settings,
 activeModule,
 reservations,
 currentUser,
 addLog,
 addNotification,
}) => {
 const handleTicketSubmit = (t: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
  const typeLabel = t.category === 'concierge' ? 'Concierge' : t.isPreventive ? 'Preventiva' : 'Chamado';

  storageService.tickets.add({
   ...t,
   id: generateId(),
   status: 'Aberto' as TicketStatus,
   createdBy: currentUser.id,
   createdByName: currentUser.name,
   createdAt: Date.now(),
   updatedAt: Date.now(),
   expenses: [],
  });

  addLog(typeLabel, `Criou ${typeLabel.toLowerCase()} para ${t.propertyCode}`);
  addNotification('Novo Chamado', `${typeLabel} criado para ${t.propertyCode}`, 'info');

  if (t.reservationId) {
   const res = reservations.find((r) => r.id === t.reservationId);
   if (res) {
    const newHistory = [
     ...(res.history || []),
     {
      id: generateId(),
      timestamp: Date.now(),
      user: currentUser.name,
      action: `Chamado Criado: ${t.serviceType}`,
     },
    ];
    storageService.reservations.update({ id: res.id, history: newHistory } as any);
   }
  }

  setShowTicketForm(false);
  setTicketPreFill(undefined);
 };

 const handleUpdateStatus = (id: string, status: TicketStatus, date?: string, startedAt?: number) => {
  const updates: any = { status, updatedAt: Date.now() };
  if (status === 'Concluído' as TicketStatus) updates.completedDate = date;
  if (status === 'Em Andamento' as TicketStatus && startedAt) updates.startedAt = startedAt;

  storageService.tickets.update({ id, ...updates } as any);
  addLog('Chamado', `Atualizou status para ${status} no chamado ${id}`);
  addNotification('Chamado Atualizado', `Status alterado para ${status}`, 'info');
  setSelectedTicket((prev: Ticket | null) => (prev ? { ...prev, ...updates } : null));
 };

 const handleAssign = (id: string, assignee: string, date: string) => {
  storageService.tickets.update({ id, assignee, scheduledDate: date, updatedAt: Date.now() } as any);
  addLog('Chamado', `Atribuiu ${assignee} ao chamado ${id}`);
  setSelectedTicket((prev: Ticket | null) => (prev ? { ...prev, assignee, scheduledDate: date } : null));
 };

 const handleAddExpense = (ticketId: string, desc: string, amount: number) => {
  const newExpense: Expense = {
   id: generateId(),
   description: desc,
   amount,
   paymentMethod: 'Caju',
   createdAt: Date.now(),
   createdBy: currentUser.name,
  };
  const updatedExpenses = [...(selectedTicket?.expenses || []), newExpense];
  storageService.tickets.update({ id: ticketId, expenses: updatedExpenses } as any);
  setSelectedTicket((prev: Ticket | null) => (prev ? { ...prev, expenses: updatedExpenses } : null));
 };

 const handleDeleteExpense = (ticketId: string, expId: string) => {
  const updatedExpenses = (selectedTicket?.expenses || []).filter((e) => e.id !== expId);
  storageService.tickets.update({ id: ticketId, expenses: updatedExpenses } as any);
  setSelectedTicket((prev: Ticket | null) => (prev ? { ...prev, expenses: updatedExpenses } : null));
 };

 const handleDeleteTicket = (id: string) => {
  storageService.tickets.delete(id);
  addLog('Exclusão', `Excluiu chamado ${id}`);
  setSelectedTicket(null);
 };

 return (
  <>
   {showTicketForm && (
    <TicketForm
     onClose={() => {
      setShowTicketForm(false);
      setTicketPreFill(undefined);
     }}
     isPreventiveMode={ticketFormMode === 'preventive'}
     category={activeModule === 'concierge' ? 'concierge' : 'maintenance'}
     initialData={ticketPreFill}
     onSubmit={handleTicketSubmit}
     properties={properties}
     priorities={settings.priorities}
     serviceTypes={
      activeModule === 'concierge'
       ? CONCIERGE_SERVICE_TYPES
       : settings.serviceTypes.map((s) => (typeof s === 'string' ? s : s.name))
     }
    />
   )}

   {selectedTicket && (
    <TicketDetailModal
     ticket={selectedTicket}
     onClose={() => setSelectedTicket(null)}
     onUpdateStatus={handleUpdateStatus}
     onAssign={handleAssign}
     onAddExpense={handleAddExpense}
     onDeleteExpense={handleDeleteExpense}
     onDeleteTicket={handleDeleteTicket}
     allUsers={users}
    />
   )}
  </>
 );
};

export default TicketModals;
