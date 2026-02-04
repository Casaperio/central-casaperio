import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Reservation, ReservationStatus, User, FlightData, Ticket } from '../types';
import { X, Calendar, User as UserIcon, ChevronLeft, Plane, BedDouble, FileCheck, AlertCircle, Trash2, Save, FileText, DollarSign, Plus, Clock, CheckCircle2, History, Eye, Building2, Flag, RefreshCw, Wrench, Baby, Repeat, MessageSquare, Phone, Mail } from 'lucide-react';
import { checkFlightStatus } from '../services/geminiService';
import { storageService } from '../services/storage';
import { getReservationOverrideKey, formatDatePtBR } from '../utils';
import { formatPhoneSmart, applyPhoneMaskBR } from '../utils/phoneFormatter'; // Task 6: Phone formatter
import { debugLog } from '../utils/debugLog'; // Task 6: Debug system
import { normalizeGuestKey } from '../utils/normalizeGuestKey';

import { isAutomaticCheckoutTicket } from '../utils/ticketFilters';

interface ReservationDetailModalProps {
 reservation: Reservation;
 currentUser: User;
 guestContactMap?: Record<string, { email?: string; phone?: string }>; // Task 6: Mapa de contatos do Calendar
 tickets?: Ticket[]; // Added to show linked tickets
 staysReservations?: Reservation[]; // Para calcular histórico do hóspede
 onCreateTicket: () => void;
 onClose: () => void;
 onUpdateDetails: (id: string, data: Partial<Reservation>) => void;
 onDelete: (id: string) => void;
 onDismissCheckout?: (reservation: Reservation) => void; // Para dispensar checkouts automáticos
 onAddExpense: (reservationId: string, description: string, amount: number) => void;
 onDeleteExpense: (reservationId: string, expenseId: string) => void;
}

// Normaliza o nome do hóspede para consistência na contagem
const normalizeGuestName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' '); // Colapsa múltiplos espaços
};

