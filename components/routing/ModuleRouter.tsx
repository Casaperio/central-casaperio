import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ViewMode, User, Ticket, Reservation, Property, GuestFeedback, MonitoredFlight, LogEntry, InventoryItem, InventoryTransaction, Delivery, OfficeSupply, CompanyAsset, WorkShift, Supplier, ConciergeOffer, Board, BoardColumn, BoardCard, GuestTip, ServiceTypeDefinition, AfterHoursConfig, UserWithPassword, PropertyCharacteristics } from '../../types';
import { storageService } from '../../services/storage';
import { generateId } from '../../utils';

// Lazy loaded components
const GeneralCalendar = lazy(() => import('../GeneralCalendar'));
const GuestCRM = lazy(() => import('../GuestCRM'));

// Eager components
import { StatsDashboard } from '../StatsDashboard';
import AdminPanel from '../AdminPanel';
import SettingsPanel from '../SettingsPanel';
import LogsPanel from '../LogsPanel';
import ReportsPanel from '../ReportsPanel';
import GuestCMS from '../GuestCMS';
import ConciergeCMS from '../ConciergeCMS';
import FeedbackPanel from '../FeedbackPanel';
import ProfilePanel from '../ProfilePanel';
import FlightsPanel from '../FlightsPanel';
import InventoryPanel from '../InventoryPanel';
import OfficePanel from '../OfficePanel';
import PropertiesTool from '../PropertiesTool';
import FinancialPanel from '../FinancialPanel';
import MapPanel from '../MapPanel';
import BoardList from '../BoardList';
import BoardDetail from '../BoardDetail';
import InboxPanel from '../InboxPanel';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 size={40} className="animate-spin text-brand-600" />
      <p className="text-sm text-gray-500">Carregando módulo...</p>
    </div>
  </div>
);

interface ModuleRouterProps {
  viewMode: ViewMode;
  currentUser: User;
  users: UserWithPassword[];
  tickets: Ticket[];
  staysReservations: Reservation[];
  properties: Property[];
  propertiesFromMongoDB: PropertyCharacteristics[];
  settings: {
    priorities: string[];
    serviceTypes: (string | ServiceTypeDefinition)[];
    afterHours?: AfterHoursConfig;
  };
  suppliers: Supplier[];
  tips: GuestTip[];
  feedbacks: GuestFeedback[];
  conciergeOffers: ConciergeOffer[];
  logs: LogEntry[];
  monitoredFlights: MonitoredFlight[];
  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  officeDeliveries: Delivery[];
  boards: Board[];
  boardColumns: BoardColumn[];
  boardCards: BoardCard[];
  staysCalendarData: any;
  selectedBoard: Board | null;
  setSelectedBoard: (board: Board | null) => void;
  setSelectedReservation: (reservation: Reservation | null) => void;
  addLog: (action: string, details: string) => void;
  updatePropertyInState: (property: PropertyCharacteristics) => void;
  createInventoryItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => Promise<InventoryItem>;
  updateInventoryItem: (item: InventoryItem) => Promise<InventoryItem>;
  deleteInventoryItem: (id: string) => Promise<void>;
  createInventoryTransaction: (tx: {
    itemId: string;
    type: any;
    quantity: number;
    source: string;
    destination: string;
    user: string;
    notes?: string;
  }) => Promise<void>;
  handleActivateTablet: (propertyCode: string) => void;
  handleOpenFieldApp: () => void;
  maintenanceOverrides?: Record<string, { hidden: boolean; updatedAt: number }>;
  // Task 2: Callback para expansão dinâmica do range de dados
  onCalendarVisibleRangeChange?: (startDate: Date, days: number, isFullscreen: boolean) => void;
}

