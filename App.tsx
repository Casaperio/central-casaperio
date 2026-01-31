import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import {
  Ticket, User, UserWithPassword, TicketStatus, Property,
  Reservation, ReservationStatus, GuestTip, GuestFeedback, MonitoredFlight,
  AppModule, ViewMode, LogEntry, Expense, InventoryItem, InventoryTransaction,
  Delivery, OfficeSupply, CompanyAsset, WorkShift, TicketCategory, ConciergeOffer, Supplier, ServiceTypeDefinition, ServiceType,
  Board, BoardColumn, BoardCard, AfterHoursConfig, CallSession
} from './types';
import { storageService } from './services/storage';
import { checkFlightStatus } from './services/geminiService';
import { auth, initializeFirebase } from './services/firebase';
import { checkoutAutomationService } from './services/checkoutAutomationService';
import { generateId, formatCurrency, formatDatePtBR } from './utils';
import { useStaysData } from './hooks/useStaysData';
import { useInventoryData } from './hooks/useInventoryData';
import { usePropertiesData } from './hooks/usePropertiesData';
import { triggerSync, getSyncStatus, getAllData } from './services/staysApiService';
import { CONCIERGE_SERVICE_TYPES } from './constants';
import PlatformIcon from './components/PlatformIcon';
import { playSuccessSound } from './utils/soundUtils';
import { canAccessView, canAccessModule, getFirstAllowedModule, getDefaultViewForModule as getDefaultViewFromPermissions, getAccessDeniedMessage } from './utils/permissions';
import { getDefaultPeriodForRoute } from './utils/performanceUtils';
import { useQueryClient } from '@tanstack/react-query';

// Icons
import {
  Plus, Search, Bell, Menu, LogOut, Filter, Wrench, LayoutGrid,
  List as ListIcon, Calendar as CalendarIcon, Settings, User as UserIcon,
  Shield, PieChart, BookOpen, MessageSquare, Plane, ScrollText,
  FileText, LogIn, LogOut as LogOutIcon, Home, ExternalLink, ChevronRight, Loader2,
  ChevronLeft, Eye, EyeOff, BedDouble, DollarSign, FileWarning, AlertTriangle, AlertCircle, FileX,
  Clock, ArrowRight, Languages, CheckCircle2, Users, Box, Briefcase, Map as MapIcon, Columns,
  CalendarClock, CalendarRange, Building2, Star, History, Grid, X, Globe, RefreshCw, UserCircle, UserCheck, ChevronDown, Moon, Gem, Tag, Target,
  Kanban, Smartphone, Phone, Mic, MicOff, PhoneCall, Inbox, Trash2, Check
} from 'lucide-react';

// Layout Components
import AppSidebar from './components/layout/AppSidebar';
import NotificationCenter from './components/layout/NotificationCenter';
import AppHeader from './components/layout/AppHeader';

// Modal Components
import TicketModals from './components/modals/TicketModals';
import ReservationModals from './components/modals/ReservationModals';

// Hooks
import { useNotifications } from './hooks/app/useNotifications';
import { useDataSubscriptions } from './hooks/app/useDataSubscriptions';
import { useNewReservationDetector } from './hooks/features/useNewReservationDetectorV2';
import { useNewMaintenanceTicketDetector } from './hooks/features/useNewMaintenanceTicketDetectorV2';
import { useTicketNotifications } from './hooks/features/useTicketNotifications';
import { useWebRTCCall } from './hooks/features/useWebRTCCall';
import { useMaintenanceFilters, PeriodPreset } from './hooks/features/useMaintenanceFilters';
import { useMaintenancePagination } from './hooks/features/useMaintenancePagination';
import { notificationSessionManager } from './services/notificationSessionManager';
import { 
  setNotificationCenterCallback,
  notifyReservationToast,
  notifyReservationsToastMany,
  notifyMaintenanceTicketToast,
  notifyMaintenanceTicketsToastMany,
  ToastNotification 
} from './utils/notificationToastHelpers';
import { ToastContainer } from './components/Toast';

// Context Providers
import { AppProviders } from './contexts/AppProviders';
import { useAuth } from './contexts/AuthContext';
import { useNavigation } from './contexts/NavigationContext';