const LANGUAGES = ['Português (Brasil)', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 'Outro'];

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({ reservation, currentUser, guestContactMap = {}, tickets = [], staysReservations = [], onCreateTicket, onClose, onUpdateDetails, onDelete, onDismissCheckout, onAddExpense, onDeleteExpense }) => {

 const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
 
 // Task 6: Resolver email e telefone com fallback usando guestContactMap
 const normalizedKey = normalizeGuestKey(reservation.guestName);
 const contactFromMap = guestContactMap[normalizedKey];
 
 const displayEmail = reservation.guestEmail ?? contactFromMap?.email;
 const displayPhone = reservation.guestPhone ?? contactFromMap?.phone;
 
 // Task 6: Log inicial do guestContactMap recebido
 console.log('📧 [MODAL] Dados de contato:', {
   guestName: reservation.guestName,
   normalizedKey,
   guestContactMapSize: Object.keys(guestContactMap).length,
   hasDataForThisGuest: !!contactFromMap,
   contactInfo: contactFromMap,
   displayEmail,
   displayPhone,
   reservationEmail: reservation.guestEmail,
   reservationPhone: reservation.guestPhone
 });

 // Calcula quantas reservas este hóspede já fez
 const guestReservationCount = useMemo(() => {
   if (!staysReservations.length) return 0;

   const normalizedName = normalizeGuestName(reservation.guestName);
   return staysReservations.filter(r => {
     // Ignora reservas canceladas
     if (r.status === 'Cancelada') return false;
     return normalizeGuestName(r.guestName) === normalizedName;
   }).length;
 }, [staysReservations, reservation.guestName]);

 // Fields
 const [flightInfo, setFlightInfo] = useState(reservation.flightInfo || '');
 const [roomConfig, setRoomConfig] = useState(reservation.roomConfig || '');
 const [hasChildren, setHasChildren] = useState(reservation.hasChildren || false);
 const [wantsBedSplit, setWantsBedSplit] = useState(reservation.wantsBedSplit || false);
 const [notes, setNotes] = useState(reservation.notes || '');
 const [language, setLanguage] = useState(reservation.language || '');
 
 const [docsSent, setDocsSent] = useState(reservation.docsSent);
 const [docsSentToBuilding, setDocsSentToBuilding] = useState(reservation.docsSentToBuilding || false);

 // Flags
 const [specialAttention, setSpecialAttention] = useState(reservation.specialAttention || false);
 const [problemReported, setProblemReported] = useState(reservation.problemReported || false);

 // Early/Late State
 const [earlyRequest, setEarlyRequest] = useState(reservation.earlyCheckIn?.requested || false);
 const [earlyTime, setEarlyTime] = useState(reservation.earlyCheckIn?.time || '');
 const [earlyGranted, setEarlyGranted] = useState(reservation.earlyCheckIn?.granted || false);

 const [lateRequest, setLateRequest] = useState(reservation.lateCheckOut?.requested || false);
 const [lateTime, setLateTime] = useState(reservation.lateCheckOut?.time || '');
 const [lateGranted, setLateGranted] = useState(reservation.lateCheckOut?.granted || false);

 const [hasChanges, setHasChanges] = useState(false);
 const [showLangSuggestions, setShowLangSuggestions] = useState(false);

 // React Query Client (para invalidar cache dos cards após salvar)
 const queryClient = useQueryClient();

 // Flight Status State
 const [flightData, setFlightData] = useState<FlightData | undefined>(reservation.flightData);
 const [loadingFlight, setLoadingFlight] = useState(false);

 // Expense State
 const [expenseDesc, setExpenseDesc] = useState('');
 const [expenseAmount, setExpenseAmount] = useState('');
 const [showExpenseForm, setShowExpenseForm] = useState(false);

 // Guest Note State
 const [guestNote, setGuestNote] = useState('');
 const [loadingNote, setLoadingNote] = useState(true);
 const [savingNote, setSavingNote] = useState(false);
 const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

 // Task 6: Guest Contact Data State
 const [extraPhones, setExtraPhones] = useState<string[]>([]);
 const [newPhone, setNewPhone] = useState('');
 const [loadingContactData, setLoadingContactData] = useState(true);
 const [savingContactData, setSavingContactData] = useState(false);
 const contactDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

 // Reservation Overrides State
 const [loadingOverrides, setLoadingOverrides] = useState(true);
 const [savingOverrides, setSavingOverrides] = useState(false);
 const [isInitializing, setIsInitializing] = useState(true);
 
 // Task 41: Maintenance seen state
 const [maintenanceSeenBy, setMaintenanceSeenBy] = useState<string | undefined>(reservation.maintenanceAck?.seenBy);
 const [maintenanceSeenAt, setMaintenanceSeenAt] = useState<number | undefined>(reservation.maintenanceAck?.seenAt);

 // Baseline para comparação de dirty state (snapshot inicial após merge de overrides)
 const initialEditableRef = useRef<string | null>(null);
 const baselineSetRef = useRef(false); // Flag: baseline já foi setado na inicialização?

 // Função helper: extrai apenas campos editáveis do form (para comparação)
 const getEditableFields = useCallback(() => {
   return {
     language,
     docsSent,
     docsSentToBuilding,
     hasChildren,
     wantsBedSplit,
     flightInfo,
     roomConfig,
     notes,
     specialAttention,
     problemReported,
     earlyCheckIn: { requested: earlyRequest, time: earlyTime, granted: earlyGranted },
     lateCheckOut: { requested: lateRequest, time: lateTime, granted: lateGranted }
   };
 }, [language, docsSent, docsSentToBuilding, hasChildren, wantsBedSplit, flightInfo,
     roomConfig, notes, specialAttention, problemReported, earlyRequest, earlyTime,
     earlyGranted, lateRequest, lateTime, lateGranted]);

 // Função helper: verifica se o form tem mudanças comparando com baseline
 const hasFormChanges = useCallback(() => {
   if (!initialEditableRef.current) return false;
   const currentEditable = JSON.stringify(getEditableFields());
   return currentEditable !== initialEditableRef.current;
 }, [getEditableFields]);

 // Linked Tickets Logic
 // Task 79: Excluir chamados de checkout automático do histórico (usando filtro centralizado)
 const linkedTickets = tickets.filter(t =>
   // Filtro primário: reservationId match OU tickets durante período da reserva
   (t.reservationId === reservation.id ||
   // Fallback: Tickets created during reservation for same property
   (t.propertyCode === reservation.propertyCode &&
    t.createdAt >= new Date(reservation.checkInDate).getTime() &&
    t.createdAt <= new Date(reservation.checkOutDate).getTime())) &&
   // Task 79: CRÍTICO - Excluir chamados de checkout automático (filtro centralizado)
   !isAutomaticCheckoutTicket(t)
 ).sort((a,b) => b.createdAt - a.createdAt);

 // Carrega a nota do hóspede do Firestore
 useEffect(() => {
   const loadGuestNote = async () => {
     const guestKey = normalizeGuestName(reservation.guestName);
     try {
       const note = await storageService.guestNotes.get(guestKey);
       if (note) {
         setGuestNote(note.note || '');
       }
     } catch (error) {
       console.error('Erro ao carregar nota do hóspede:', error);
     } finally {
       setLoadingNote(false);
     }
   };

   loadGuestNote();
 }, [reservation.guestName]);

 // Task 6: Carrega os dados de contato do hóspede do Firestore
 useEffect(() => {
   const loadContactData = async () => {
     const guestKey = normalizeGuestName(reservation.guestName);
     
     // Debug: Log dos dados base da reserva
     debugLog.modal('Dados de contato da reserva:', {
       guestName: reservation.guestName,
       guestEmail: displayEmail,
       guestPhone: displayPhone,
       source: reservation.source,
       channel: reservation.channel,
       externalId: reservation.externalId
     });

     try {
       const contactData = await storageService.guestContactData.get(guestKey);
       if (contactData && contactData.extraPhones) {
         setExtraPhones(contactData.extraPhones);
         debugLog.modal('Telefones extras carregados:', contactData.extraPhones);
       } else {
         debugLog.modal('Nenhum telefone extra encontrado para:', guestKey);
       }
     } catch (error) {
       console.error('[Task 6 Error] Erro ao carregar dados de contato:', error);
     } finally {
       setLoadingContactData(false);
     }
   };

   loadContactData();
 }, [reservation.guestName, displayEmail, displayPhone, reservation.source, reservation.channel]);

 // Carrega os overrides da reserva do Firestore
 useEffect(() => {
   const loadOverrides = async () => {
     setIsInitializing(true); // Marca que está inicializando
     baselineSetRef.current = false; // Reseta flag de baseline

     try {
       // CRÍTICO: Usar getReservationOverrideKey para gerar a chave correta
       const overrideKey = getReservationOverrideKey(reservation);

       console.log('[Modal] Carregando overrides:', {
         INPUT_reservation_id: reservation.id,
         INPUT_reservation_externalId: reservation.externalId,
         INPUT_reservation_source: reservation.source,
         CHAVE_CALCULADA: overrideKey
       });

       const overrides = await storageService.reservationOverrides.get(overrideKey);

       console.log('[Modal] Override carregado:', overrides ? 'SIM' : 'NÃO', overrides);

       if (overrides) {
         // Merge overrides com o estado atual
         if (overrides.language !== undefined) setLanguage(overrides.language);
         if (overrides.docsSent !== undefined) setDocsSent(overrides.docsSent);
         if (overrides.docsSentToBuilding !== undefined) setDocsSentToBuilding(overrides.docsSentToBuilding);
         if (overrides.hasChildren !== undefined) setHasChildren(overrides.hasChildren);
         if (overrides.wantsBedSplit !== undefined) setWantsBedSplit(overrides.wantsBedSplit);
         if (overrides.flightInfo !== undefined) setFlightInfo(overrides.flightInfo);
         if (overrides.roomConfig !== undefined) setRoomConfig(overrides.roomConfig);
         if (overrides.notes !== undefined) setNotes(overrides.notes);
         if (overrides.specialAttention !== undefined) setSpecialAttention(overrides.specialAttention);
         if (overrides.problemReported !== undefined) setProblemReported(overrides.problemReported);
         if (overrides.earlyCheckIn !== undefined) {
           setEarlyRequest(overrides.earlyCheckIn.requested);
           setEarlyTime(overrides.earlyCheckIn.time);
           setEarlyGranted(overrides.earlyCheckIn.granted);
         }
         if (overrides.lateCheckOut !== undefined) {
           setLateRequest(overrides.lateCheckOut.requested);
           setLateTime(overrides.lateCheckOut.time);
           setLateGranted(overrides.lateCheckOut.granted);
         }
         // Task 41: Load maintenance seen status
         if (overrides.maintenanceSeenBy !== undefined) setMaintenanceSeenBy(overrides.maintenanceSeenBy);
         if (overrides.maintenanceSeenAt !== undefined) setMaintenanceSeenAt(overrides.maintenanceSeenAt);
       }
     } catch (error) {
       console.error('[Modal] Erro ao carregar overrides da reserva:', error);
     } finally {
       setLoadingOverrides(false);
       // Aguarda um tick para garantir que todos os setStates foram processados
       setTimeout(() => setIsInitializing(false), 0);
     }
   };

   loadOverrides();
 }, [reservation.id, reservation.externalId, reservation.source, reservation.guestName]);

 // Seta o baseline inicial após carregar overrides (para comparação de dirty state)
 useEffect(() => {
   if (!isInitializing && !loadingOverrides && !loadingNote && !loadingContactData && !baselineSetRef.current) {
     // Quando terminar de carregar overrides e notas, seta o baseline APENAS UMA VEZ
     const initialEditable = JSON.stringify(getEditableFields());
     initialEditableRef.current = initialEditable;
     baselineSetRef.current = true; // Marca que baseline foi setado
     setHasChanges(false);
   }
 }, [isInitializing, loadingOverrides, loadingNote, loadingContactData]);

 // Recalcula hasChanges quando qualquer campo editável mudar
 useEffect(() => {
   if (isInitializing || loadingOverrides || loadingNote) return; // Não recalcula durante inicialização/carregamento
   const changed = hasFormChanges();
   setHasChanges(changed);
 }, [language, docsSent, docsSentToBuilding, hasChildren, wantsBedSplit, flightInfo,
     roomConfig, notes, specialAttention, problemReported, earlyRequest, earlyTime,
     earlyGranted, lateRequest, lateTime, lateGranted, isInitializing, loadingOverrides, loadingNote, hasFormChanges]);

 // Salva a nota no Firestore com debounce de 1 segundo
 const saveGuestNote = useCallback(async (noteText: string) => {
   const guestKey = normalizeGuestName(reservation.guestName);
   setSavingNote(true);

   try {
     await storageService.guestNotes.set({
       guestKey,
       guestName: reservation.guestName,
       note: noteText,
       updatedAt: Date.now(),
       updatedBy: currentUser.name
     });
   } catch (error) {
     console.error('Erro ao salvar nota do hóspede:', error);
   } finally {
     setSavingNote(false);
   }
 }, [reservation.guestName, currentUser.name]);

 // Handler com debounce para evitar spam de writes
 const handleGuestNoteChange = useCallback((value: string) => {
   setGuestNote(value);

   // Limpa o timer anterior
   if (debounceTimerRef.current) {
     clearTimeout(debounceTimerRef.current);
   }

   // Agenda o salvamento após 1 segundo de inatividade
   debounceTimerRef.current = setTimeout(() => {
     saveGuestNote(value);
   }, 1000);
 }, [saveGuestNote]);

 // Cleanup do debounce timer
 useEffect(() => {
   return () => {
     if (debounceTimerRef.current) {
       clearTimeout(debounceTimerRef.current);
     }
   };
 }, []);

 // Task 6: Salva os dados de contato no Firestore com debounce
 const saveContactData = useCallback(async (phones: string[]) => {
   const guestKey = normalizeGuestName(reservation.guestName);
   setSavingContactData(true);

   try {
     await storageService.guestContactData.set({
       guestKey,
       guestName: reservation.guestName,
       extraPhones: phones,
       updatedAt: Date.now(),
       updatedBy: currentUser.name
     });
   } catch (error) {
     console.error('Erro ao salvar dados de contato:', error);
   } finally {
     setSavingContactData(false);
   }
 }, [reservation.guestName, currentUser.name]);

 // Task 6: Handler para adicionar telefone extra
 const handleAddPhone = useCallback(() => {
   const cleaned = newPhone.trim();
   if (!cleaned) return;

   // Validação básica: mínimo 8 dígitos
   const digitsOnly = cleaned.replace(/\D/g, '');
   if (digitsOnly.length < 8) {
     alert('Telefone inválido. Mínimo 8 dígitos.');
     return;
   }

   // Evitar duplicatas
   if (extraPhones.includes(cleaned)) {
     alert('Este telefone já está na lista.');
     return;
   }

   const updated = [...extraPhones, cleaned];
   setExtraPhones(updated);
   setNewPhone('');

   // Salvar com debounce
   if (contactDebounceTimerRef.current) {
     clearTimeout(contactDebounceTimerRef.current);
   }
   contactDebounceTimerRef.current = setTimeout(() => {
     saveContactData(updated);
   }, 500);
 }, [newPhone, extraPhones, saveContactData]);

 // Task 6: Handler para remover telefone extra
 const handleRemovePhone = useCallback((phone: string) => {
   const updated = extraPhones.filter(p => p !== phone);
   setExtraPhones(updated);

   // Salvar com debounce
   if (contactDebounceTimerRef.current) {
     clearTimeout(contactDebounceTimerRef.current);
   }
   contactDebounceTimerRef.current = setTimeout(() => {
     saveContactData(updated);
   }, 500);
 }, [extraPhones, saveContactData]);

 // Cleanup do contact debounce timer
 useEffect(() => {
   return () => {
     if (contactDebounceTimerRef.current) {
       clearTimeout(contactDebounceTimerRef.current);
     }
   };
 }, []);


 const getStatusColor = (status: ReservationStatus) => {
  switch(status) {
    case ReservationStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
    case ReservationStatus.CONFIRMED: return 'bg-blue-100 text-blue-800';
    case ReservationStatus.CHECKIN: return 'bg-green-100 text-green-800';
    case ReservationStatus.CHECKOUT: return 'bg-gray-100 text-gray-800';
    case ReservationStatus.CANCELED: return 'bg-red-100 text-red-800';
  }
 };

 const handleDelete = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if(window.confirm("ATENÇÃO: Esta ação excluirá PERMANENTEMENTE a reserva do banco de dados.\n\nTem certeza que deseja continuar?")) {
    onDelete(reservation.id);
    onClose();
  }
 };

 const handleDismissCheckout = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if(window.confirm("Dispensar este checkout da lista de manutenção?\n\nEle não aparecerá mais na visualização, mas a reserva será mantida no sistema.")) {
    if (onDismissCheckout) {
      onDismissCheckout(reservation);
      onClose();
    }
  }
 };

 const handleSaveChanges = async () => {
   setSavingOverrides(true);
   try {
     const overrideKey = getReservationOverrideKey(reservation);

     console.log('[Modal] Salvando overrides:', {
       INPUT_reservation_id: reservation.id,
       INPUT_reservation_externalId: reservation.externalId,
       INPUT_reservation_source: reservation.source,
       CHAVE_CALCULADA: overrideKey,
       propertyCode: reservation.propertyCode,
       docsSent,
       docsSentToBuilding,
       hasChildren,
       maintenanceSeenAt
     });

     await storageService.reservationOverrides.set({
       reservationId: reservation.id,
       externalId: reservation.externalId,
       source: reservation.source, // CRÍTICO: incluir source
       propertyCode: reservation.propertyCode,
       guestName: reservation.guestName,
       language,
       docsSent,
       docsSentToBuilding,
       hasChildren,
       wantsBedSplit,
       earlyCheckIn: { requested: earlyRequest, time: earlyTime, granted: earlyGranted },
       lateCheckOut: { requested: lateRequest, time: lateTime, granted: lateGranted },
       flightInfo,
       roomConfig,
       notes,
       specialAttention,
       problemReported,
       // Task 41: Save maintenance seen status
       maintenanceSeenBy,
       maintenanceSeenAt,
       updatedAt: Date.now(),
       updatedBy: currentUser.name
     });

     // Invalidar cache do GuestView para atualizar as tags dos cards
     queryClient.invalidateQueries({ queryKey: ['guest-view-overrides'] });
     queryClient.invalidateQueries({ queryKey: ['reservation-overrides'] });

     // Atualiza o baseline para o novo estado salvo
     const newBaseline = JSON.stringify(getEditableFields());
     initialEditableRef.current = newBaseline;
     baselineSetRef.current = true; // Garante que flag permanece true
     setHasChanges(false);
   } catch (error) {
     console.error('Erro ao salvar overrides da reserva:', error);
     alert('Erro ao salvar alterações. Tente novamente.');
   } finally {
     setSavingOverrides(false);
   }
 };

 const handleFetchFlight = async () => {
   if(!flightInfo) return;
   setLoadingFlight(true);
   try {
    const data = await checkFlightStatus(flightInfo);
    if(data) {
      setFlightData(data);
      setHasChanges(true); 
    } else {
      alert("Não foi possível localizar informações para este voo. Verifique o código (ex: AA1234).");
    }
   } catch (error) {
     console.error(error);
     alert("Erro ao conectar com serviço de voos.");
   }
   setLoadingFlight(false);
 };

 const handleMaintenanceAck = async () => {
   // Task 41: Save to Firestore instead of just updating local state
   const seenBy = currentUser.name;
   const seenAt = Date.now();

   setMaintenanceSeenBy(seenBy);
   setMaintenanceSeenAt(seenAt);

   // Save to Firestore
   setSavingOverrides(true);
   try {
     const overrideKey = getReservationOverrideKey(reservation);

     console.log('[Modal] Marcando como visto:', {
       INPUT_reservation_id: reservation.id,
       INPUT_reservation_externalId: reservation.externalId,
       INPUT_reservation_source: reservation.source,
       CHAVE_CALCULADA: overrideKey,
       propertyCode: reservation.propertyCode,
       maintenanceSeenAt: seenAt,
       maintenanceSeenBy: seenBy
     });

     await storageService.reservationOverrides.set({
       reservationId: reservation.id,
       externalId: reservation.externalId,
       source: reservation.source, // CRÍTICO: incluir source
       propertyCode: reservation.propertyCode,
       guestName: reservation.guestName,
       language,
       docsSent,
       docsSentToBuilding,
       hasChildren,
       wantsBedSplit,
       earlyCheckIn: { requested: earlyRequest, time: earlyTime, granted: earlyGranted },
       lateCheckOut: { requested: lateRequest, time: lateTime, granted: lateGranted },
       flightInfo,
       roomConfig,
       notes,
       specialAttention,
       problemReported,
       maintenanceSeenBy: seenBy,
       maintenanceSeenAt: seenAt,
       updatedAt: Date.now(),
       updatedBy: currentUser.name
     });

     // Invalidar cache do GuestView para atualizar as tags dos cards
     queryClient.invalidateQueries({ queryKey: ['guest-view-overrides'] });
     queryClient.invalidateQueries({ queryKey: ['reservation-overrides'] });
   } catch (error) {
     console.error('Erro ao salvar status de manutenção:', error);
     alert('Erro ao salvar. Tente novamente.');
   } finally {
     setSavingOverrides(false);
   }

   // Also update the reservation object (for backward compatibility)
   onUpdateDetails(reservation.id, {
     maintenanceAck: {
       seen: true,
       seenBy,
       seenAt
     }
   });
 };

 const handleAddExpenseSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!expenseDesc || !expenseAmount) return;
  
  const amount = parseFloat(expenseAmount.replace(',', '.'));
  if (isNaN(amount) || amount <= 0) {
   alert("Valor inválido");
   return;
  }

  onAddExpense(reservation.id, expenseDesc, amount);
  setExpenseDesc('');
  setExpenseAmount('');
  setShowExpenseForm(false);
 };

 return (
  <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 animate-in fade-in slide-in-from-bottom-5">
   <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-none shadow-2xl overflow-hidden flex flex-col">
    
    {/* Header */}
    <div className="flex justify-between items-start p-4 md:p-6 border-b border-gray-100 sticky top-0 z-10 bg-white">
     <div className="flex-1 pr-4">
       <div className="md:hidden mb-2">
         <button onClick={onClose} className="flex items-center text-gray-500 -ml-2">
          <ChevronLeft size={20} /> Voltar
         </button>
       </div>
      <div className="flex items-center gap-2 mb-1">
       <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${getStatusColor(reservation.status)}`}>
         {reservation.status}
       </span>
       {docsSent && (
         <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-100">
           <FileCheck size={12} /> Docs OK
         </span>
       )}
      </div>
      <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-900 leading-tight">{reservation.propertyCode}</h2>
      <p className="text-gray-500 text-sm truncate">{reservation.propertyName}</p>
     </div>
     
     <div className="flex items-start gap-3">
       {/* Flags Controls */}
       <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-100 transition-colors" title="Marcar Atenção Especial">
          <input type="checkbox" checked={specialAttention} onChange={e => setSpecialAttention(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4" />
          <span className="text-xs font-bold text-purple-700">Atenção</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100 transition-colors" title="Reportar Problema">
          <input type="checkbox" checked={problemReported} onChange={e => setProblemReported(e.target.checked)} className="rounded text-red-600 focus:ring-red-500 w-4 h-4" />
          <span className="text-xs font-bold text-red-700">Problema</span>
        </label>
       </div>

       <button onClick={onClose} className="hidden md:block p-2 hover:bg-black/5 rounded-full transition-colors">
        <X size={24} className="text-gray-500" />
       </button>
     </div>
    </div>

    {/* Tab Navigation */}
    <div className="flex border-b border-gray-100">
      <button 
        onClick={() => setActiveTab('details')}
        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
      >
        Detalhes
      </button>
      <button 
        onClick={() => setActiveTab('history')}
        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
      >
        <History size={16} /> Histórico ({linkedTickets.length > 0 ? linkedTickets.length + (reservation.history?.length || 0) : (reservation.history?.length || 0)})
      </button>
    </div>

    {/* Body */}
    <div className="p-4 md:p-6 space-y-6 flex-1 overflow-y-auto pb-24 md:pb-6">
     
     {activeTab === 'details' ? (
       <>
        {/* Guest Info Card */}
        <div className="bg-blue-50 rounded-none p-5 border border-blue-100 relative">
          <div className="flex items-start gap-4">
            <div className="bg-white p-3 rounded-full text-blue-600 shadow-sm">
              <UserIcon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{reservation.guestName}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-sm text-blue-700">
                  {reservation.guestCount} Hóspedes {reservation.hasBabies && <span className="text-xs bg-white px-2 py-0.5 rounded-full ml-2 border border-blue-200">👶 Bebê</span>}
                </p>
                {guestReservationCount > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border border-purple-200 text-purple-700 bg-white">
                    <Repeat size={12} /> {guestReservationCount} {guestReservationCount === 1 ? 'reserva' : 'reservas'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Language & Docs */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="relative">
              <label className="text-xs font-semibold text-blue-800 uppercase block mb-1">Idioma</label>
              <div className="relative">
                <input 
                  value={language}
                  onChange={(e) => { setLanguage(e.target.value); setShowLangSuggestions(true); }}
                  className="w-full text-sm p-2 rounded border border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Selecionar..."
                />
                {showLangSuggestions && (
                  <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded shadow-lg max-h-32 overflow-y-auto mt-1">
                    {LANGUAGES.filter(l => l.toLowerCase().includes(language.toLowerCase())).map(lang => (
                    <li key={lang} onClick={() => { setLanguage(lang); setShowLangSuggestions(false); }} className="p-2 hover:bg-blue-50 cursor-pointer text-sm">
                      {lang}
                    </li>
                    ))}
                  </ul>
                )}
              </div>
             </div>
             <div>
              <label className="text-xs font-semibold text-blue-800 uppercase block mb-1">Status Documentação</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-blue-200">
                  <input 
                    type="checkbox" 
                    checked={docsSent} 
                    onChange={e => setDocsSent(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className={`text-sm font-medium ${docsSent ? 'text-green-600' : 'text-gray-500'}`}>
                    Recebido do Hóspede
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-blue-200">
                  <input 
                    type="checkbox" 
                    checked={docsSentToBuilding} 
                    onChange={e => setDocsSentToBuilding(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className={`text-sm font-medium flex items-center gap-1 ${docsSentToBuilding ? 'text-green-600' : 'text-gray-500'}`}>
                    <Building2 size={14} /> Enviado ao Prédio
                  </span>
                </label>
              </div>
             </div>
          </div>
        </div>

        {/* Task 6: Guest Contact Data */}
        <div className="bg-purple-50 rounded-none p-5 border border-purple-100">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={18} className="text-purple-700" />
            <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wide">Contato do Hóspede</h3>
            {savingContactData && <span className="text-xs text-purple-600 ml-auto">Salvando...</span>}
            {!savingContactData && extraPhones.length > 0 && <span className="text-xs text-green-600 ml-auto">✓ Salvo</span>}
          </div>

          {loadingContactData ? (
            <div className="space-y-2">
              <div className="animate-pulse bg-purple-100 h-10 rounded"></div>
              <div className="animate-pulse bg-purple-100 h-10 rounded"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Email & Phone Base (fonte externa) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail size={14} className="text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase">Email</span>
                  </div>
                  <p className="text-sm text-gray-900 break-all">
                    {displayEmail || <span className="text-gray-400 italic">Não informado</span>}
                  </p>
                </div>

                <div className="bg-white p-3 rounded border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone size={14} className="text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase">Telefone Principal</span>
                  </div>
                  <p className="text-sm text-gray-900">
                    {displayPhone ? formatPhoneSmart(displayPhone) : <span className="text-gray-400 italic">Não informado</span>}
                  </p>
                </div>
              </div>

              {/* Telefones Extras */}
              <div className="bg-white p-3 rounded border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-purple-800 uppercase">Telefones Adicionais</span>
                  <span className="text-xs text-gray-500">{extraPhones.length} cadastrado{extraPhones.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Lista de telefones extras */}
                {extraPhones.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {extraPhones.map((phone, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-purple-50 p-2 rounded">
                        <span className="text-sm text-gray-900">{formatPhoneSmart(phone)}</span>
                        <button
                          onClick={() => handleRemovePhone(phone)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remover telefone"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form para adicionar novo telefone */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(applyPhoneMaskBR(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPhone();
                      }
                    }}
                    className="flex-1 text-sm p-2 rounded border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="(11) 98765-4321"
                    maxLength={15}
                  />
                  <button
                    onClick={handleAddPhone}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                  >
                    <Plus size={16} />
                    <span className="text-sm font-medium">Adicionar</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-purple-700">
                💡 Nota: Telefones adicionais são compartilhados entre todas as reservas deste hóspede.
              </p>
            </div>
          )}
        </div>

        {/* Guest Notes */}
        <div className="bg-amber-50 rounded-none p-5 border border-amber-100">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-amber-700" />
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Observações sobre o Hóspede</h3>
            {savingNote && <span className="text-xs text-amber-600 ml-auto">Salvando...</span>}
            {!savingNote && guestNote && <span className="text-xs text-green-600 ml-auto">✓ Salvo</span>}
          </div>
          {loadingNote ? (
            <div className="animate-pulse bg-amber-100 h-24 rounded"></div>
          ) : (
            <textarea
              value={guestNote}
              onChange={(e) => handleGuestNoteChange(e.target.value)}
              className="w-full text-sm p-3 rounded border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-white"
              placeholder="Adicione observações internas sobre este hóspede (preferências, histórico, alertas, etc.)..."
              rows={4}
            />
          )}
          <p className="text-xs text-amber-700 mt-2">
            💡 Nota: Estas observações são compartilhadas entre todas as reservas deste hóspede e são visíveis apenas para a equipe.
          </p>
        </div>

        {/* Dates & Times (Early/Late) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Check-in & Check-out</h3>
          
          {/* Check-in Row */}
          <div className="p-4 rounded-none border border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-green-600" />
                <span className="font-bold text-gray-900">{formatDatePtBR(reservation.checkInDate)}</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={earlyRequest} onChange={e => setEarlyRequest(e.target.checked)} className="rounded text-green-600" />
                Early Check-in?
              </label>
            </div>
            {earlyRequest && (
              <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg animate-fade-in">
                <Clock size={16} className="text-green-700" />
                <input 
                  type="time" 
                  value={earlyTime} 
                  onChange={e => setEarlyTime(e.target.value)}
                  className="border border-green-200 rounded p-1 text-sm"
                />
                <label className="flex items-center gap-1 text-sm text-green-800 ml-auto cursor-pointer">
                  <input type="checkbox" checked={earlyGranted} onChange={e => setEarlyGranted(e.target.checked)} className="rounded text-green-600" />
                  Concedido
                </label>
              </div>
            )}
          </div>

          {/* Check-out Row */}
          <div className="p-4 rounded-none border border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-red-600" />
                <span className="font-bold text-gray-900">{formatDatePtBR(reservation.checkOutDate)}</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={lateRequest} onChange={e => setLateRequest(e.target.checked)} className="rounded text-red-600" />
                Late Check-out?
              </label>
            </div>
            {lateRequest && (
              <div className="flex items-center gap-3 bg-red-50 p-3 rounded-lg animate-fade-in">
                <Clock size={16} className="text-red-700" />
                <input 
                  type="time" 
                  value={lateTime} 
                  onChange={e => setLateTime(e.target.value)}
                  className="border border-red-200 rounded p-1 text-sm"
                />
                <label className="flex items-center gap-1 text-sm text-red-800 ml-auto cursor-pointer">
                  <input type="checkbox" checked={lateGranted} onChange={e => setLateGranted(e.target.checked)} className="rounded text-red-600" />
                  Concedido
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Editable Details */}
        <div className="space-y-4 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Detalhes Operacionais</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex gap-3 mb-2">
              <Plane className="text-gray-400 mt-3" size={20} />
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Voo / Transporte</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={flightInfo}
                    onChange={(e) => setFlightInfo(e.target.value)}
                    className="flex-1 p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ex: AA1234"
                  />
                  <button 
                    onClick={handleFetchFlight}
                    disabled={!flightInfo || loadingFlight}
                    className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Buscar Status Google"
                  >
                    <RefreshCw size={18} className={loadingFlight ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
            </div>

            {/* FLIGHT STATUS DISPLAY */}
            {flightData && (
              <div className="ml-8 mt-2 p-3 bg-white rounded border border-gray-200 text-sm animate-fade-in">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                    ${flightData.status === 'Landed' || flightData.status === 'On Time' ? 'bg-green-100 text-green-700' : 
                     flightData.status === 'Delayed' || flightData.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                     'bg-gray-100 text-gray-600'}`}>
                    {flightData.status}
                  </span>
                  <span className="text-gray-600 font-bold">{flightData.number}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Chegada Prevista: <strong>{flightData.estimatedArrival}</strong></span>
                  <span>Atualizado: {new Date(flightData.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <BedDouble className="text-gray-400 mt-3" size={20} />
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Configuração de Quartos</label>
              <textarea
                rows={2}
                value={roomConfig}
                onChange={(e) => setRoomConfig(e.target.value)}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Descreva a montagem das camas..."
              />
              {/* Checkboxes for room config options */}
              <div className="flex flex-wrap gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={hasChildren}
                    onChange={(e) => setHasChildren(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Baby size={16} className="text-pink-500" />
                  <span>Possui Criança</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={wantsBedSplit}
                    onChange={(e) => setWantsBedSplit(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <BedDouble size={16} className="text-amber-500" />
                  <span>Cama Queen/King → 2 Solteiro</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <FileText className="text-gray-400 mt-3" size={20} />
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-800 mb-1">Pedidos Especiais (Notas)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Informações importantes sobre a reserva..."
              />
            </div>
          </div>

          {/* Maintenance Acknowledgment */}
          {currentUser.role !== 'Guest Relations' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
               <div className="flex justify-between items-center">
                 <div>
                   <h4 className="font-bold text-gray-800 text-sm">Status Manutenção</h4>
                   <p className="text-xs text-gray-500">
                     {maintenanceSeenAt 
                      ? `Visto por ${maintenanceSeenBy?.split(' ')[0]} em ${formatDatePtBR(maintenanceSeenAt)}` 
                      : 'Ainda não visualizado ou possui alterações recentes.'}
                   </p>
                 </div>
                 {!maintenanceSeenAt ? (
                   <button 
                    onClick={handleMaintenanceAck}
                    className="bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-900 transition-colors flex items-center gap-2"
                   >
                     <Eye size={14} /> Marcar Visto
                   </button>
                 ) : (
                   <div className="flex items-center gap-1 text-green-600 text-sm font-bold">
                     <CheckCircle2 size={16} /> Ciente
                   </div>
                 )}
               </div>
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
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            >
            <Plus size={14} /> Adicionar
            </button>
          )}
          </div>

          {/* List of Expenses */}
          <div className="space-y-2 mb-4">
          {reservation.expenses && reservation.expenses.length > 0 ? (
            reservation.expenses.map(exp => (
            <div key={exp.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm group">
              <div className="flex-1">
              <p className="font-medium text-gray-900">{exp.description}</p>
              <p className="text-xs text-gray-500">
                {formatDatePtBR(exp.createdAt)} por {exp.createdBy} • <span className="text-blue-600 font-medium bg-blue-50 px-1 rounded">{exp.paymentMethod}</span>
              </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-gray-800">
                R$ {exp.amount.toFixed(2).replace('.', ',')}
                </p>
                <button 
                  onClick={() => {
                    if(window.confirm("Tem certeza que deseja excluir esta despesa?")) {
                      onDeleteExpense(reservation.id, exp.id);
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Excluir despesa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            ))
          ) : (
            !showExpenseForm && <p className="text-sm text-gray-400 italic">Nenhuma despesa registrada para esta reserva.</p>
          )}
          </div>

          {/* Add Expense Form */}
          {showExpenseForm && (
          <form onSubmit={handleAddExpenseSubmit} className="bg-blue-50/50 p-4 rounded-none border border-blue-100 animate-fade-in">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Nova Despesa de Reserva</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
              <input 
              type="text" 
              value={expenseDesc}
              onChange={e => setExpenseDesc(e.target.value)}
              placeholder="Ex: Kit boas vindas, Limpeza extra..."
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
              required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento</label>
              <input 
              type="text" 
              value="Caju" 
              disabled 
              className="w-full p-2 text-sm border border-gray-200 bg-gray-100 text-gray-500 rounded cursor-not-allowed font-medium"
              />
            </div>
            </div>
            <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setShowExpenseForm(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
            >
              Registrar
            </button>
            </div>
          </form>
          )}
        </div>

        {/* Maintenance Section */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Wrench size={16} /> Chamados de Manutenção
            </h3>
            <button 
              onClick={onCreateTicket}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 hover:bg-brand-50 px-2 py-1 rounded transition-colors"
            >
              <Plus size={14} /> Abrir Chamado
            </button>
          </div>

          <div className="space-y-2">
            {linkedTickets.length > 0 ? (
              linkedTickets.map(t => (
                <div key={t.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-medium text-gray-900 text-sm truncate">{t.serviceType}: {t.description}</p>
                    <p className="text-xs text-gray-500">{formatDatePtBR(t.createdAt)} • {t.assignee || 'Sem técnico'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap
                    ${t.status === 'Concluído' ? 'bg-green-100 text-green-700' : 
                     t.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {t.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">Nenhum chamado vinculado.</p>
            )}
          </div>
        </div>
       </>
     ) : (
       // HISTORY TAB
       <div className="space-y-6">
         {/* Tickets Section */}
         {linkedTickets.length > 0 && (
           <div className="space-y-3">
             <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
               <Wrench size={12} /> Chamados de Manutenção
             </h4>
             {linkedTickets.map(t => (
               <div key={t.id} className="flex gap-3 text-sm border-b border-gray-100 pb-3 last:border-0">
                 <div className="mt-1">
                   <div className={`w-2 h-2 rounded-full ${
                     t.status === 'Concluído' ? 'bg-green-500' : 
                     t.status === 'Em Andamento' ? 'bg-yellow-500' : 'bg-red-500'
                   }`}></div>
                 </div>
                 <div className="flex-1">
                   <p className="text-gray-900 font-medium">{t.serviceType}: {t.description}</p>
                   <div className="flex items-center gap-2 mt-1">
                     <p className="text-xs text-gray-500">
                       {formatDatePtBR(t.createdAt)} • {t.assignee || 'Sem técnico'}
                     </p>
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                       ${t.status === 'Concluído' ? 'bg-green-100 text-green-700' : 
                        t.status === 'Em Andamento' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                       {t.status}
                     </span>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         )}
         
         {/* Log Section */}
         <div className="space-y-3">
           <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
             <FileText size={12} /> Logs do Sistema
           </h4>
           {reservation.history && reservation.history.length > 0 ? (
             reservation.history.sort((a,b) => b.timestamp - a.timestamp).map(log => (
               <div key={log.id} className="flex gap-3 text-sm border-b border-gray-100 pb-3 last:border-0">
                 <div className="mt-1">
                   <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                 </div>
                 <div>
                   <p className="text-gray-900 font-medium">{log.action}</p>
                   <p className="text-xs text-gray-500">
                     {new Date(log.timestamp).toLocaleString()} por <strong>{log.user}</strong>
                   </p>
                 </div>
               </div>
             ))
           ) : (
             <p className="text-gray-500 text-sm italic">Nenhum histórico de log registrado ainda.</p>
           )}
         </div>
       </div>
     )}

    </div>

    {/* Footer Actions - Sticky on Mobile */}
    <div className="p-4 md:p-6 border-t border-gray-100 bg-white md:bg-gray-50 md:rounded-b-2xl fixed md:static bottom-0 left-0 right-0 z-20 pb-safe">
      
      <div className="flex justify-between gap-3 items-center">
        <button
        type="button"
        onClick={onDismissCheckout ? handleDismissCheckout : handleDelete}
        className="text-red-500 text-sm hover:text-red-700 hover:bg-red-50 py-3 md:py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-red-100"
        >
          <Trash2 size={16} /> <span className="hidden md:inline">{onDismissCheckout ? 'Dispensar' : 'Excluir'}</span>
        </button>

        {hasChanges && (
         <button
          onClick={handleSaveChanges}
          disabled={savingOverrides}
          className={`flex-1 md:flex-none ${savingOverrides ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-3 md:py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm animate-fade-in`}
         >
           {savingOverrides ? (
             <>
               <RefreshCw size={16} className="animate-spin" /> Salvando...
             </>
           ) : (
             <>
               <Save size={16} /> Salvar Alterações
             </>
           )}
         </button>
        )}
      </div>
    </div>
   </div>
  </div>
 );
};

export default ReservationDetailModal;