export function ModuleRouter({
  viewMode,
  currentUser,
  users,
  tickets,
  staysReservations,
  properties,
  propertiesFromMongoDB,
  settings,
  suppliers,
  tips,
  feedbacks,
  conciergeOffers,
  logs,
  monitoredFlights,
  inventoryItems,
  inventoryTransactions,
  officeDeliveries,
  boards,
  boardColumns,
  boardCards,
  staysCalendarData,
  selectedBoard,
  setSelectedBoard,
  setSelectedReservation,
  addLog,
  updatePropertyInState,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createInventoryTransaction,
  handleActivateTablet,
  handleOpenFieldApp,
  maintenanceOverrides,
  onCalendarVisibleRangeChange,
}: ModuleRouterProps) {

  if (viewMode === 'stats') {
    return <StatsDashboard />;
  }

  if (viewMode === 'admin') {
    return (
      <AdminPanel
        users={users}
        onAddUser={(u) => {
          storageService.users.addOrUpdate(u);
          addLog('Criar Usuário', `Adicionou ${u.name}`);
        }}
        onDeleteUser={(id) => {
          storageService.users.delete(id);
          addLog('Excluir Usuário', `Removeu usuário ID ${id}`);
        }}
        onUpdateUser={(u) => {
          storageService.users.update(u);
          addLog('Atualizar Usuário', `Atualizou ${u.name}`);
        }}
        currentUserEmail={currentUser.email}
      />
    );
  }

  if (viewMode === 'settings') {
    return (
      <SettingsPanel
        properties={properties}
        priorities={settings.priorities}
        serviceTypes={settings.serviceTypes}
        suppliers={suppliers}
        afterHoursConfig={settings.afterHours}
        onAddProperty={(c, a) => {
          storageService.properties.add({code:c, address:a});
          addLog('Config', `Adicionou imóvel ${c}`);
        }}
        onDeleteProperty={(c) => {
          storageService.properties.delete(c);
          addLog('Config', `Removeu imóvel ${c}`);
        }}
        onAddPriority={(p) => storageService.settings.update({priorities: [...settings.priorities, p]})}
        onDeletePriority={(p) => storageService.settings.update({priorities: settings.priorities.filter(x => x !== p)})}
        onAddServiceType={(s) => storageService.settings.update({serviceTypes: [...settings.serviceTypes, s]})}
        onDeleteServiceType={(s) => storageService.settings.update({serviceTypes: settings.serviceTypes.filter(x => {
            const existingName = typeof x === 'string' ? x : x.name;
            const nameToDelete = typeof s === 'string' ? s : s.name;
            return existingName !== nameToDelete;
        })})}
        onUpdateServiceType={(oldVal, newVal) => {
           const newTypes = settings.serviceTypes.map(s => {
               const sName = typeof s === 'string' ? s : s.name;
               const oldName = typeof oldVal === 'string' ? oldVal : oldVal.name;
               return sName === oldName ? newVal : s;
           });
           storageService.settings.update({ serviceTypes: newTypes });
        }}
        inventoryItems={inventoryItems}
        onAddInventoryItem={createInventoryItem}
        onDeleteInventoryItem={deleteInventoryItem}
        onUpdateInventoryItem={updateInventoryItem}
        onAddSupplier={(supplier) => storageService.suppliers.add(supplier)}
        onDeleteSupplier={(id) => storageService.suppliers.delete(id)}
        onUpdateSupplier={(supplier) => storageService.suppliers.update(supplier)}
        onActivateTablet={handleActivateTablet}
        onOpenFieldApp={handleOpenFieldApp}
      />
    );
  }

  if (viewMode === 'logs') {
    return <LogsPanel logs={logs} />;
  }

  if (viewMode === 'reports') {
    return <ReportsPanel tickets={tickets} reservations={staysReservations} />;
  }

  if (viewMode === 'cms') {
    return (
      <GuestCMS
        tips={tips}
        onAddTip={(t) => storageService.tips.add(t)}
        onDeleteTip={(id) => storageService.tips.delete(id)}
      />
    );
  }

  if (viewMode === 'concierge-cms') {
    return (
      <ConciergeCMS
        offers={conciergeOffers}
        suppliers={suppliers}
        onAddOffer={(o) => storageService.conciergeOffers.add(o)}
        onUpdateOffer={(o) => storageService.conciergeOffers.update(o)}
        onDeleteOffer={(id) => storageService.conciergeOffers.delete(id)}
      />
    );
  }

  if (viewMode === 'feedbacks') {
    return (
      <FeedbackPanel
        generalFeedbacks={feedbacks}
        tickets={tickets}
        reservations={staysReservations}
        users={users}
      />
    );
  }

  if (viewMode === 'profile') {
    return (
      <ProfilePanel
        user={currentUser}
        onUpdatePassword={async (curr, newP) => {
          const fullUser = users.find(u => u.id === currentUser.id);
          if (!fullUser || curr !== fullUser.password) return false;
          storageService.users.update({...fullUser, password: newP});
          return true;
        }}
        onUpdatePreferences={(u) => {
          const fullUser = users.find(us => us.id === u.id);
          if (fullUser) {
            storageService.users.update({ ...fullUser, ...u });
          }
        }}
      />
    );
  }

  if (viewMode === 'flights') {
    return (
      <FlightsPanel
        reservations={staysReservations}
        monitoredFlights={monitoredFlights}
        onUpdateReservation={(id, data) => storageService.reservations.update({id, ...data} as any)}
        onAddMonitoredFlight={(f) => storageService.monitoredFlights.add(f)}
        onUpdateMonitoredFlight={(f) => storageService.monitoredFlights.update(f)}
        onDeleteMonitoredFlight={(id) => storageService.monitoredFlights.delete(id)}
        onNotify={(msg) => alert(msg)}
      />
    );
  }

  if (viewMode === 'inventory') {
    return (
      <InventoryPanel
        items={inventoryItems}
        transactions={inventoryTransactions}
        properties={properties}
        currentUser={currentUser}
        onUpdateItem={updateInventoryItem}
        onCreateItem={createInventoryItem}
        onDeleteItem={deleteInventoryItem}
        onCreateTransaction={createInventoryTransaction}
      />
    );
  }

  if (viewMode === 'office') {
    return (
      <OfficePanel
        deliveries={officeDeliveries}
        properties={properties}
        users={users}
        currentUser={currentUser}
      />
    );
  }

  if (viewMode === 'properties') {
    return (
      <PropertiesTool
        properties={propertiesFromMongoDB}
        currentUserRole={currentUser?.role}
        currentUser={currentUser}
        onPropertyUpdated={updatePropertyInState}
      />
    );
  }

  if (viewMode === 'financial') {
    return <FinancialPanel reservations={staysReservations} properties={properties} />;
  }

  if (viewMode === 'map') {
    return (
      <MapPanel
        properties={properties}
        reservations={staysReservations}
        tickets={tickets}
        onUpdateProperty={(p) => storageService.properties.add(p)}
      />
    );
  }

  if (viewMode === 'guest-crm') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <GuestCRM
          reservations={staysReservations}
          tickets={tickets}
          feedbacks={feedbacks}
          currentUser={currentUser}
          maintenanceOverrides={maintenanceOverrides}
        />
      </Suspense>
    );
  }

  if (viewMode === 'general-calendar') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <GeneralCalendar
          units={staysCalendarData?.units || []}
          onReservationClick={(calendarRes) => {
            // Find full reservation from staysReservations using bookingId
            const fullReservation = staysReservations.find(
              r => r.externalId === calendarRes.bookingId || r.id === calendarRes.bookingId
            );

            if (fullReservation) {
              setSelectedReservation(fullReservation);
            } else {
              console.warn('Reserva não encontrada:', calendarRes.bookingId);
            }
          }}
          onVisibleRangeChange={onCalendarVisibleRangeChange}
        />
      </Suspense>
    );
  }

  if (viewMode === 'boards') {
    if (!selectedBoard) {
      return (
        <BoardList
          boards={boards}
          currentUser={currentUser}
          onSelectBoard={setSelectedBoard}
          onCreateBoard={async (b) => {
            await storageService.boards.add(b);
            const defaultCols = ['A Fazer', 'Em Progresso', 'Concluído'];
            defaultCols.forEach((title, idx) => {
              storageService.boardColumns.add({
                id: generateId(),
                boardId: b.id,
                title,
                order: idx
              });
            });
            addLog('Painel', `Criou novo painel: ${b.title}`);
          }}
        />
      );
    } else {
      return (
        <BoardDetail
          board={selectedBoard}
          columns={boardColumns}
          cards={boardCards}
          users={users}
          onBack={() => setSelectedBoard(null)}
          onAddColumn={(title) => {
            storageService.boardColumns.add({
              id: generateId(),
              boardId: selectedBoard.id,
              title,
              order: boardColumns.filter(c => c.boardId === selectedBoard.id).length
            });
          }}
          onUpdateColumn={(col) => storageService.boardColumns.update(col)}
          onDeleteColumn={(id) => storageService.boardColumns.delete(id)}
          onAddCard={(card) => storageService.boardCards.add(card)}
          onUpdateCard={(card) => storageService.boardCards.update(card)}
          onDeleteCard={(id) => storageService.boardCards.delete(id)}
          onUpdateBoard={(b) => storageService.boards.update(b)}
          onDeleteBoard={(id) => storageService.boards.delete(id)}
        />
      );
    }
  }

  if (viewMode === 'messages') {
    return (
      <InboxPanel
        currentUser={currentUser}
        reservations={staysReservations}
        properties={properties}
      />
    );
  }

  return null;
}
