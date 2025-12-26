import React from 'react';
import ReservationForm from '../ReservationForm';
import ReservationDetailModal from '../ReservationDetailModal';
import type { Reservation, ReservationStatus, Property, User, Ticket, Expense } from '../../types';
import { storageService } from '../../services/storage';
import { generateId } from '../../utils';

interface ReservationModalsProps {
 showReservationForm: boolean;
 setShowReservationForm: (show: boolean) => void;
 selectedReservation: Reservation | null;
 setSelectedReservation: React.Dispatch<React.SetStateAction<Reservation | null>>;
 properties: Property[];
 currentUser: User;
 tickets: Ticket[];
 staysReservations?: Reservation[]; // Para calcular histórico do hóspede
 onReservationSubmit: (reservation: Omit<Reservation, 'id'>) => void;
 onUpdateReservation: (id: string, updates: Partial<Reservation>) => void;
 onAddExpense: (reservationId: string, description: string, amount: number) => void;
 onDeleteExpense: (reservationId: string, expenseId: string) => void;
 setTicketPreFill: (data: { propertyCode?: string; description?: string; reservationId?: string }) => void;
 setShowTicketForm: (show: boolean) => void;
 addLog: (action: string, details: string) => void;
 addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const ReservationModals: React.FC<ReservationModalsProps> = ({
 showReservationForm,
 setShowReservationForm,
 selectedReservation,
 setSelectedReservation,
 properties,
 currentUser,
 tickets,
 staysReservations = [],
 setTicketPreFill,
 setShowTicketForm,
 addLog,
 addNotification,
}) => {
 const handleReservationSubmit = (res: Omit<Reservation, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  storageService.reservations.add({
   ...res,
   id: '',
   createdAt: Date.now(),
   updatedAt: Date.now(),
   status: 'Confirmada' as ReservationStatus,
   channel: 'Direto',
  } as any);

  addLog('Reserva', `Criou reserva manual para ${res.guestName}`);
  addNotification('Nova Reserva', `Reserva manual criada para ${res.guestName}`, 'success');
  setShowReservationForm(false);
 };

 const handleUpdateDetails = async (id: string, data: Partial<Reservation>) => {
  try {
   await storageService.reservations.update({ id, ...data, updatedAt: Date.now() } as any);
   addLog('Reserva', `Atualizou reserva de ${selectedReservation?.guestName}`);
   setSelectedReservation((prev: Reservation | null) => (prev ? { ...prev, ...data } : null));
   addNotification('Salvo', 'Alterações salvas com sucesso', 'success');
  } catch (error) {
   console.error('Erro ao salvar reserva:', error);
   addNotification('Erro', 'Não foi possível salvar as alterações', 'error');
  }
 };

 const handleDelete = (id: string) => {
  storageService.reservations.delete(id);
  addLog('Reserva', `Excluiu reserva ID ${id}`);
  setSelectedReservation(null);
 };

 const handleAddExpense = (resId: string, desc: string, amount: number) => {
  const newExpense: Expense = {
   id: generateId(),
   description: desc,
   amount,
   paymentMethod: 'Caju',
   createdAt: Date.now(),
   createdBy: currentUser.name,
  };
  const updatedExpenses = [...(selectedReservation?.expenses || []), newExpense];
  storageService.reservations.update({ id: resId, expenses: updatedExpenses } as any);
  setSelectedReservation((prev: Reservation | null) => (prev ? { ...prev, expenses: updatedExpenses } : null));
 };

 const handleDeleteExpense = (resId: string, expId: string) => {
  const updatedExpenses = (selectedReservation?.expenses || []).filter((e) => e.id !== expId);
  storageService.reservations.update({ id: resId, expenses: updatedExpenses } as any);
  setSelectedReservation((prev: Reservation | null) => (prev ? { ...prev, expenses: updatedExpenses } : null));
 };

 const handleCreateTicket = () => {
  if (selectedReservation) {
   setTicketPreFill({
    propertyCode: selectedReservation.propertyCode,
    description: `Solicitado por ${selectedReservation.guestName}: `,
    reservationId: selectedReservation.id,
   });
   setShowTicketForm(true);
  }
 };

 return (
  <>
   {showReservationForm && (
    <ReservationForm
     onClose={() => setShowReservationForm(false)}
     properties={properties}
     onSubmit={handleReservationSubmit}
    />
   )}

   {selectedReservation && (
    <ReservationDetailModal
     reservation={selectedReservation}
     currentUser={currentUser}
     tickets={tickets}
     staysReservations={staysReservations}
     onCreateTicket={handleCreateTicket}
     onClose={() => setSelectedReservation(null)}
     onUpdateDetails={handleUpdateDetails}
     onDelete={handleDelete}
     onAddExpense={handleAddExpense}
     onDeleteExpense={handleDeleteExpense}
    />
   )}
  </>
 );
};

export default ReservationModals;