// Components
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import { LoadingScreens } from './components/screens/LoadingScreens';
import { ModuleRouter } from './components/routing/ModuleRouter';
import TicketForm from './components/TicketForm';
import TicketDetailModal from './components/TicketDetailModal';
import { StatsDashboard } from './components/StatsDashboard';
import AdminPanel from './components/AdminPanel';
import SettingsPanel from './components/SettingsPanel';
import { SkeletonCard, SkeletonList, SkeletonAgenda, SkeletonTable } from './components/SkeletonLoading';
import ReservationForm from './components/ReservationForm';
import ReservationDetailModal from './components/ReservationDetailModal';
import GuestCMS from './components/GuestCMS';
import TabletApp from './components/TabletApp';
import FeedbackPanel from './components/FeedbackPanel';
import FlightsPanel from './components/FlightsPanel';
import LogsPanel from './components/LogsPanel';
import ReportsPanel from './components/ReportsPanel';
import ProfilePanel from './components/ProfilePanel';
import CalendarView from './components/CalendarView';
import InventoryPanel from './components/InventoryPanel';
import OfficePanel from './components/OfficePanel';
import PropertiesTool from './components/PropertiesTool';
import FinancialPanel from './components/FinancialPanel';
import ConciergeCMS from './components/ConciergeCMS';
import MapPanel from './components/MapPanel';
import { MaintenanceView } from './components/views/MaintenanceView';
import { GuestView } from './components/views/GuestView';
import { StaffCallModal } from './components/modals/StaffCallModal';

// Lazy loaded components
const GeneralCalendar = lazy(() => import('./components/GeneralCalendar'));
const GuestCRM = lazy(() => import('./components/GuestCRM'));
import BoardList from './components/BoardList';
import BoardDetail from './components/BoardDetail';
import FieldApp from './components/FieldApp';
import InboxPanel from './components/InboxPanel';

/**
 * Formats a Date object to YYYY-MM-DD string for API calls
 */
