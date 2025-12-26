import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { ServiceType } from '../../types';
import type {
  Ticket,
  Reservation,
  UserWithPassword,
  Property,
  GuestTip,
  GuestFeedback,
  MonitoredFlight,
  LogEntry,
  Supplier,
  Delivery,
  OfficeSupply,
  CompanyAsset,
  WorkShift,
  ConciergeOffer,
  Board,
  BoardColumn,
  BoardCard,
  CallSession,
  ServiceTypeDefinition,
  AfterHoursConfig
} from '../../types';

export interface AppData {
  tickets: Ticket[];
  reservations: Reservation[];
  users: UserWithPassword[];
  properties: Property[];
  settings: {
    priorities: string[];
    serviceTypes: (string | ServiceTypeDefinition)[];
    afterHours?: AfterHoursConfig;
  };
  tips: GuestTip[];
  feedbacks: GuestFeedback[];
  monitoredFlights: MonitoredFlight[];
  logs: LogEntry[];
  suppliers: Supplier[];
  officeDeliveries: Delivery[];
  officeSupplies: OfficeSupply[];
  officeAssets: CompanyAsset[];
  officeShifts: WorkShift[];
  conciergeOffers: ConciergeOffer[];
  boards: Board[];
  boardColumns: BoardColumn[];
  boardCards: BoardCard[];
  incomingCalls: CallSession[];
  maintenanceOverrides: Record<string, { hidden: boolean; updatedAt: number }>;
}

export function useDataSubscriptions(
  isDbConnected: boolean,
  kioskProperty: string | null
): AppData {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [users, setUsers] = useState<UserWithPassword[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [settings, setSettings] = useState<{
    priorities: string[];
    serviceTypes: (string | ServiceTypeDefinition)[];
    afterHours?: AfterHoursConfig;
  }>({ priorities: [], serviceTypes: [] });

  const [tips, setTips] = useState<GuestTip[]>([]);
  const [feedbacks, setFeedbacks] = useState<GuestFeedback[]>([]);
  const [monitoredFlights, setMonitoredFlights] = useState<MonitoredFlight[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Office & Concierge
  const [officeDeliveries, setOfficeDeliveries] = useState<Delivery[]>([]);
  const [officeSupplies, setOfficeSupplies] = useState<OfficeSupply[]>([]);
  const [officeAssets, setOfficeAssets] = useState<CompanyAsset[]>([]);
  const [officeShifts, setOfficeShifts] = useState<WorkShift[]>([]);
  const [conciergeOffers, setConciergeOffers] = useState<ConciergeOffer[]>([]);

  // Boards
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardColumns, setBoardColumns] = useState<BoardColumn[]>([]);
  const [boardCards, setBoardCards] = useState<BoardCard[]>([]);

  // Calls
  const [incomingCalls, setIncomingCalls] = useState<CallSession[]>([]);

  // Maintenance Overrides
  const [maintenanceOverrides, setMaintenanceOverrides] = useState<Record<string, { hidden: boolean; updatedAt: number }>>({});

  useEffect(() => {
    if (!isDbConnected) return;

    const unsubTickets = storageService.tickets.subscribe(setTickets);
    const unsubReservations = storageService.reservations.subscribe(setReservations);
    const unsubUsers = storageService.users.subscribe(setUsers);
    const unsubProperties = storageService.properties.subscribe(setProperties);

    // Settings Subscription with Auto-Update for Checkout Cleaning
    const unsubSettings = storageService.settings.subscribe((data) => {
      const types = data.serviceTypes || [];
      // Check if CHECKOUT_CLEANING exists (either as string or object name)
      const hasCheckout = types.some((t) =>
        (typeof t === 'string' ? t : t.name) === ServiceType.CHECKOUT_CLEANING
      );

      if (!hasCheckout) {
        // If missing, add it to the state AND persist to DB so it shows up in Settings for editing
        const updatedTypes = [...types, ServiceType.CHECKOUT_CLEANING];
        // @ts-ignore - fixing type mismatch with generic
        setSettings({ ...data, serviceTypes: updatedTypes });
        storageService.settings.update({ serviceTypes: updatedTypes });
      } else {
        // @ts-ignore
        setSettings(data);
      }
    });

    const unsubTips = storageService.tips.subscribe(setTips);
    const unsubFeedbacks = storageService.feedbacks.subscribe(setFeedbacks);
    const unsubFlights = storageService.monitoredFlights.subscribe(setMonitoredFlights);
    const unsubLogs = storageService.logs.subscribe(setLogs);
    const unsubSuppliers = storageService.suppliers.subscribe(setSuppliers);

    // Office & Concierge
    const unsubDeliveries = storageService.officeDeliveries.subscribe(setOfficeDeliveries);
    const unsubOfficeSupplies = storageService.officeSupplies.subscribe(setOfficeSupplies);
    const unsubAssets = storageService.officeAssets.subscribe(setOfficeAssets);
    const unsubShifts = storageService.officeShifts.subscribe(setOfficeShifts);
    const unsubConciergeOffers = storageService.conciergeOffers.subscribe(setConciergeOffers);

    // Boards
    const unsubBoards = storageService.boards.subscribe(setBoards);
    const unsubBoardColumns = storageService.boardColumns.subscribe(setBoardColumns);
    const unsubBoardCards = storageService.boardCards.subscribe(setBoardCards);

    // Calls (Only for staff)
    let unsubCalls = () => {};
    if (!kioskProperty) {
      unsubCalls = storageService.communication.subscribeAllCalls((calls) => {
        // Filter only ringing
        setIncomingCalls(calls);
      });
    }

    // Maintenance Overrides
    const unsubMaintenanceOverrides = storageService.maintenanceOverrides.subscribe(setMaintenanceOverrides);

    return () => {
      unsubTickets();
      unsubReservations();
      unsubUsers();
      unsubProperties();
      unsubSettings();
      unsubTips();
      unsubFeedbacks();
      unsubFlights();
      unsubLogs();
      unsubSuppliers();
      unsubDeliveries();
      unsubOfficeSupplies();
      unsubAssets();
      unsubShifts();
      unsubConciergeOffers();
      unsubBoards();
      unsubBoardColumns();
      unsubBoardCards();
      unsubCalls();
      unsubMaintenanceOverrides();
    };
  }, [isDbConnected, kioskProperty]);

  return {
    tickets,
    reservations,
    users,
    properties,
    settings,
    tips,
    feedbacks,
    monitoredFlights,
    logs,
    suppliers,
    officeDeliveries,
    officeSupplies,
    officeAssets,
    officeShifts,
    conciergeOffers,
    boards,
    boardColumns,
    boardCards,
    incomingCalls,
    maintenanceOverrides,
  };
}
