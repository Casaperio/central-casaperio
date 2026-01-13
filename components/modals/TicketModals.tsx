import React from 'react';
import TicketForm from '../TicketForm';
import TicketDetailModal from '../TicketDetailModal';
import type { Ticket, TicketStatus, Property, User, UserWithPassword, Expense, AppModule, Reservation } from '../../types';
import { storageService } from '../../services/storage';
import { generateId, getMaintenanceItemKey } from '../../utils';
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
 onUpdateStatus: (id: string, status: TicketStatus, date?: number, startedAt?: number, completionReport?: Ticket['completionReport']) => void;
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

 const handleUpdateStatus = async (id: string, status: TicketStatus, date?: string, startedAt?: number, completionReport?: Ticket['completionReport']) => {
  // Task 33: Verificar se é um ticket virtual de checkout
  const isVirtual = selectedTicket && (selectedTicket as any)._isVirtual === true;

  if (isVirtual && selectedTicket) {
    // Criar ticket real no Firebase primeiro
    const realTicketId = generateId();
    const updates: any = { status, updatedAt: Date.now() };
    if (status === 'Concluído' as TicketStatus) {
      updates.completedDate = date;
      if (completionReport) updates.completionReport = completionReport; // Task 38
    }
    if (status === 'Em Andamento' as TicketStatus && startedAt) updates.startedAt = startedAt;

    const realTicket: Ticket = {
      id: realTicketId,
      propertyCode: selectedTicket.propertyCode,
      propertyName: selectedTicket.propertyName,
      priority: selectedTicket.priority,
      serviceType: selectedTicket.serviceType,
      description: selectedTicket.description,
      desiredDate: selectedTicket.desiredDate,
      scheduledDate: selectedTicket.scheduledDate,
      guestAuth: selectedTicket.guestAuth,
      status: updates.status,
      assignee: selectedTicket.assignee,
      createdBy: 'Sistema',
      createdByName: 'Automação de Check-out',
      createdAt: Date.now(),
      updatedAt: updates.updatedAt,
      completedDate: updates.completedDate,
      startedAt: updates.startedAt,
      completionReport: updates.completionReport, // Task 38
      reservationId: selectedTicket.reservationId,
      isCheckoutTicket: true,
      category: 'maintenance',
      expenses: [],
    };

    await storageService.tickets.add(realTicket);
    addLog('Chamado', `Criou ticket de checkout e atualizou status para ${status}`);
    addNotification('Ticket Criado', `Ticket de checkout criado com status ${status}`, 'success');
    setSelectedTicket(realTicket);
  } else {
    // Ticket normal - apenas fazer update
    const updates: any = { status, updatedAt: Date.now() };
    if (status === 'Concluído' as TicketStatus) {
      updates.completedDate = date;
      if (completionReport) updates.completionReport = completionReport; // Task 38
    }
    if (status === 'Em Andamento' as TicketStatus && startedAt) updates.startedAt = startedAt;

    storageService.tickets.update({ id, ...updates } as any);
    addLog('Chamado', `Atualizou status para ${status} no chamado ${id}`);
    addNotification('Chamado Atualizado', `Status alterado para ${status}`, 'info');
    setSelectedTicket((prev: Ticket | null) => (prev ? { ...prev, ...updates } : null));
  }
 };

 const handleAssign = async (id: string, assignee: string, date: string) => {
  // Task 33: Verificar se é um ticket virtual de checkout
  // Tickets virtuais precisam ser criados no Firebase antes de serem atualizados
  const isVirtual = selectedTicket && (selectedTicket as any)._isVirtual === true;

  if (isVirtual && selectedTicket) {
    // Criar ticket real no Firebase primeiro
    const realTicketId = generateId();
    const realTicket: Ticket = {
      id: realTicketId,
      propertyCode: selectedTicket.propertyCode,
      propertyName: selectedTicket.propertyName,
      priority: selectedTicket.priority,
      serviceType: selectedTicket.serviceType,
      description: selectedTicket.description,
      desiredDate: selectedTicket.desiredDate,
      scheduledDate: date, // Já incluir a data programada
      guestAuth: selectedTicket.guestAuth,
      status: selectedTicket.status,
      assignee: assignee, // Já incluir o responsável
      createdBy: 'Sistema',
      createdByName: 'Automação de Check-out',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      reservationId: selectedTicket.reservationId,
      isCheckoutTicket: true,
      category: 'maintenance',
      expenses: [],
    };

    // Adicionar ticket real no Firebase
    await storageService.tickets.add(realTicket);

    addLog('Chamado', `Criou ticket de checkout e atribuiu ${assignee}`);
    addNotification('Ticket Criado', `Ticket de checkout criado e atribuído a ${assignee}`, 'success');

    // Atualizar o selectedTicket com o ticket real (sem a flag _isVirtual)
    setSelectedTicket(realTicket);
  } else {
    // Ticket normal (não virtual) - apenas fazer update
    storageService.tickets.update({ id, assignee, scheduledDate: date, updatedAt: Date.now() } as any);
    addLog('Chamado', `Atribuiu ${assignee} ao chamado ${id}`);
    setSelectedTicket((prev: Ticket | null) => (prev ? { ...prev, assignee, scheduledDate: date } : null));
  }
 };

 const handleAddExpense = async (ticketId: string, desc: string, amount: number) => {
  const newExpense: Expense = {
   id: generateId(),
   description: desc,
   amount,
   paymentMethod: 'Caju',
   createdAt: Date.now(),
   createdBy: currentUser.name,
  };

  // Task 33: Verificar se é um ticket virtual de checkout
  const isVirtual = selectedTicket && (selectedTicket as any)._isVirtual === true;

  if (isVirtual && selectedTicket) {
    // Criar ticket real no Firebase primeiro
    const realTicketId = generateId();
    const realTicket: Ticket = {
      id: realTicketId,
      propertyCode: selectedTicket.propertyCode,
      propertyName: selectedTicket.propertyName,
      priority: selectedTicket.priority,
      serviceType: selectedTicket.serviceType,
      description: selectedTicket.description,
      desiredDate: selectedTicket.desiredDate,
      scheduledDate: selectedTicket.scheduledDate,
      guestAuth: selectedTicket.guestAuth,
      status: selectedTicket.status,
      assignee: selectedTicket.assignee,
      createdBy: 'Sistema',
      createdByName: 'Automação de Check-out',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      reservationId: selectedTicket.reservationId,
      isCheckoutTicket: true,
      category: 'maintenance',
      expenses: [newExpense],
    };

    await storageService.tickets.add(realTicket);
    addLog('Chamado', `Criou ticket de checkout e adicionou despesa`);
    addNotification('Ticket Criado', `Ticket de checkout criado com despesa registrada`, 'success');
    setSelectedTicket(realTicket);
  } else {
    // Ticket normal - apenas fazer update
    const updatedExpenses = [...(selectedTicket?.expenses || []), newExpense];
    storageService.tickets.update({ id: ticketId, expenses: updatedExpenses } as any);
    setSelectedTicket((prev: Ticket | null) => (prev ? { ...prev, expenses: updatedExpenses } : null));
  }
 };

 const handleDeleteExpense = (ticketId: string, expId: string) => {
  const updatedExpenses = (selectedTicket?.expenses || []).filter((e) => e.id !== expId);
  storageService.tickets.update({ id: ticketId, expenses: updatedExpenses } as any);
  setSelectedTicket((prev: Ticket | null) => (prev ? { ...prev, expenses: updatedExpenses } : null));
 };

 const handleDeleteTicket = (id: string) => {
  // Task 33: Verificar se é um ticket virtual de checkout
  const isVirtual = selectedTicket && (selectedTicket as any)._isVirtual === true;

  if (isVirtual) {
    // Tickets virtuais não existem no Firebase, apenas fechar o modal
    addNotification('Chamado Cancelado', 'O chamado não foi salvo', 'info');
    setSelectedTicket(null);
  } else {
    // Ticket real - deletar do Firebase
    storageService.tickets.delete(id);
    addLog('Exclusão', `Excluiu chamado ${id}`);
    addNotification('Chamado Removido', 'O chamado foi excluído permanentemente', 'success');
    setSelectedTicket(null);
  }
 };

 const handleDismissCheckoutTicket = async (ticket: Ticket) => {
  const itemKey = getMaintenanceItemKey(ticket);

  try {
   await storageService.maintenanceOverrides.hide(itemKey);
   addLog('Manutenção', `Dispensou ticket de checkout de ${ticket.propertyCode}`);
   addNotification('Chamado Dispensado', 'O chamado foi removido da lista de manutenção', 'success');
   setSelectedTicket(null);
  } catch (error) {
   console.error('[handleDismissCheckoutTicket] Erro ao dispensar:', error);
   addNotification('Erro', 'Não foi possível dispensar o chamado', 'error');
  }
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
     onDismissCheckoutTicket={selectedTicket.isCheckoutTicket ? handleDismissCheckoutTicket : undefined}
     allUsers={users}
    />
   )}
  </>
 );
};

export default TicketModals;
