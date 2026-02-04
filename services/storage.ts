import { db, storage } from './firebase';
import { BoardCardAttachment } from '../types';
import {
  Ticket, UserWithPassword, LogEntry, Property, Reservation,
  GuestTip, GuestFeedback, GuestNote, GuestContactData, ReservationOverrides, MonitoredFlight, InventoryItem,
  InventoryTransaction, Delivery, OfficeSupply, CompanyAsset, WorkShift,
  ConciergeOffer, Supplier, ServiceTypeDefinition,
  Board, BoardColumn, BoardCard, AfterHoursConfig, ChatMessage, CallSession, AppModule
} from '../types';
import { MOCK_PROPERTIES, PRIORITIES, SERVICE_TYPES, MOCK_USERS } from '../constants';
import { getReservationOverrideKey } from '../utils';

// Nome das coleções no Firestore
const COLLECTIONS = {
  TICKETS: 'tickets',
  RESERVATIONS: 'reservations',
  USERS: 'users',
  LOGS: 'logs',
  PROPERTIES: 'properties',
  SETTINGS: 'settings',
  TIPS: 'tips',
  FEEDBACKS: 'feedbacks',
  GUEST_NOTES: 'guest_notes',
  GUEST_CONTACT_DATA: 'guest_contact_data', // Task 6: Telefones extras do hóspede
  RESERVATION_OVERRIDES: 'reservation_overrides',
  MONITORED_FLIGHTS: 'monitoredFlights',
  INVENTORY_ITEMS: 'inventory_items',
  INVENTORY_TRANSACTIONS: 'inventory_transactions',
  // New Office Collections
  OFFICE_DELIVERIES: 'office_deliveries',
  OFFICE_SUPPLIES: 'office_supplies',
  OFFICE_ASSETS: 'office_assets',
  OFFICE_SHIFTS: 'office_shifts',
  // Concierge
  CONCIERGE_OFFERS: 'concierge_offers',
  // Suppliers
  SUPPLIERS: 'suppliers',
  // Boards
  BOARDS: 'boards',
  BOARD_COLUMNS: 'board_columns',
  BOARD_CARDS: 'board_cards',
  // Communication
  MESSAGES: 'messages',
  CALLS: 'calls',
  // Maintenance Overrides
  MAINTENANCE_OVERRIDES: 'maintenance_overrides'
};

const ensureDb = () => {
  if (!db) throw new Error("Banco de dados não conectado! Verifique a conexão com a internet.");
};