function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// AppContent - Main app logic wrapped in contexts
function AppContent() {
  // Context hooks
  const {
    currentUser,
    isDbConnected,
    kioskMode,
    login: handleLogin,
    logout: handleLogout,
    activateTablet,
    getPrimaryModuleForRole,
    getDefaultViewForModule
  } = useAuth();
  const { activeModule, viewMode, setActiveModule, setViewMode } = useNavigation();

  // Auto-navigate when user is authenticated but still on landing
  useEffect(() => {
    if (currentUser && viewMode === 'landing') {
      const primaryModule = getPrimaryModuleForRole(currentUser.role);
      setActiveModule(primaryModule);
      setViewMode(getDefaultViewForModule(primaryModule));
    }
  }, [currentUser, viewMode, getPrimaryModuleForRole, getDefaultViewForModule, setActiveModule, setViewMode]);

  // GUARD: Check permissions and redirect if user doesn't have access
  useEffect(() => {
    if (!currentUser) return;
    if (viewMode === 'landing') return; // Landing page is accessible to all

    // Check if user can access current view (pass activeModule for context)
    const hasViewAccess = canAccessView(currentUser, viewMode, activeModule);

    // Check if user can access current module
    const hasModuleAccess = activeModule ? canAccessModule(currentUser, activeModule) : true;

    // If user doesn't have access to either view or module, redirect
    if (!hasViewAccess || !hasModuleAccess) {
      console.warn(`[ACL Guard] Access denied to viewMode="${viewMode}" or module="${activeModule}"`);
      console.warn(`[ACL Guard] User permissions:`, currentUser.allowedModules);
      console.warn(`[ACL Guard] hasViewAccess=${hasViewAccess}, hasModuleAccess=${hasModuleAccess}`);

      // Get first allowed module and redirect there
      const allowedModule = getFirstAllowedModule(currentUser);
      if (allowedModule) {
        const allowedView = getDefaultViewFromPermissions(allowedModule);
        console.log(`[ACL Guard] Redirecting to allowed module="${allowedModule}" view="${allowedView}"`);
        setActiveModule(allowedModule);
        setViewMode(allowedView);
      } else {
        // No modules allowed, redirect to profile (always accessible)
        console.error('[ACL Guard] User has no allowed modules, redirecting to profile');
        setViewMode('profile');
      }
    }
  }, [currentUser, viewMode, activeModule, setActiveModule, setViewMode]);

  // Extract kioskProperty from kioskMode for backward compatibility
  const kioskProperty = kioskMode.propertyCode;

  // Data Subscriptions Hook (Firebase real-time data)
  const {
    tickets,
    reservations,
    users,
    properties: _unusedFirebaseProperties,
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
  } = useDataSubscriptions(isDbConnected, kioskProperty);

  // (Celebration Popup removido - usando apenas toast + sininho)

  // Properties Data (from stays-api MongoDB) - ÚNICA FONTE DE PROPRIEDADES
  const {
    properties: propertiesFromMongoDB,
    isLoading: isLoadingProperties,
    error: propertiesError,
    syncProperties,
    updatePropertyInState,
  } = usePropertiesData();

  // Adapter: Convert PropertyCharacteristics to old Property format for components not yet migrated
  const properties: Property[] = React.useMemo(() => {
    return propertiesFromMongoDB.map(p => ({
      code: p.internalName,
      address: p.address,
      zipCode: p.location?.postalCode,
      lat: p.location?.latitude,
      lng: p.location?.longitude,
      wifiNetwork: p.manualOverrides.wifi.network || undefined,
      wifiPassword: p.manualOverrides.wifi.password || undefined,
      doorCode: p.manualOverrides.access.doorCode || undefined,
      conciergeHours: p.manualOverrides.access.conciergeHours || undefined,
      sizeM2: p.basicInfo.squareFeet || undefined,
      cleaningFee: p.manualOverrides.specifications.cleaningFee || undefined,
      position: p.manualOverrides.specifications.position || undefined,
      viewType: p.manualOverrides.specifications.viewType || undefined,
      hasAntiNoiseWindow: p.manualOverrides.specifications.hasAntiNoiseWindow || undefined,
      bathrooms: p.basicInfo.bathrooms,
      maxGuests: p.basicInfo.maxGuests,
      staysListingId: p.staysListingId,
      bedroomCount: p.basicInfo.rooms,
      bedCount: p.basicInfo.beds,
    }));
  }, [propertiesFromMongoDB]);

  // Inventory Data (from stays-api)
  const {
    items: inventoryItems,
    transactions: inventoryTransactions,
    createItem: createInventoryItem,
    updateItem: updateInventoryItem,
    deleteItem: deleteInventoryItem,
    createTransaction: createInventoryTransaction,
  } = useInventoryData();

  // Local UI State
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  // Incoming Calls State
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Notifications Hook
  const {
    notifications,
    showNotifications,
    addNotification,
    markAllRead,
    clearNotifications,
    toggleNotifications,
  } = useNotifications();

  // WebRTC Call Hook
  const {
    staffPeerConnection,
    staffLocalStream,
    staffRemoteAudio,
    handleAnswerCall,
    handleRejectCall,
    handleEndCall,
    toggleStaffMute,
  } = useWebRTCCall(currentUser);

  // UI State
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketFormMode, setTicketFormMode] = useState<'corrective' | 'preventive'>('corrective');
  const [ticketPreFill, setTicketPreFill] = useState<{ propertyCode?: string, description?: string, reservationId?: string } | undefined>(undefined);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile state

  // Calendar UI State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Visual Filters
  const [gridColumns, setGridColumns] = useState<number>(3);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterReservationType, setFilterReservationType] = useState<'all' | 'checkin' | 'checkout' | 'inhouse'>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  
  // Maintenance Specific Filters
  const [filterMaintenanceAssignee, setFilterMaintenanceAssignee] = useState<string[]>([]);
  const [filterMaintenanceProperty, setFilterMaintenanceProperty] = useState<string>('all');
  const [filterMaintenanceType, setFilterMaintenanceType] = useState<string[]>([]);
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState<'all' | 'in_progress'>('all');

  // Maintenance Period Filter (default: 'all' - sem filtro)
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Guest Period Filter (default: '7days' - próximos 7 dias a partir de hoje)
  const [guestPeriodPreset, setGuestPeriodPreset] = useState<PeriodPreset>('7days');
  const [guestCustomStartDate, setGuestCustomStartDate] = useState<string>('');
  const [guestCustomEndDate, setGuestCustomEndDate] = useState<string>('');

  // Guest Status Filter (default: ['ALL'] - todos os status)
  const [guestSelectedStatuses, setGuestSelectedStatuses] = useState<string[]>(['ALL']);

  // 🚀 FASE 1: Períodos dinâmicos por rota/módulo
  // Compute data period based on current module and view
  const staysDataPeriod = useMemo(() => {
    // Determine route identifier for period calculation
    let routeIdentifier: string;
    
    if (viewMode === 'map') {
      // Canvas mode: 6 meses (180 dias) a partir de hoje
      routeIdentifier = 'canvas';
    } else if (activeModule === 'maintenance') {
      // Manutenção: próximos 30 dias
      routeIdentifier = 'maintenance';
    } else if (activeModule === 'guest' || viewMode === 'guest-crm') {
      // Hóspedes: últimos 7 dias até próximos 30 dias
      routeIdentifier = 'guest';
    } else if (activeModule === 'reservations' || viewMode === 'calendar') {
      // Reservas/Calendário: mês atual até +3 meses
      routeIdentifier = 'reservations';
    } else if (activeModule === 'management') {
      // Gestão: últimos 30 dias até próximos 60 dias
      routeIdentifier = 'management';
    } else {
      // Fallback: padrão (-30d até +90d)
      routeIdentifier = 'default';
    }
    
    const period = getDefaultPeriodForRoute(routeIdentifier, viewMode === 'map' ? 'canvas' : 'normal');
    
    // 🔄 Adicionar routeIdentifier para auto-refresh inteligente
    return {
      ...period,
      routeIdentifier,
    };
  }, [activeModule, viewMode]);

  // Stays API Data (from stays-api backend)
  // � AUTO-REFRESH INTELIGENTE:
  // - Períodos otimizados por rota (não carrega 2 anos)
  // - Atualização automática com intervalos por módulo (3-8 min)
  // - Pausa quando aba está oculta (economiza recursos)
  // - Fingerprinting evita reprocessamento quando dados não mudaram
  const {
    agendaGroups: staysAgendaGroups,
    reservations: staysReservations,
    calendarData: staysCalendarData,
    syncStatus: staysSyncStatus,
    loading: staysLoading,
    isFetching: staysRefetching,
    error: staysError,
    refresh: refreshStaysData,
  } = useStaysData(staysDataPeriod);

  // 🚀 PREFETCH INTELIGENTE: pré-carregar próximo módulo provável
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Só fazer prefetch se não estiver carregando e aba estiver visível
    if (staysLoading || staysRefetching || typeof document === 'undefined') return;
    if (document.visibilityState !== 'visible') return;
    
    // Mapa de próximos módulos prováveis
    const nextModuleMap: Record<string, string> = {
      'maintenance': 'guest',      // Manutenção → Guest
      'guest': 'reservations',     // Guest → Reservas
      'reservations': 'management', // Reservas → Management
    };
    
    const nextRoute = nextModuleMap[staysDataPeriod.routeIdentifier];
    if (!nextRoute) return;
    
    const nextPeriod = {
      ...getDefaultPeriodForRoute(nextRoute, 'normal'),
      routeIdentifier: nextRoute,
    };
    
    // Prefetch com delay de 2s após carregamento atual
    const timer = setTimeout(() => {
      console.log(`🚀 [Prefetch] Pré-carregando próximo módulo: ${nextRoute}`);
      
      queryClient.prefetchQuery({
        queryKey: ['stays-all-data', nextPeriod.from, nextPeriod.to, nextPeriod.routeIdentifier],
        queryFn: () => getAllData(nextPeriod.from, nextPeriod.to),
        staleTime: 5 * 60 * 1000, // 5 minutos
      });
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [staysDataPeriod.routeIdentifier, staysLoading, staysRefetching, queryClient]);

  // Combine loading states
  const isGlobalLoading = staysLoading || staysRefetching;

  // Initialize Firebase on app mount
  useEffect(() => {
    initializeFirebase();
  }, []);

  // 🔔 Initialize notification session on mount
  useEffect(() => {
    notificationSessionManager.initialize();
    
    // Connect NotificationCenter callback
    setNotificationCenterCallback(addNotification);
    
    return () => {
      // Cleanup on unmount
    };
  }, [addNotification]);

  // 🔔 Reset notification session on login
  useEffect(() => {
    if (currentUser) {
      // Criar nova sessão ao fazer login
      notificationSessionManager.createNewSession();
      console.log('✨ [App] Nova sessão de notificações criada para:', currentUser.name);
    }
  }, [currentUser?.id]); // Apenas quando usuário mudar

  // Checkout Automation Service - Automatically creates maintenance tickets for checkouts
  useEffect(() => {
    if (isDbConnected) {
      checkoutAutomationService.start();
      return () => {
        checkoutAutomationService.stop();
      };
    }
  }, [isDbConnected]);

  // Note: Data subscriptions now handled by useDataSubscriptions hook

  const addLog = useCallback((action: string, details: string): void => {
    if (!currentUser) return;
    const logEntry: LogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      details
    };
    storageService.logs.add(logEntry);
  }, [currentUser]);

  // 🍞 Toast notifications state
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);

  const handleRemoveToast = useCallback((id: string) => {
    setToastNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleAddToast = useCallback((notification: ToastNotification) => {
    setToastNotifications(prev => [...prev, notification]);
  }, []);

  // 🔔 New Reservation Detector Hook V2 (Feed fixo + sem popup)
  useNewReservationDetector({
    currentUser,
    hasPermission: (perm: string) => canAccessModule(currentUser, perm as any),
    onNewReservations: (newReservations) => {
      const isOnline = navigator.onLine;
      const isVisible = document.visibilityState === 'visible';
      const hasFocus = document.hasFocus();
      const shouldShowToast = isOnline && isVisible && hasFocus;

      // 🔔 SEMPRE adicionar ao NotificationCenter
      newReservations.forEach(reservation => {
        const title = `Nova Reserva - ${reservation.propertyCode}`;
        const message = `${reservation.guestName} • ${new Date(reservation.checkInDate).toLocaleDateString('pt-BR')} → ${new Date(reservation.checkOutDate).toLocaleDateString('pt-BR')}`;
        addNotification(title, message, 'info');
      });

      // 🎨 TOAST + SOM: apenas se online + visível + com foco
      if (shouldShowToast) {
        if (newReservations.length === 1) {
          const toast = notifyReservationToast(newReservations[0]);
          handleAddToast(toast);
        } else {
          const toast = notifyReservationsToastMany(newReservations);
          handleAddToast(toast);
        }
        playSuccessSound();
      } else {
        console.log(`📢 [App] ${newReservations.length} novas reservas registradas no NotificationCenter (toast/som desabilitados: ${!isOnline ? 'offline' : !isVisible ? 'aba oculta' : 'sem foco'})`);
      }
    },
  });

  // 🔧 New Maintenance Ticket Detector Hook V2 (com filtro de checkout automático)
  useNewMaintenanceTicketDetector({
    tickets,
    currentUser,
    hasPermission: (perm: string) => canAccessModule(currentUser, perm as any),
    onNewTickets: (newTickets) => {
      const isOnline = navigator.onLine;
      const isVisible = document.visibilityState === 'visible';
      const hasFocus = document.hasFocus();
      const shouldShowToast = isOnline && isVisible && hasFocus;

      // 🔔 SEMPRE adicionar ao NotificationCenter
      newTickets.forEach(ticket => {
        const title = `Novo Chamado - ${ticket.propertyCode}`;
        const message = `${ticket.description?.substring(0, 80)}${ticket.description && ticket.description.length > 80 ? '...' : ''}`;
        addNotification(title, message, 'warning');
      });

      // 🎨 TOAST + SOM: apenas se online + visível + com foco
      if (shouldShowToast) {
        if (newTickets.length === 1) {
          const toast = notifyMaintenanceTicketToast(newTickets[0]);
          handleAddToast(toast);
        } else {
          const toast = notifyMaintenanceTicketsToastMany(newTickets);
          handleAddToast(toast);
        }
        playSuccessSound();
      } else {
        console.log(`📢 [App] ${newTickets.length} novos tickets registrados no NotificationCenter (toast/som desabilitados: ${!isOnline ? 'offline' : !isVisible ? 'aba oculta' : 'sem foco'})`);
      }
    },
  });

  // Ticket Notifications Hook
  useTicketNotifications({
    tickets,
    currentUser,
    addNotification,
    addLog,
  });

  // ... (Auto-Checkout Logic) ...
  useEffect(() => {
    if (!isDbConnected || reservations.length === 0) return;

    const createCheckoutTickets = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkoutsToday = reservations.filter(res => {
        const checkoutDate = new Date(res.checkOutDate);
        checkoutDate.setHours(0, 0, 0, 0);
        return checkoutDate.getTime() === today.getTime() &&
               res.status !== 'Cancelada';
      });

      for (const reservation of checkoutsToday) {
        const existingTicket = tickets.find(t =>
          t.reservationId === reservation.id &&
          t.isCheckoutTicket === true
        );

        if (!existingTicket) {
          const scheduledDate = new Date(reservation.checkOutDate);
          scheduledDate.setHours(11, 15, 0, 0);

          const propertyName = properties.find(p => p.code === reservation.propertyCode)?.address || '';

          const newTicket: Ticket = {
            id: generateId(),
            propertyCode: reservation.propertyCode,
            propertyName: propertyName,
            priority: 'Média',
            serviceType: ServiceType.CHECKOUT_CLEANING, // Use Enum constant
            description: `Checkout automático - ${reservation.guestName}`,
            desiredDate: scheduledDate.toISOString(),
            scheduledDate: scheduledDate.toISOString(),
            guestAuth: false,
            status: TicketStatus.OPEN,
            assignee: 'Não atribuído',
            createdBy: 'system',
            createdByName: 'Sistema Automático',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            expenses: [],
            reservationId: reservation.id,
            isCheckoutTicket: true,
            category: 'maintenance'
          };

          await storageService.tickets.add(newTicket);
        }
      }
    };

    createCheckoutTickets();
  }, [isDbConnected, reservations, tickets, properties]);

  const handleActivateTablet = (propertyCode: string): void => {
    activateTablet(propertyCode);
  };

  const handleOpenFieldApp = (): void => {
    setActiveModule('field_app');
  };

  // Handlers para filtro de período (Manutenção)
  const handlePeriodPresetChange = (preset: PeriodPreset): void => {
    setPeriodPreset(preset);
  };

  const handleCustomDateChange = (startDate: string, endDate: string): void => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  // Handlers para filtro de período (Guest)
  const handleGuestPeriodPresetChange = (preset: PeriodPreset): void => {
    setGuestPeriodPreset(preset);
  };

  const handleGuestCustomDateChange = (startDate: string, endDate: string): void => {
    setGuestCustomStartDate(startDate);
    setGuestCustomEndDate(endDate);
  };


  // Maintenance Filters Hook
  const { filteredTickets, maintenanceGroups } = useMaintenanceFilters({
    tickets,
    staysReservations,
    searchTerm,
    filterStatus,
    filterMaintenanceAssignee,
    filterMaintenanceProperty,
    filterMaintenanceType,
    maintenanceStatusFilter,
    activeModule,
    periodPreset,
    customStartDate,
    customEndDate,
    maintenanceOverrides,
  });

  // Maintenance Pagination Hook
  const resetTrigger = `${searchTerm}-${filterStatus}-${filterMaintenanceAssignee.join(',')}-${filterMaintenanceProperty}-${filterMaintenanceType}-${maintenanceStatusFilter}-${periodPreset}-${customStartDate}-${customEndDate}`;
  const {
    paginatedGroups,
    hasMore: hasMoreMaintenanceItems,
    loadMore: loadMoreMaintenanceItems,
    displayCount: maintenanceDisplayCount,
    totalItems: maintenanceTotalItems,
  } = useMaintenancePagination({
    groups: maintenanceGroups,
    resetTrigger,
  });

  const getGridClass = (): string => {
      if (gridColumns === 2) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
      if (gridColumns === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      if (gridColumns === 6) return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6';
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  const guestRelationsUsers = useMemo(() => {
      return users.filter(u => u.role === 'Guest Relations' || u.role === 'Admin');
  }, [users]);
  
  const maintenanceUsers = useMemo(() => {
      return users.filter(u => u.role === 'Maintenance' || u.role === 'Faxineira' || u.role === 'Admin');
  }, [users]);

  const guestWorkload = useMemo(() => {
      const workload: Record<string, number> = {};
      const today = new Date().getTime();
      guestRelationsUsers.forEach(u => workload[u.name] = 0);

      staysReservations.forEach(r => {
          if (r.responsibleName && workload[r.responsibleName] !== undefined && new Date(r.checkInDate).getTime() >= today) {
              workload[r.responsibleName]++;
          }
      });
      return workload;
  }, [guestRelationsUsers, staysReservations]);

  const propertiesWithActiveTickets = useMemo(() => {
      const set = new Set<string>();
      tickets.forEach(t => {
          if (t.status !== TicketStatus.DONE) {
              set.add(t.propertyCode);
          }
      });
      return set;
  }, [tickets]);

  // --- KIOSK MODE ---
  if (kioskProperty && isDbConnected) {
      const prop = properties.find(p => p.code === kioskProperty);
      const activeRes = staysReservations.find(r =>
        r.propertyCode === kioskProperty &&
        (r.status === ReservationStatus.CHECKIN || r.status === ReservationStatus.CONFIRMED)
      ) || null;

      return (
          <TabletApp
              propertyCode={kioskProperty}
              propertyName={prop?.address || kioskProperty}
              currentReservation={activeRes}
              tips={tips}
              tickets={tickets}
              users={users}
              serviceTypes={settings.serviceTypes}
              afterHoursConfig={settings.afterHours}
              conciergeOffers={conciergeOffers}
              onAddTicket={(t: any) => storageService.tickets.add({...t, id: generateId(), status: TicketStatus.OPEN, createdAt: Date.now(), updatedAt: Date.now()})}
              onAddFeedback={(f: GuestFeedback) => storageService.feedbacks.add(f)}
              onTicketFeedback={(ticketId: string, rating: number, comment: string) => {
                 const ticket = tickets.find(t => t.id === ticketId);
                 if(ticket) {
                     storageService.tickets.update({
                         ...ticket,
                         guestFeedback: { rating, comment, createdAt: Date.now() }
                     });
                 }
              }}
              onUpdateOffer={(offer) => storageService.conciergeOffers.update(offer)}
          />
      );
  }

  // --- FIELD APP MODE ---
  if (activeModule === 'field_app' && currentUser) {
      return (
          <FieldApp
              currentUser={currentUser}
              tickets={tickets}
              properties={properties}
              onLogout={handleLogout}
              onUpdateTicket={(id, status, date, reportData) => {
                  const updates: any = { status, updatedAt: Date.now() };
                  if (status === TicketStatus.DONE && date) updates.completedDate = date;
                  if (reportData) updates.completionReport = reportData;
                  storageService.tickets.update({ id, ...updates });
              }}
          />
      );
  }

  // Loading Screens (DB connection, login, landing page)
  const loadingScreen = (
    <LoadingScreens
      isDbConnected={isDbConnected}
      kioskProperty={kioskProperty}
      currentUser={currentUser}
      viewMode={viewMode}
      users={users}
      onLogin={(user) => {
        handleLogin(user);
        const primaryModule = getPrimaryModuleForRole(user.role);
        setActiveModule(primaryModule);
        setViewMode(getDefaultViewForModule(primaryModule));
      }}
      onLogout={handleLogout}
      onSelectModule={(m) => {
        if(m === 'kiosk') {
          setViewMode('settings');
        } else if (m === 'field_app') {
          setActiveModule('field_app');
        } else {
          setActiveModule(m as any);
          setViewMode(m === 'inventory' ? 'inventory' : m === 'office' ? 'office' : m === 'reservations' ? 'general-calendar' : 'cards');
        }
      }}
    />
  );

  if (!isDbConnected || !currentUser || viewMode === 'landing') {
    return loadingScreen;
  }

  return (
    <div className="flex h-screen bg-[#fdf8f6] text-gray-800 font-sans overflow-hidden">
      {/* 🍞 Toast Notifications Container */}
      <ToastContainer 
        notifications={toastNotifications}
        onRemove={handleRemoveToast}
      />

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col shadow-2xl ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="absolute top-2 right-2">
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100">
                <X size={20} />
            </button>
         </div>
         <AppSidebar
            currentUser={currentUser}
            activeModule={activeModule}
            viewMode={viewMode}
            sidebarOpen={sidebarOpen}
            mobileMenuOpen={mobileMenuOpen}
            onModuleChange={(module, view) => {
              setActiveModule(module);
              setViewMode(view);
            }}
            onViewModeChange={setViewMode}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onCloseMobileMenu={() => setMobileMenuOpen(false)}
            onLogout={handleLogout}
          />
      </aside>

      <aside className={`hidden md:flex ${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 flex-col transition-all duration-300 z-20 shadow-sm relative`}>
         <AppSidebar
            currentUser={currentUser}
            activeModule={activeModule}
            viewMode={viewMode}
            sidebarOpen={sidebarOpen}
            mobileMenuOpen={mobileMenuOpen}
            onModuleChange={(module, view) => {
              setActiveModule(module);
              setViewMode(view);
            }}
            onViewModeChange={setViewMode}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onCloseMobileMenu={() => setMobileMenuOpen(false)}
            onLogout={handleLogout}
          />
      </aside>

      <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
        <AppHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          activeModule={activeModule}
          viewMode={viewMode}
          setViewMode={setViewMode}
          kioskProperty={kioskProperty}
          incomingCalls={incomingCalls}
          setActiveCall={setActiveCall}
          isGlobalLoading={isGlobalLoading}
          notifications={notifications}
          showNotifications={showNotifications}
          toggleNotifications={toggleNotifications}
          markAllRead={markAllRead}
          clearNotifications={clearNotifications}
          ticketFormMode={ticketFormMode}
          setTicketFormMode={setTicketFormMode}
          setShowTicketForm={setShowTicketForm}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-[#fdf8f6]">
           
           {(activeModule === 'maintenance' || activeModule === 'concierge') && (
              <MaintenanceView
                tickets={tickets}
                filteredTickets={filteredTickets}
                maintenanceGroups={paginatedGroups}
                viewMode={viewMode}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                setSelectedTicket={setSelectedTicket}
                searchTerm={searchTerm}
                filterStatus={filterStatus}
                filterMaintenanceAssignee={filterMaintenanceAssignee}
                setFilterMaintenanceAssignee={setFilterMaintenanceAssignee}
                filterMaintenanceProperty={filterMaintenanceProperty}
                filterMaintenanceType={filterMaintenanceType}
                setFilterMaintenanceType={setFilterMaintenanceType}
                maintenanceStatusFilter={maintenanceStatusFilter}
                setMaintenanceStatusFilter={setMaintenanceStatusFilter}
                activeModule={activeModule}
                gridColumns={gridColumns}
                periodPreset={periodPreset}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onPeriodPresetChange={handlePeriodPresetChange}
                onCustomDateChange={handleCustomDateChange}
                hasMoreItems={hasMoreMaintenanceItems}
                onLoadMore={loadMoreMaintenanceItems}
                totalItems={maintenanceTotalItems}
                displayCount={maintenanceDisplayCount}
                staysReservations={staysReservations}
                maintenanceOverrides={maintenanceOverrides}
                allUsers={users}
                isLoading={staysLoading}
              />
           )}

           {/* GUEST MODULE - Reservation Cards by Day */}
           {activeModule === 'guest' && (
             <GuestView
               staysReservations={staysReservations}
               staysAgendaGroups={staysAgendaGroups}
               viewMode={viewMode}
               currentMonth={currentMonth}
               setCurrentMonth={setCurrentMonth}
               setSelectedReservation={setSelectedReservation}
               searchTerm={searchTerm}
               tickets={tickets}
               staysLoading={staysLoading}
               gridColumns={gridColumns}
               guestPeriodPreset={guestPeriodPreset}
               guestCustomStartDate={guestCustomStartDate}
               guestCustomEndDate={guestCustomEndDate}
               guestSelectedStatuses={guestSelectedStatuses}
               onGuestPeriodPresetChange={handleGuestPeriodPresetChange}
               onGuestCustomDateChange={handleGuestCustomDateChange}
               onGuestStatusChange={setGuestSelectedStatuses}
             />
           )}

           {/* Module Router - All specialized views */}
           <ModuleRouter
             viewMode={viewMode}
             currentUser={currentUser}
             users={users}
             tickets={tickets}
             staysReservations={staysReservations}
             properties={properties}
             propertiesFromMongoDB={propertiesFromMongoDB}
             settings={settings}
             suppliers={suppliers}
             tips={tips}
             feedbacks={feedbacks}
             conciergeOffers={conciergeOffers}
             logs={logs}
             monitoredFlights={monitoredFlights}
             inventoryItems={inventoryItems}
             inventoryTransactions={inventoryTransactions}
             officeDeliveries={officeDeliveries}
             boards={boards}
             boardColumns={boardColumns}
             boardCards={boardCards}
             staysCalendarData={staysCalendarData}
             selectedBoard={selectedBoard}
             setSelectedBoard={setSelectedBoard}
             setSelectedReservation={setSelectedReservation}
             addLog={addLog}
             updatePropertyInState={updatePropertyInState}
             createInventoryItem={createInventoryItem}
             updateInventoryItem={updateInventoryItem}
             deleteInventoryItem={deleteInventoryItem}
             createInventoryTransaction={createInventoryTransaction}
             handleActivateTablet={handleActivateTablet}
             handleOpenFieldApp={handleOpenFieldApp}
             maintenanceOverrides={maintenanceOverrides}
           />

        </main>
      </div>

      <TicketModals
        showTicketForm={showTicketForm}
        setShowTicketForm={setShowTicketForm}
        ticketFormMode={ticketFormMode}
        ticketPreFill={ticketPreFill}
        setTicketPreFill={setTicketPreFill}
        onTicketSubmit={() => {}}
        selectedTicket={selectedTicket}
        setSelectedTicket={setSelectedTicket}
        users={users}
        onUpdateStatus={() => {}}
        onAssignTicket={() => {}}
        onAddExpense={() => {}}
        onDeleteExpense={() => {}}
        onDeleteTicket={() => {}}
        properties={properties}
        settings={settings}
        activeModule={activeModule}
        reservations={reservations}
        currentUser={currentUser}
        addLog={addLog}
        addNotification={addNotification}
      />

      <ReservationModals
        showReservationForm={showReservationForm}
        setShowReservationForm={setShowReservationForm}
        selectedReservation={selectedReservation}
        setSelectedReservation={setSelectedReservation}
        properties={properties}
        currentUser={currentUser}
        tickets={tickets}
        staysReservations={staysReservations}
        onReservationSubmit={() => {}}
        onUpdateReservation={() => {}}
        onAddExpense={() => {}}
        onDeleteExpense={() => {}}
        setTicketPreFill={setTicketPreFill}
        setShowTicketForm={setShowTicketForm}
        addLog={addLog}
        addNotification={addNotification}
      />

      {/* STAFF INCOMING CALL MODAL */}
      {activeCall && !kioskProperty && (
        <StaffCallModal
          activeCall={activeCall}
          isMuted={isMuted}
          staffRemoteAudio={staffRemoteAudio}
          onAnswerCall={handleAnswerCall}
          onRejectCall={handleRejectCall}
          onEndCall={handleEndCall}
          onToggleMute={toggleStaffMute}
        />
      )}

      {/* Celebration Popup removido - usando apenas toast + sininho */}

      {/* Test Button (fixed position) - COMENTADO */}
      {/* <button
        onClick={() => {
          // Simular 2 reservas novas para teste
          const mockReservations = [
            {
              id: 'test-1',
              guestName: 'João Silva',
              propertyCode: 'I-AC-101',
              checkInDate: new Date().toISOString(),
              checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              guestCount: 2,
              nights: 3,
              channel: 'Airbnb',
              totalValue: 1500,
              currency: 'BRL',
            },
            {
              id: 'test-2',
              guestName: 'Maria Santos',
              propertyCode: 'I-AC-105',
              checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              checkOutDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
              guestCount: 4,
              nights: 5,
              channel: 'Booking.com',
              totalValue: 2800,
              currency: 'BRL',
            }
          ] as any;

          console.log('🧪 Testando popup com 2 reservas');
          setNewReservations(mockReservations);
          setShowConfetti(true);
          playSuccessSound();

          setTimeout(() => {
            setShowConfetti(false);
            setNewReservations([]);
          }, 10000);
        }}
        className="fixed z-50 px-6 py-3 font-semibold text-white transition-all duration-200 rounded-lg shadow-lg bottom-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-105 hover:shadow-xl"
        title="Testar animação de nova reserva (2 reservas)"
      >
        🎉 Testar Celebração
      </button> */}

    </div>
  );
}

// App - Root component that provides users data to AuthContext
function App() {
  const [users, setUsers] = useState<UserWithPassword[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Firebase Auth Initialization
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsDbConnected(true);
      } else {
        auth.signInAnonymously().catch((error) => {
          console.error("Firebase Auth Error:", error);
        });
      }
    });
    return () => unsubAuth();
  }, []);

  // Subscribe to users collection
  useEffect(() => {
    if (!isDbConnected) return;
    const unsubUsers = storageService.users.subscribe((fetchedUsers) => {
      setUsers(fetchedUsers as UserWithPassword[]);
    });
    return () => unsubUsers();
  }, [isDbConnected]);

  // Callback handlers for providers (no-op, state managed in context)
  const handleUserChange = useCallback((user: User | null) => {
    // User state is managed in AuthContext, this is just for provider interface
  }, []);

  const handleModuleChange = useCallback((module: AppModule | null) => {
    // Module state is managed in NavigationContext
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    // ViewMode state is managed in NavigationContext
  }, []);

  return (
    <AppProviders
      users={users}
      onUserChange={handleUserChange}
      onModuleChange={handleModuleChange}
      onViewModeChange={handleViewModeChange}
    >
      <AppContent />
    </AppProviders>
  );
}

export default App;