// Sanitize ID to make it Firebase-compatible (remove invalid characters like /)
const sanitizeDocId = (id: string): string => {
  return id.replace(/\//g, '_');
};

// Helper to remove undefined keys recursively
const cleanData = (data: any): any => {
    if (Array.isArray(data)) {
        return data.map(item => cleanData(item));
    } else if (data !== null && typeof data === 'object') {
        return Object.keys(data).reduce((acc, key) => {
            const value = data[key];
            if (value !== undefined) {
                acc[key] = cleanData(value);
            }
            return acc;
        }, {} as any);
    }
    return data;
};


// Serviço de Armazenamento 100% Online (Firestore v8 compat)
export const storageService = {
  
  // --- TICKETS ---
  tickets: {
    subscribe: (callback: (tickets: Ticket[]) => void) => {
      if (!db) return () => {};
      
      const q = db.collection(COLLECTIONS.TICKETS);
      return q.onSnapshot((snapshot) => {
        const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
        tickets.sort((a, b) => b.createdAt - a.createdAt);
        callback(tickets);
      }, (error) => {
        console.error("Erro ao buscar tickets:", error);
      });
    },
    
    add: async (ticket: Ticket) => {
      ensureDb();
      const { id, ...data } = ticket; 
      await db.collection(COLLECTIONS.TICKETS).add(cleanData(data));
    },

    update: async (ticket: Ticket) => {
      ensureDb();
      const { id, ...data } = ticket;
      await db.collection(COLLECTIONS.TICKETS).doc(ticket.id).update(cleanData(data));
    },

    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.TICKETS).doc(id).delete();
    },

    // Buscar ticket existente de checkout por reservationId
    findByReservation: async (reservationId: string): Promise<Ticket | null> => {
      ensureDb();
      const q = db.collection(COLLECTIONS.TICKETS)
        .where('reservationId', '==', reservationId)
        .where('isCheckoutTicket', '==', true)
        .limit(1);
      
      const snapshot = await q.get();
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Ticket;
    }
  },

  // --- RESERVATIONS ---
  reservations: {
    subscribe: (callback: (reservations: Reservation[]) => void) => {
      if (!db) return () => {};
      
      const q = db.collection(COLLECTIONS.RESERVATIONS);
      return q.onSnapshot((snapshot) => {
        const reservations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
        reservations.sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
        callback(reservations);
      }, (error) => {
        console.error("Erro ao buscar reservas:", error);
      });
    },
    
    add: async (reservation: Reservation) => {
      ensureDb();
      const { id, ...data } = reservation; 
      await db.collection(COLLECTIONS.RESERVATIONS).add(cleanData(data));
    },

    update: async (reservation: Reservation) => {
      ensureDb();
      const { id, ...data } = reservation;
      // Use set with merge to handle both existing docs and new overlays for Stays API reservations
      await db.collection(COLLECTIONS.RESERVATIONS).doc(reservation.id).set(cleanData(data), { merge: true });
    },

    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.RESERVATIONS).doc(id).delete();
    }
  },

  // --- MONITORED FLIGHTS ---
  monitoredFlights: {
    subscribe: (callback: (flights: MonitoredFlight[]) => void) => {
        if (!db) return () => {};
        const q = db.collection(COLLECTIONS.MONITORED_FLIGHTS);
        return q.onSnapshot((snapshot) => {
            const flights = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonitoredFlight));
            flights.sort((a, b) => b.createdAt - a.createdAt);
            callback(flights);
        });
    },
    add: async (flight: MonitoredFlight) => {
        ensureDb();
        const { id, ...data } = flight;
        await db.collection(COLLECTIONS.MONITORED_FLIGHTS).add(cleanData(data));
    },
    update: async (flight: MonitoredFlight) => {
        ensureDb();
        const { id, ...data } = flight;
        await db.collection(COLLECTIONS.MONITORED_FLIGHTS).doc(flight.id).update(cleanData(data));
    },
    delete: async (id: string) => {
        ensureDb();
        await db.collection(COLLECTIONS.MONITORED_FLIGHTS).doc(id).delete();
    }
  },

  // --- GUEST TIPS (BLOG) ---
  tips: {
    subscribe: (callback: (tips: GuestTip[]) => void) => {
      if (!db) return () => {};
      return db.collection(COLLECTIONS.TIPS).onSnapshot((snapshot) => {
        const tips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuestTip));
        tips.sort((a, b) => b.createdAt - a.createdAt);
        callback(tips);
      });
    },
    add: async (tip: GuestTip) => {
      ensureDb();
      const { id, ...data } = tip;
      await db.collection(COLLECTIONS.TIPS).add(cleanData(data));
    },
    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.TIPS).doc(id).delete();
    }
  },

  // --- CONCIERGE OFFERS ---
  conciergeOffers: {
    subscribe: (callback: (offers: ConciergeOffer[]) => void) => {
      if (!db) return () => {};
      return db.collection(COLLECTIONS.CONCIERGE_OFFERS).onSnapshot((snapshot) => {
        const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConciergeOffer));
        // Sort by date (if exists) or title
        offers.sort((a, b) => {
            if (a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
            return a.title.localeCompare(b.title);
        });
        callback(offers);
      });
    },
    add: async (offer: ConciergeOffer) => {
      ensureDb();
      const { id, ...data } = offer;
      await db.collection(COLLECTIONS.CONCIERGE_OFFERS).add(cleanData(data));
    },
    update: async (offer: ConciergeOffer) => {
      ensureDb();
      const { id, ...data } = offer;
      await db.collection(COLLECTIONS.CONCIERGE_OFFERS).doc(offer.id).update(cleanData(data));
    },
    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.CONCIERGE_OFFERS).doc(id).delete();
    }
  },

  // --- SUPPLIERS ---
  suppliers: {
    subscribe: (callback: (suppliers: Supplier[]) => void) => {
      if (!db) return () => {};
      return db.collection(COLLECTIONS.SUPPLIERS).onSnapshot((snapshot) => {
        const suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
        suppliers.sort((a, b) => a.name.localeCompare(b.name));
        callback(suppliers);
      });
    },
    add: async (supplier: Supplier) => {
      ensureDb();
      const { id, ...data } = supplier;
      await db.collection(COLLECTIONS.SUPPLIERS).add(cleanData(data));
    },
    update: async (supplier: Supplier) => {
      ensureDb();
      const { id, ...data } = supplier;
      await db.collection(COLLECTIONS.SUPPLIERS).doc(supplier.id).update(cleanData(data));
    },
    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.SUPPLIERS).doc(id).delete();
    }
  },

  // --- FEEDBACKS ---
  feedbacks: {
     subscribe: (callback: (feedbacks: GuestFeedback[]) => void) => {
        if (!db) return () => {};
        const q = db.collection(COLLECTIONS.FEEDBACKS);
        return q.onSnapshot((snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuestFeedback));
            items.sort((a, b) => b.createdAt - a.createdAt);
            callback(items);
        });
     },
     add: async (feedback: GuestFeedback) => {
        ensureDb();
        const { id, ...data } = feedback;
        await db.collection(COLLECTIONS.FEEDBACKS).add(cleanData(data));
     }
  },

  // --- GUEST NOTES ---
  guestNotes: {
    get: async (guestKey: string): Promise<GuestNote | null> => {
      ensureDb();
      const docRef = db.collection(COLLECTIONS.GUEST_NOTES).doc(sanitizeDocId(guestKey));
      const doc = await docRef.get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as GuestNote;
      }
      return null;
    },

    set: async (guestNote: Omit<GuestNote, 'id'>): Promise<void> => {
      ensureDb();
      const { guestKey, ...data } = guestNote;
      const docId = sanitizeDocId(guestKey);
      await db.collection(COLLECTIONS.GUEST_NOTES).doc(docId).set(cleanData({
        guestKey,
        ...data
      }), { merge: true });
    }
  },

  // --- GUEST CONTACT DATA (Task 6) ---
  guestContactData: {
    get: async (guestKey: string): Promise<GuestContactData | null> => {
      ensureDb();
      const docRef = db.collection(COLLECTIONS.GUEST_CONTACT_DATA).doc(sanitizeDocId(guestKey));
      const doc = await docRef.get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as GuestContactData;
      }
      return null;
    },

    set: async (contactData: Omit<GuestContactData, 'id'>): Promise<void> => {
      ensureDb();
      const { guestKey, ...data } = contactData;
      const docId = sanitizeDocId(guestKey);
      await db.collection(COLLECTIONS.GUEST_CONTACT_DATA).doc(docId).set(cleanData({
        guestKey,
        ...data
      }), { merge: true });
    }
  },

  // --- RESERVATION OVERRIDES ---
  reservationOverrides: {
    /**
     * ⚠️ FUNÇÃO DE LIMPEZA - USA COM CUIDADO!
     * Deleta TODOS os overrides de reservas do Firestore
     */
    clearAll: async (): Promise<number> => {
      ensureDb();
      console.log('[Storage] 🗑️  Iniciando limpeza de reservation_overrides...');

      const snapshot = await db.collection(COLLECTIONS.RESERVATION_OVERRIDES).get();
      const count = snapshot.size;

      console.log(`[Storage] 📊 Encontrados ${count} documentos para deletar`);

      if (count === 0) {
        console.log('[Storage] ✅ Nenhum documento encontrado. Coleção já está limpa!');
        return 0;
      }

      // Deletar em batch
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`[Storage] ✅ Limpeza concluída! ${count} documento(s) deletado(s)`);
      return count;
    },

    get: async (reservationId: string): Promise<ReservationOverrides | null> => {
      ensureDb();
      const docRef = db.collection(COLLECTIONS.RESERVATION_OVERRIDES).doc(sanitizeDocId(reservationId));
      const doc = await docRef.get();

      console.log('[Storage] Buscando override:', {
        CHAVE_BUSCADA: reservationId,
        exists: doc.exists
      });

      if (doc.exists) {
        const override = { id: doc.id, ...doc.data() } as ReservationOverrides;
        return override;
      }
      return null;
    },

    /**
     * Busca múltiplos overrides em lote
     * @param reservationKeys - Array de chaves de overrides (já sanitizadas com getReservationOverrideKey)
     * @returns Map<reservationKey, ReservationOverrides>
     */
    getMultiple: async (reservationKeys: string[]): Promise<Map<string, ReservationOverrides>> => {
      ensureDb();
      const result = new Map<string, ReservationOverrides>();

      if (reservationKeys.length === 0) {
        return result;
      }

      // Buscar cada documento individualmente em paralelo
      const docPromises = reservationKeys.map(key =>
        db.collection(COLLECTIONS.RESERVATION_OVERRIDES).doc(sanitizeDocId(key)).get()
      );
      const docs = await Promise.all(docPromises);

      docs.forEach((doc, index) => {
        if (doc.exists) {
          const override = { id: doc.id, ...doc.data() } as ReservationOverrides;
          result.set(reservationKeys[index], override);
        }
      });

      console.log('[Storage] getMultiple concluído:', result.size, 'overrides encontrados de', reservationKeys.length, 'solicitados');

      return result;
    },

    set: async (overrides: Omit<ReservationOverrides, 'id'>): Promise<void> => {
      ensureDb();
      // Usar getReservationOverrideKey para garantir consistência
      const reservationForKey = {
        id: overrides.reservationId,
        externalId: overrides.externalId,
        source: overrides.source
      };
      const docId = getReservationOverrideKey(reservationForKey);

      console.log('[Storage] Salvando override:', {
        INPUT_reservationId: overrides.reservationId,
        INPUT_externalId: overrides.externalId,
        INPUT_source: overrides.source,
        CHAVE_CALCULADA: docId,
        propertyCode: overrides.propertyCode,
        docsSent: overrides.docsSent,
        docsSentToBuilding: overrides.docsSentToBuilding,
        hasChildren: overrides.hasChildren,
        maintenanceSeenAt: overrides.maintenanceSeenAt
      });

      await db.collection(COLLECTIONS.RESERVATION_OVERRIDES).doc(docId).set(cleanData({
        ...overrides
      }), { merge: true });

      console.log('[Storage] Override salvo com sucesso no Firestore, docId:', docId);
    }
  },

  // --- INVENTORY ---
  inventory: {
    subscribe: (callback: (items: InventoryItem[]) => void) => {
      if (!db) return () => {};
      return db.collection(COLLECTIONS.INVENTORY_ITEMS).onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
        items.sort((a, b) => a.name.localeCompare(b.name));
        callback(items);
      });
    },
    add: async (item: InventoryItem) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.INVENTORY_ITEMS).add(cleanData(data));
    },
    update: async (item: InventoryItem) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.INVENTORY_ITEMS).doc(item.id).update(cleanData(data));
    },
    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.INVENTORY_ITEMS).doc(id).delete();
    }
  },

  inventoryTransactions: {
    subscribe: (callback: (txs: InventoryTransaction[]) => void) => {
      if (!db) return () => {};
      const q = db.collection(COLLECTIONS.INVENTORY_TRANSACTIONS);
      return q.onSnapshot((snapshot) => {
        const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryTransaction));
        txs.sort((a, b) => b.timestamp - a.timestamp);
        callback(txs);
      });
    },
    add: async (tx: InventoryTransaction) => {
      ensureDb();
      const { id, ...data } = tx;
      await db.collection(COLLECTIONS.INVENTORY_TRANSACTIONS).add(cleanData(data));
    }
  },

  // --- OFFICE MODULE SERVICES ---
  
  officeDeliveries: {
    subscribe: (callback: (items: Delivery[]) => void) => {
      if (!db) return () => {};
      return db.collection(COLLECTIONS.OFFICE_DELIVERIES).onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
        items.sort((a, b) => b.createdAt - a.createdAt);
        callback(items);
      });
    },
    add: async (item: Delivery) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.OFFICE_DELIVERIES).add(cleanData(data));
    },
    update: async (item: Delivery) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.OFFICE_DELIVERIES).doc(item.id).update(cleanData(data));
    },
    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.OFFICE_DELIVERIES).doc(id).delete();
    }
  },

  officeSupplies: {
    subscribe: (callback: (items: OfficeSupply[]) => void) => {
      if (!db) return () => {};
      return db.collection(COLLECTIONS.OFFICE_SUPPLIES).onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfficeSupply));
        items.sort((a, b) => a.name.localeCompare(b.name));
        callback(items);
      });
    },
    add: async (item: OfficeSupply) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.OFFICE_SUPPLIES).add(cleanData(data));
    },
    update: async (item: OfficeSupply) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.OFFICE_SUPPLIES).doc(item.id).update(cleanData(data));
    },
    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.OFFICE_SUPPLIES).doc(id).delete();
    }
  },

  officeAssets: {
    subscribe: (callback: (items: CompanyAsset[]) => void) => {
      if (!db) return () => {};
      return db.collection(COLLECTIONS.OFFICE_ASSETS).onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompanyAsset));
        items.sort((a, b) => a.name.localeCompare(b.name));
        callback(items);
      });
    },
    add: async (item: CompanyAsset) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.OFFICE_ASSETS).add(cleanData(data));
    },
    update: async (item: CompanyAsset) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.OFFICE_ASSETS).doc(item.id).update(cleanData(data));
    },
    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.OFFICE_ASSETS).doc(id).delete();
    }
  },

  officeShifts: {
    subscribe: (callback: (items: WorkShift[]) => void) => {
      if (!db) return () => {};
      return db.collection(COLLECTIONS.OFFICE_SHIFTS).onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkShift));
        items.sort((a, b) => a.date.localeCompare(b.date)); // Oldest first (timeline)
        callback(items);
      });
    },
    add: async (item: WorkShift) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.OFFICE_SHIFTS).add(cleanData(data));
    },
    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.OFFICE_SHIFTS).doc(id).delete();
    }
  },

  // --- BOARDS MODULE ---
  boards: {
    subscribe: (callback: (boards: Board[]) => void) => {
      if (!db) return () => {};
      return db.collection(COLLECTIONS.BOARDS).onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Board));
        items.sort((a, b) => b.updatedAt - a.updatedAt);
        callback(items);
      });
    },
    add: async (item: Board) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.BOARDS).add(cleanData(data));
    },
    update: async (item: Board) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.BOARDS).doc(item.id).update(cleanData(data));
    },
    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.BOARDS).doc(id).delete();
      // NOTE: In a real backend, we'd delete sub-data. Here we rely on cascade or separate cleanup
    }
  },

  boardColumns: {
    subscribe: (callback: (columns: BoardColumn[]) => void) => {
      if (!db) return () => {};
      return db.collection(COLLECTIONS.BOARD_COLUMNS).onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BoardColumn));
        items.sort((a, b) => a.order - b.order);
        callback(items);
      });
    },
    add: async (item: BoardColumn) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.BOARD_COLUMNS).add(cleanData(data));
    },
    update: async (item: BoardColumn) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.BOARD_COLUMNS).doc(item.id).update(cleanData(data));
    },
    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.BOARD_COLUMNS).doc(id).delete();
    }
  },

  boardCards: {
    subscribe: (callback: (cards: BoardCard[]) => void) => {
      if (!db) return () => {};
      return db.collection(COLLECTIONS.BOARD_CARDS).onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BoardCard));
        items.sort((a, b) => a.order - b.order);
        callback(items);
      });
    },
    add: async (item: BoardCard) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.BOARD_CARDS).add(cleanData(data));
    },
    update: async (item: BoardCard) => {
      ensureDb();
      const { id, ...data } = item;
      await db.collection(COLLECTIONS.BOARD_CARDS).doc(item.id).update(cleanData(data));
    },
    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.BOARD_CARDS).doc(id).delete();
    }
  },

  // --- COMMUNICATION (CHAT & VOIP) ---
  communication: {
    // Send Chat Message
    sendMessage: async (msg: ChatMessage) => {
        ensureDb();
        const { id, ...data } = msg;
        await db.collection(COLLECTIONS.MESSAGES).add(cleanData(data));
    },
    
    // Subscribe to messages for a specific property
    subscribeMessages: (propertyCode: string, callback: (msgs: ChatMessage[]) => void) => {
        if (!db) return () => {};
        return db.collection(COLLECTIONS.MESSAGES)
            .where('propertyCode', '==', propertyCode)
            .onSnapshot((snapshot) => {
                const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
                msgs.sort((a, b) => a.timestamp - b.timestamp);
                callback(msgs);
            });
    },

    // Subscribe to ALL messages (for Staff) - ordered by most recent
    subscribeAllMessages: (callback: (msgs: ChatMessage[]) => void) => {
        if (!db) return () => {};
        // Note: Firestore requires composite index for 'timestamp' desc if filtering.
        // Increased limit for Admin Inbox
        return db.collection(COLLECTIONS.MESSAGES)
            .orderBy('timestamp', 'desc')
            .limit(500)
            .onSnapshot((snapshot) => {
                const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
                callback(msgs);
            });
    },

    // Mark message as read
    markAsRead: async (msgId: string) => {
        ensureDb();
        await db.collection(COLLECTIONS.MESSAGES).doc(msgId).update({ read: true });
    },

    // VoIP Signaling: Start Call (Create Session)
    startCall: async (session: CallSession) => {
        ensureDb();
        const { id, ...data } = session;
        // Use sanitized propertyCode as ID to enforce one call per property at a time
        const docId = sanitizeDocId(session.propertyCode);
        await db.collection(COLLECTIONS.CALLS).doc(docId).set(cleanData(data));
    },

    // VoIP Signaling: Update Session (e.g., Answer, Candidates, End)
    updateCall: async (propertyCode: string, updates: Partial<CallSession>) => {
        ensureDb();
        const docId = sanitizeDocId(propertyCode);
        await db.collection(COLLECTIONS.CALLS).doc(docId).update(cleanData(updates));
    },

    // Subscribe to call session for a property
    subscribeCall: (propertyCode: string, callback: (session: CallSession | null) => void) => {
        if (!db) return () => {};
        const docId = sanitizeDocId(propertyCode);
        return db.collection(COLLECTIONS.CALLS).doc(docId).onSnapshot((doc) => {
            if (doc.exists) {
                callback({ id: doc.id, ...doc.data() } as CallSession);
            } else {
                callback(null);
            }
        });
    },

    // Subscribe to ALL calls (for Staff dashboard)
    subscribeAllCalls: (callback: (sessions: CallSession[]) => void) => {
        if (!db) return () => {};
        return db.collection(COLLECTIONS.CALLS)
            .where('status', '==', 'ringing')
            .onSnapshot((snapshot) => {
                const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallSession));
                callback(sessions);
            }, (error) => {
                console.error("Erro ao buscar chamadas:", error);
                // Return empty array on error to prevent app crash
                callback([]);
            });
    }
  },

  // --- USERS ---
  users: {
    subscribe: (callback: (users: UserWithPassword[]) => void) => {
      if (!db) return () => {};

      return db.collection(COLLECTIONS.USERS).onSnapshot((snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserWithPassword));
        if (users.length === 0) {
           MOCK_USERS.forEach(async u => {
              const { id, ...data } = u;
              await db.collection(COLLECTIONS.USERS).add(cleanData(data));
           });
        } else {
          callback(users);
        }
      });
    },

    /**
     * Busca usuário por email normalizado
     */
    getByEmail: async (email: string): Promise<UserWithPassword | null> => {
      ensureDb();
      const normalizedEmail = email.toLowerCase().trim();
      const snapshot = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as UserWithPassword;
    },

    /**
     * Adiciona ou atualiza usuário (upsert por email)
     * Previne duplicados ao verificar se o email já existe
     */
    addOrUpdate: async (user: UserWithPassword): Promise<void> => {
      ensureDb();
      const normalizedEmail = user.email.toLowerCase().trim();
      const existing = await storageService.users.getByEmail(normalizedEmail);
      
      if (existing) {
        // Atualiza usuário existente (merge)
        const { id, ...data } = user;
        await db.collection(COLLECTIONS.USERS).doc(existing.id).update(cleanData({
          ...data,
          email: normalizedEmail
        }));
      } else {
        // Cria novo usuário
        const { id, ...data } = user;
        await db.collection(COLLECTIONS.USERS).add(cleanData({
          ...data,
          email: normalizedEmail
        }));
      }
    },

    add: async (user: UserWithPassword) => {
      ensureDb();
      const { id, ...data } = user;
      const normalizedEmail = data.email.toLowerCase().trim();
      await db.collection(COLLECTIONS.USERS).add(cleanData({
        ...data,
        email: normalizedEmail
      }));
    },

    update: async (user: Partial<UserWithPassword> & { id: string }) => {
      ensureDb();
      const { id, ...data } = user;
      if (data.email) {
        data.email = data.email.toLowerCase().trim();
      }
      await db.collection(COLLECTIONS.USERS).doc(id).update(cleanData(data));
    },

    delete: async (id: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.USERS).doc(id).delete();
    },

    /**
     * Remove usuários duplicados mantendo apenas 1 por email
     * Retorna número de duplicados removidos
     */
    deduplicateByEmail: async (): Promise<{ removed: number; kept: number; details: Array<{ email: string; duplicates: number }> }> => {
      ensureDb();
      
      // Busca todos os usuários
      const snapshot = await db.collection(COLLECTIONS.USERS).get();
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserWithPassword));
      
      // Agrupa por email normalizado
      const emailGroups = new Map<string, UserWithPassword[]>();
      users.forEach(user => {
        const normalizedEmail = user.email.toLowerCase().trim();
        const group = emailGroups.get(normalizedEmail) || [];
        group.push(user);
        emailGroups.set(normalizedEmail, group);
      });
      
      let removedCount = 0;
      const details: Array<{ email: string; duplicates: number }> = [];
      
      // Para cada grupo com duplicados
      for (const [email, group] of emailGroups.entries()) {
        if (group.length <= 1) continue; // Sem duplicados
        
        details.push({ email, duplicates: group.length - 1 });
        
        // Escolhe o canônico (prioridade: Admin > mais antigo/primeiro)
        group.sort((a, b) => {
          // 1. Admin tem prioridade
          if (a.role === 'Admin' && b.role !== 'Admin') return -1;
          if (b.role === 'Admin' && a.role !== 'Admin') return 1;
          // 2. Manter o primeiro documento (por ID)
          return a.id.localeCompare(b.id);
        });
        
        const canonical = group[0];
        const duplicates = group.slice(1);
        
        // Merge permissões (união de todos os módulos)
        const allModules = new Set<AppModule>();
        group.forEach(u => {
          u.allowedModules?.forEach(m => allModules.add(m));
        });
        
        // Atualiza o canônico com a união de permissões
        if (allModules.size > 0) {
          await db.collection(COLLECTIONS.USERS).doc(canonical.id).update({
            allowedModules: Array.from(allModules)
          });
        }
        
        // Deleta duplicados
        for (const dup of duplicates) {
          await db.collection(COLLECTIONS.USERS).doc(dup.id).delete();
          removedCount++;
        }
      }
      
      return {
        removed: removedCount,
        kept: emailGroups.size,
        details
      };
    }
  },

  // --- PROPERTIES ---
  properties: {
    subscribe: (callback: (properties: Property[]) => void) => {
      if (!db) return () => {};

      return db.collection(COLLECTIONS.PROPERTIES).onSnapshot((snapshot) => {
        const properties = snapshot.docs.map(doc => doc.data() as Property);
        
        if (properties.length === 0) {
          MOCK_PROPERTIES.forEach(async p => {
            await db.collection(COLLECTIONS.PROPERTIES).doc(p.code).set(cleanData(p));
          });
        } else {
          properties.sort((a, b) => a.code.localeCompare(b.code));
          callback(properties);
        }
      });
    },

    add: async (property: Property) => {
      ensureDb();
      await db.collection(COLLECTIONS.PROPERTIES).doc(property.code).set(cleanData(property));
    },

    delete: async (code: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.PROPERTIES).doc(code).delete();
    }
  },

  // --- LOGS ---
  logs: {
    subscribe: (callback: (logs: LogEntry[]) => void) => {
        if (!db) return () => {};
        const q = db.collection(COLLECTIONS.LOGS);
        return q.onSnapshot((snapshot) => {
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogEntry));
            logs.sort((a, b) => b.timestamp - a.timestamp);
            callback(logs);
        });
    },
    add: async (log: LogEntry) => {
        ensureDb();
        const { id, ...data } = log;
        await db.collection(COLLECTIONS.LOGS).add(cleanData(data));
    }
  },

  // --- SETTINGS ---
  settings: {
    subscribe: (callback: (data: { priorities: string[], serviceTypes: (string | ServiceTypeDefinition)[], afterHours?: AfterHoursConfig }) => void) => {
      if (!db) return () => {};

      return db.collection(COLLECTIONS.SETTINGS).doc('config').onSnapshot((docSnap) => {
         if (docSnap.exists) {
           callback(docSnap.data() as { priorities: string[], serviceTypes: (string | ServiceTypeDefinition)[], afterHours?: AfterHoursConfig });
         } else {
           const defaults = {
              priorities: PRIORITIES,
              serviceTypes: SERVICE_TYPES,
              afterHours: {
                  enabled: false,
                  message: 'Nosso horário de atendimento é limitado.',
                  rules: [
                      { id: '1', days: [1,2,3,4,5], start: '20:00', end: '08:00' }, // Mon-Fri
                      { id: '2', days: [6], start: '15:00', end: '23:59' }, // Sat
                      { id: '3', days: [0], start: '14:00', end: '23:59' }  // Sun
                  ]
              }
           };
           db.collection(COLLECTIONS.SETTINGS).doc('config').set(cleanData(defaults));
           callback(defaults);
         }
      });
    },

    update: async (data: { priorities?: string[], serviceTypes?: (string | ServiceTypeDefinition)[], afterHours?: AfterHoursConfig }) => {
       ensureDb();
       await db.collection(COLLECTIONS.SETTINGS).doc('config').set(cleanData(data), { merge: true });
    }
  },

  // --- FILE STORAGE (Firebase Storage) ---
  fileStorage: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5 MB

    ALLOWED_TYPES: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv'
    ],

    getFileType: (mimeType: string): BoardCardAttachment['type'] => {
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType === 'application/pdf' || mimeType.includes('word')) return 'document';
      if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'spreadsheet';
      return 'other';
    },

    validateFile: (file: File): { valid: boolean; error?: string } => {
      const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
      const ALLOWED = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'text/csv'
      ];

      if (file.size > MAX_SIZE) {
        return { valid: false, error: `Arquivo muito grande. Máximo: 5MB (atual: ${(file.size / 1024 / 1024).toFixed(1)}MB)` };
      }

      if (!ALLOWED.includes(file.type)) {
        return { valid: false, error: `Tipo de arquivo não permitido: ${file.type}` };
      }

      return { valid: true };
    },

    upload: async (file: File, boardId: string, cardId: string, userId: string): Promise<BoardCardAttachment> => {
      if (!storage) throw new Error('Firebase Storage não inicializado');

      // Validate file
      const validation = storageService.fileStorage.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `boards/${boardId}/cards/${cardId}/${timestamp}_${safeName}`;

      // Upload to Firebase Storage
      const ref = storage.ref(path);
      const snapshot = await ref.put(file);
      const url = await snapshot.ref.getDownloadURL();

      // Create attachment object
      const attachment: BoardCardAttachment = {
        id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: storageService.fileStorage.getFileType(file.type),
        mimeType: file.type,
        size: file.size,
        url,
        uploadedAt: timestamp,
        uploadedBy: userId
      };

      return attachment;
    },

    delete: async (url: string): Promise<void> => {
      if (!storage) throw new Error('Firebase Storage não inicializado');

      try {
        const ref = storage.refFromURL(url);
        await ref.delete();
      } catch (error) {
        console.error('Erro ao deletar arquivo:', error);
        // Don't throw - file might already be deleted or URL invalid
      }
    }
  },

  // --- MAINTENANCE OVERRIDES ---
  maintenanceOverrides: {
    subscribe: (callback: (overrides: Record<string, { hidden: boolean; updatedAt: number }>) => void) => {
      if (!db) return () => {};

      const q = db.collection(COLLECTIONS.MAINTENANCE_OVERRIDES);
      return q.onSnapshot((snapshot) => {
        const overrides: Record<string, { hidden: boolean; updatedAt: number }> = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          overrides[doc.id] = {
            hidden: data.hidden || false,
            updatedAt: data.updatedAt || Date.now()
          };
        });
        callback(overrides);
      }, (error) => {
        console.error("Erro ao buscar maintenance overrides:", error);
      });
    },

    hide: async (key: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.MAINTENANCE_OVERRIDES).doc(key).set({
        hidden: true,
        updatedAt: Date.now(),
        reason: 'dismissed_by_user'
      });
    },

    unhide: async (key: string) => {
      ensureDb();
      await db.collection(COLLECTIONS.MAINTENANCE_OVERRIDES).doc(key).delete();
    },

    isHidden: async (key: string): Promise<boolean> => {
      ensureDb();
      const doc = await db.collection(COLLECTIONS.MAINTENANCE_OVERRIDES).doc(key).get();
      return doc.exists && doc.data()?.hidden === true;
    }
  }
};

// Expor storageService globalmente para uso em componentes
if (typeof window !== 'undefined') {
  (window as any).storageService = storageService;
}