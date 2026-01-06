# 📋 MAPEAMENTO COMPLETO DO MONOREPO CASAPĒ

## 🚨 REGRA CRÍTICA - LEIA PRIMEIRO

```
⛔ NUNCA DUPLICAR, SUBSTITUIR OU REMOVER DADOS DA API STAYS NO FIREBASE

✅ Dados de RESERVAS e PROPRIEDADES vêm EXCLUSIVAMENTE da API Stays
   (https://stays-api.onrender.com)

✅ Firebase é APENAS para dados que NÃO existem na API Stays:
   - Tickets de manutenção
   - Usuários e permissões
   - Inventário customizado
   - Operações de escritório
   - Logs, feedbacks, tips

❌ NUNCA fazer:
   - Salvar reservas do Stays no Firestore
   - Criar propriedades no Firebase que existem no Stays
   - Duplicar dados de calendário
   - Substituir fonte de dados Stays por Firebase
```

---

## 1️⃣ BACKEND API (casape-api)

### 📍 Rotas Principais

**Localização:** `casape-api/src/routes/`

| Arquivo | Endpoints | Propósito |
|---------|-----------|-----------|
| **`index.ts`** | - | Hub de registro de rotas, aplica auth middleware |
| **`health.ts`** | `GET /health`<br>`GET /health/ready` | Health checks (SEM autenticação) |
| **`dashboard.ts`** | `GET /api/v1/dashboard` | Métricas consolidadas do dashboard |
| **`calendar.ts`** | `GET /api/v1/calendar?from=&to=` | Dados de calendário por período |
| **`sync.ts`** | `GET /api/v1/sync/status`<br>`POST /api/v1/sync/trigger` | Status e controle de sincronização |
| **`financials.ts`** | `GET /api/v1/financials/summary`<br>`GET /api/v1/financials/by-property`<br>`GET /api/v1/financials/by-channel`<br>`GET /api/v1/financials/trend`<br>`GET /api/v1/financials/panel`<br>`GET /api/v1/financials/detailed` | Relatórios financeiros e receitas |
| **`statistics.ts`** | `GET /api/v1/statistics/bookings`<br>`GET /api/v1/statistics/occupancy`<br>`GET /api/v1/statistics/cancellations` | Estatísticas de ocupação e reservas |
| **`guests.ts`** | `GET /api/v1/guests/summary`<br>`GET /api/v1/guests/returning`<br>`GET /api/v1/guests/demographics` | Análise de hóspedes |
| **`properties.ts`** | `GET /api/v1/properties`<br>`GET /api/v1/properties/:id`<br>`GET /api/v1/properties/search?q=`<br>`POST /api/v1/properties/sync` | Gestão de propriedades |
| **`propertyCharacteristics.ts`** | `GET /api/v1/properties/:id/characteristics`<br>`PATCH /api/v1/properties/:id/characteristics` | Características e overrides manuais |
| **`inventory.ts`** | `GET/POST/PUT/DELETE /api/v1/inventory/items/*`<br>`GET/POST /api/v1/inventory/transactions/*`<br>`GET/POST /api/v1/inventory/reference/*` | Gestão de inventário |
| **`tickets.ts`** | `GET/POST/PATCH/DELETE /api/v1/tickets/*`<br>`GET /api/v1/tickets/statistics` | Gestão de tickets |
| **`team.ts`** | `GET /api/v1/team/statistics`<br>`POST /api/v1/team/assign`<br>`POST /api/v1/team/feedback` | Performance e atribuições |
| **`unified.ts`** | `GET /api/v1/all-data?from=&to=` | Endpoint único com todos os dados |

### 🔐 Middleware de Autenticação

**Arquivo:** `casape-api/src/middleware/auth.ts`

```typescript
validateApiKey() // Valida header X-API-Key
// Retorna 401 se ausente, 403 se inválido
// Aplicado em todas as rotas /api/v1/* (exceto /health)
```

### ⏰ Scheduler/Cron Jobs

**Arquivo:** `casape-api/src/jobs/scheduler.ts`

| Função | Cron | Descrição |
|--------|------|-----------|
| **`startScheduler()`** | `*/3 * * * *` (a cada 3 min) | Sincroniza reservas do Stays.net |
| **`runInitialSync()`** | Uma vez na inicialização | Sync inicial se necessário |
| **`startPropertySyncScheduler()`** | `0 3 * * *` (3h da manhã) | Sincroniza propriedades diariamente |
| **`enrichBookingsWithClientData()`** | Após cada sync | Enriquece com dados demográficos |

### 🔄 Serviços Stays.net e Sync

**Localização:** `casape-api/src/services/`

#### Cliente Stays.net API

**Arquivo:** `stays/StaysApiClient.ts`

```typescript
class StaysApiClient {
  // Autenticação OAuth2
  getBookings(params)           // Lista reservas
  getBookingDetails(id)         // Detalhes de reserva
  getClients(params)            // Dados de hóspedes
  getListings()                 // Listagens de propriedades
  getListingDetails(id)         // Detalhes de propriedade
  getEnhancedListingDetails(id) // Detalhes expandidos
  getCalendarDays()             // Calendário/disponibilidade
  getInventoryCategories()      // Categorias de inventário
  getInventoryItems()           // Itens de inventário
  getInventoryConditions()      // Condições de inventário
  getListingCustomFields()      // Campos customizados
  getPropertyDetails()          // Detalhes adicionais
}
```

#### Serviço de Sincronização

**Arquivo:** `sync/SyncService.ts`

```typescript
syncStaysData()         // Sync completo com rate limiting (p-queue)
getSyncStatus()         // Status da última sincronização
extractTotalPrice()     // Extração multi-estratégia de preços
updateSyncStatus()      // Atualiza status no MongoDB
```

**Coleções MongoDB usadas:**
- `stays_unified_bookings` - Reservas pré-desnormalizadas
- `stays_reservations` - Reservas brutas
- `stays_listings` - Referências de listagens
- `stays_sync_status` - Status de sync

#### Sincronização de Propriedades

**Arquivo:** `sync/PropertySyncService.ts`

```typescript
syncPropertiesData()       // Sync da API de conteúdo Stays.net
getPropertySyncStatus()    // Status da sincronização
transformAmenities()       // Converte IDs de amenidades
```

**Coleções MongoDB usadas:**
- `stays_properties` - Metadados de propriedades
- `stays_property_sync_status` - Status
- `inventory_reference_amenities` - Amenidades

#### Enriquecimento de Dados

**Arquivo:** `sync/ClientEnrichmentService.ts`

```typescript
enrichBookingsWithClientData() // Adiciona demografia de hóspedes
```

### 📊 Outros Serviços Importantes

| Arquivo | Propósito |
|---------|-----------|
| **`DashboardService.ts`** | Agregação de dados do dashboard |
| **`CalendarService.ts`** | Dados de calendário por propriedade |
| **`FinancialsService.ts`** | Análise financeira e receitas |
| **`StatisticsService.ts`** | Estatísticas de reservas |
| **`GuestsService.ts`** | Análise de hóspedes |
| **`UnifiedService.ts`** | Combina dados MongoDB + Firebase |
| **`PropertiesService.ts`** | Gestão de propriedades |
| **`PropertyCharacteristicsService.ts`** | Características e overrides |
| **`InventoryService.ts`** | Gestão de inventário |
| **`TicketsService.ts`** | Gestão de tickets |
| **`TeamService.ts`** | Performance da equipe |

### ⚙️ Configuração

| Arquivo | Propósito |
|---------|-----------|
| **`config/env.ts`** | Validação de variáveis de ambiente (Zod) |
| **`config/mongodb.ts`** | Conexão MongoDB, índices, pools |
| **`config/platformImages.ts`** | Mapeamento plataforma → imagem/cor |

### 🚀 Ponto de Entrada

**Arquivo:** `casape-api/src/index.ts`

```typescript
// Sequência de inicialização:
1. Carrega configuração (.env)
2. Conecta ao MongoDB
3. Cria servidor Fastify
4. Inicia servidor na porta 3001
5. Executa sync inicial (background)
6. Inicia scheduler de reservas (3 min)
7. Inicia scheduler de propriedades (diário 3h)
8. Configura shutdown gracioso
```

---

## 2️⃣ FRONTEND (central-casaperio)

### 📍 App.tsx - Estado Global

**Arquivo:** `central-casaperio/App.tsx` (920 linhas)

**Componentes:**
- **`App()`** - Inicializa Firebase Auth
- **`AppContent()`** - Gerenciamento de estado global

**Estado Global Gerenciado:**
```typescript
// Autenticação e Sistema
currentUser, isDbConnected, kioskMode, activeModule, viewMode

// Firebase Firestore (via storageService)
tickets, users, logs, settings, tips, feedbacks
inventoryItems, inventoryTransactions
officeDeliveries, officeSupplies, officeAssets, officeShifts
boards, boardColumns, boardCards
monitoredFlights, conciergeOffers, suppliers

// API Stays (via React Query)
staysReservations (fonte primária)
staysListings

// MongoDB via API (via React Query)
properties (PropertyCharacteristics)

// Estado derivado
filteredTickets, filteredReservations, statistics
```

**Hooks Customizados:**
- `useAuth()` - Contexto de autenticação
- `useNavigation()` - Navegação entre módulos
- `useDataSubscriptions()` - Subscrições Firebase real-time
- `useStaysData()` - Polling React Query (5 min)
- `usePropertiesData()` - Properties do MongoDB
- `useInventoryData()` - Dados de inventário via API
- `useNotifications()` - Sistema de notificações
- `useNewReservationDetector()` - Popup de celebração
- `useTicketNotifications()` - Notificações de tickets
- `useWebRTCCall()` - Chamadas de voz/vídeo
- `useMaintenanceFilters()` - Filtros de tickets

### 📍 Services - Camada de Dados

**Localização:** `central-casaperio/services/`

#### Firestore (Dados Complementares)

**Arquivo:** `storage.ts` (774 linhas)

```typescript
storageService = {
  // Manutenção
  tickets: { subscribe(), add(), update(), delete() }

  // Usuários e Admin
  users: { subscribe(), add(), update(), delete() }
  settings: { subscribe(), update() }
  logs: { subscribe(), add() }

  // Hóspedes
  tips: { subscribe(), add(), update(), delete() }
  feedbacks: { subscribe(), add(), delete() }
  monitoredFlights: { subscribe(), add(), update(), delete() }

  // Inventário (customizado)
  inventoryItems: { subscribe(), add(), update(), delete() }
  inventoryTransactions: { subscribe(), add() }

  // Escritório
  officeDeliveries: { subscribe(), add(), update(), delete() }
  officeSupplies: { subscribe(), add(), update(), delete() }
  officeAssets: { subscribe(), add(), update(), delete() }
  officeShifts: { subscribe(), add(), update(), delete() }

  // Concierge
  conciergeOffers: { subscribe(), add(), update(), delete() }
  suppliers: { subscribe(), add(), update(), delete() }

  // Boards
  boards: { subscribe(), add(), update(), delete() }
  boardColumns: { subscribe(), add(), update(), delete() }
  boardCards: { subscribe(), add(), update(), delete() }

  // Comunicação
  messages: { subscribe(), add() }
  calls: { subscribe(), add(), update() }
}
```

**⚠️ Coleções Firebase (26 total):**
- `tickets`, `users`, `logs`, `settings`, `properties` (obsoleta)
- `tips`, `feedbacks`, `monitoredFlights`
- `inventory_items`, `inventory_transactions`
- `office_deliveries`, `office_supplies`, `office_assets`, `office_shifts`
- `concierge_offers`, `suppliers`
- `boards`, `board_columns`, `board_cards`
- `messages`, `calls`

#### API Stays (Fonte Primária Reservas/Propriedades)

**Arquivo:** `staysApiService.ts`

```typescript
// Reservas (READ-ONLY - NUNCA modificar)
getAllStaysReservations(from?, to?)
getStaysReservationById(id)

// Propriedades (READ-ONLY - NUNCA modificar)
getAllStaysProperties()
```

**Arquivo:** `staysDataMapper.ts`

```typescript
// Mapeia dados brutos Stays → tipos do app
mapStaysReservation(raw) → Reservation
mapStaysProperty(raw) → Property
```

#### MongoDB Properties via API

**Arquivo:** `propertiesApiService.ts`

```typescript
fetchPropertiesFromAPI()           // Lista PropertyCharacteristics
fetchPropertyById(id)              // Detalhes de propriedade
updatePropertyCharacteristics(id, updates) // Atualiza overrides manuais
```

#### Inventário via API

**Arquivo:** `inventoryApiService.ts`

```typescript
// Items
fetchInventoryItems()
createInventoryItem(item)
updateInventoryItem(id, updates)
deleteInventoryItem(id)

// Transactions
fetchInventoryTransactions(filters?)
createInventoryTransaction(transaction)
```

#### Google Gemini AI

**Arquivo:** `geminiService.ts`

```typescript
analyzeTickets(tickets)      // Análise de tickets
lookupFlightStatus(code)     // Status de voo
```

#### Automação

**Arquivo:** `checkoutAutomationService.ts`

```typescript
createCheckoutTickets(reservation, properties) // Auto-cria tickets de checkout
```

### 📍 Types.ts - Definições de Tipos

**Arquivo:** `central-casaperio/types.ts`

**Principais Enums:**
```typescript
TicketStatus = 'Aberto' | 'Em Andamento' | 'Concluído'
Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente'
ServiceType = 10+ tipos
ReservationStatus = 5 status
InventoryCategory = 6 categorias
TransactionType = 6 tipos
ViewMode = 25+ modos
AppModule = 10 módulos
```

**Principais Interfaces:**
- `Ticket`, `Expense`, `ServiceTypeDefinition`
- `Reservation`, `FlightData`, `GuestFeedback`, `GuestTip`
- `Property`, `PropertyCharacteristics`, `ManualOverrides`
- `User`, `UserWithPassword`
- `InventoryItem`, `InventoryTransaction`
- `Delivery`, `OfficeSupply`, `CompanyAsset`, `WorkShift`
- `ConciergeOffer`, `Supplier`
- `Board`, `BoardColumn`, `BoardCard`
- `ChatMessage`, `CallSession`
- `LogEntry`, `MonitoredFlight`

---

## 3️⃣ PONTOS DE ENTRADA POR MÓDULO

### 🔧 Módulo: MAINTENANCE (Manutenção)

**Ativação:** `activeModule === 'maintenance'`

**Componente Central:** `components/views/MaintenanceView.tsx`

**Componentes Relacionados:**
- `components/TicketForm.tsx` - Criar/editar tickets
- `components/TicketDetailModal.tsx` - Detalhes do ticket
- `components/modals/TicketModals.tsx` - Orquestração de modais

**View Modes:**
- `cards` - Grid de cards
- `list` - Lista tabular
- `calendar` - Visualização por calendário

**Serviços Chamados:**
```typescript
storageService.tickets.*        // CRUD tickets (Firebase)
geminiService.analyzeTickets()  // Análise IA (Gemini)
checkoutAutomationService.*     // Auto-criação tickets
```

**Dados Firebase:**
- ✅ `tickets` - Solicitações de manutenção
- ✅ `users` - Equipe de manutenção
- ✅ `settings.serviceTypes` - Tipos de serviço

**Dados Stays API:**
- 🔒 Propriedades (somente leitura para seleção)
- 🔒 Reservas (para vincular tickets)

---

### 👥 Módulo: GUEST/RESERVATIONS (Hóspedes/Reservas)

**Ativação:** `activeModule === 'guest'` ou `'reservations'`

**Componente Central:** `components/views/GuestView.tsx`

**Componentes Relacionados:**
- `components/ReservationForm.tsx` - Criar/editar reservas
- `components/ReservationDetailModal.tsx` - Detalhes da reserva
- `components/GuestCRM.tsx` (lazy) - Analytics de hóspedes
- `components/GuestCMS.tsx` - Tips para hóspedes
- `components/GuestCommunicator.tsx` - Comunicação com hóspede
- `components/CalendarView.tsx` - Visualização calendário
- `components/GeneralCalendar.tsx` (lazy) - Calendário completo

**View Modes:**
- `cards` - Cards de reservas
- `calendar` - Calendário por propriedade
- `general-calendar` - Calendário geral
- `guest-crm` - Analytics de hóspedes
- `cms` - Gestão de tips

**Serviços Chamados:**
```typescript
// DADOS PRIMÁRIOS (READ-ONLY)
staysApiService.getAllStaysReservations()  // 🔒 Stays API
staysApiService.getAllStaysProperties()    // 🔒 Stays API

// DADOS COMPLEMENTARES (Firebase)
storageService.tips.*                       // ✅ Tips para hóspedes
storageService.feedbacks.*                  // ✅ Avaliações
storageService.monitoredFlights.*           // ✅ Voos monitorados
geminiService.lookupFlightStatus()          // 🤖 Status voo (IA)
```

**⚠️ REGRA CRÍTICA:**
```typescript
// ❌ NUNCA FAZER:
storageService.reservations.add()  // NÃO criar reservas no Firebase
storageService.properties.add()    // NÃO criar propriedades no Firebase

// ✅ PERMITIDO:
storageService.tips.add()          // Tips complementares
storageService.feedbacks.add()     // Feedback de hóspedes
```

---

### 📦 Módulo: INVENTORY (Inventário)

**Ativação:** `activeModule === 'inventory'`

**Componente Central:** `components/InventoryPanel.tsx` (34KB)

**Componentes Relacionados:**
- `components/settings/modals/EditInventoryItemModal.tsx`
- `components/settings/tabs/CatalogTab.tsx`

**View Mode:** `inventory`

**Serviços Chamados:**
```typescript
// API Backend (stays-api)
inventoryApiService.fetchInventoryItems()
inventoryApiService.fetchInventoryTransactions()
inventoryApiService.createInventoryItem()
inventoryApiService.updateInventoryItem()
inventoryApiService.createInventoryTransaction()

// Firebase (apenas para items customizados legados)
storageService.inventoryItems.*        // ✅ Items customizados
storageService.inventoryTransactions.* // ✅ Transações
```

**Funcionalidades:**
- Gestão de estoque por propriedade
- Histórico de movimentações (compra, transferência, consumo, quebra)
- Categorias: Enxoval, Eletrônicos, Mobiliário, Amenidades, Utensílios
- Alertas de estoque baixo

---

### 🏢 Módulo: OFFICE (Escritório)

**Ativação:** `activeModule === 'office'`

**Componente Central:** `components/OfficePanel.tsx` (11KB)

**Componentes Relacionados:**
- `components/settings/tabs/SuppliersTab.tsx`

**View Mode:** `office`

**Serviços Chamados:**
```typescript
storageService.officeDeliveries.*  // ✅ Gestão de entregas
storageService.officeSupplies.*    // ✅ Suprimentos
storageService.officeAssets.*      // ✅ Ativos da empresa
storageService.officeShifts.*      // ✅ Turnos de trabalho
storageService.suppliers.*         // ✅ Fornecedores
```

**Funcionalidades:**
- Rastreamento de entregas (Pendente → Recebido → Entregue)
- Gestão de courriers
- Entregas por propriedade
- Tags de palavras-chave

---

### 📱 Módulo: TABLET/KIOSK (Quiosque)

**Ativação:** `kioskMode.propertyCode` definido

**Componente Central:** `components/TabletApp.tsx` (38KB)

**Props Principais:**
```typescript
propertyCode        // Código da propriedade
propertyName        // Nome para exibição
currentReservation  // Reserva ativa
tips               // Tips do hóspede
serviceTypes       // Tipos de serviço disponíveis
conciergeOffers    // Ofertas de concierge
afterHoursConfig   // Regras fora de horário
```

**Abas:**
1. **Home** - Info da propriedade, WiFi, códigos, clima
2. **Concierge** - Reserva de serviços
3. **Services** - Abertura de tickets
4. **Tips** - Tips curados
5. **Stay** - Check-in/out, feedback

**Serviços Chamados:**
```typescript
storageService.tickets.add()           // ✅ Criar tickets
storageService.conciergeOffers.*       // ✅ Ofertas
storageService.feedbacks.add()         // ✅ Feedback
// Dados Stays (propriedade, reserva) - 🔒 READ-ONLY
```

---

### 🔧 Módulo: FIELD APP (App de Campo)

**Ativação:** `activeModule === 'field_app'`

**Componente Central:** `components/FieldApp.tsx` (26KB)

**Props Principais:**
```typescript
currentUser        // Equipe de manutenção
tickets           // Tickets atribuídos
properties        // Dados de localização
onUpdateTicket    // Atualizar status/conclusão
```

**Funcionalidades:**
- Interface móvel para equipe de campo
- Atualização de status de tickets
- Relatórios de conclusão com fotos
- Rastreamento GPS

**Serviços Chamados:**
```typescript
storageService.tickets.update()  // ✅ Atualizar tickets
storageService.logs.add()        // ✅ Log de atividades
```

---

### ⚙️ Módulos Administrativos

#### SETTINGS (Configurações)

**Componente:** `components/SettingsPanel.tsx`

**Abas:**
- `PropertiesTab.tsx` - 🔒 Propriedades (somente leitura Stays)
- `PrioritiesTab.tsx` - ✅ Prioridades de tickets
- `ServicesTab.tsx` - ✅ Tipos de serviço
- `CatalogTab.tsx` - ✅ Catálogo de inventário
- `SuppliersTab.tsx` - ✅ Fornecedores

**Serviços:** `storageService.settings.*`

#### ADMIN (Administração)

**Componente:** `components/AdminPanel.tsx`

**Serviços:** `storageService.users.*`

#### STATS (Estatísticas)

**Componente:** `components/StatsDashboard.tsx`

**Serviços:**
```typescript
// Dados agregados do backend
fetch('/api/v1/dashboard')
fetch('/api/v1/statistics/*')
```

#### PROPERTIES (Propriedades)

**Componente:** `components/PropertiesTool.tsx` (27KB)

**Serviços:**
```typescript
propertiesApiService.fetchPropertiesFromAPI()     // 🔒 MongoDB
propertiesApiService.updatePropertyCharacteristics() // Overrides manuais
```

#### FINANCIAL (Financeiro)

**Componente:** `components/FinancialPanel.tsx`

**Serviços:**
```typescript
fetch('/api/v1/financials/*')  // Backend API
```

#### BOARDS (Quadros Kanban)

**Componentes:**
- `components/BoardList.tsx`
- `components/BoardDetail.tsx` (37KB)

**Serviços:**
```typescript
storageService.boards.*
storageService.boardColumns.*
storageService.boardCards.*
```

---

## 📊 RESUMO DE FLUXO DE DADOS

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  App.tsx (Estado Global)                                 │
│    ├─ useStaysData() ──────────────┐                    │
│    ├─ usePropertiesData() ─────────┤                    │
│    ├─ useInventoryData() ──────────┤                    │
│    └─ useDataSubscriptions() ──┐   │                    │
│                                 │   │                    │
└─────────────────────────────────┼───┼────────────────────┘
                                  │   │
                 ┌────────────────┘   └──────────────────┐
                 │                                        │
      ┌──────────▼─────────┐                  ┌──────────▼─────────┐
      │   Firebase (GCP)   │                  │  Backend API       │
      │                    │                  │  (Render.com)      │
      ├────────────────────┤                  ├────────────────────┤
      │ ✅ tickets         │                  │ MongoDB Atlas:     │
      │ ✅ users           │                  │ 🔒 reservations    │
      │ ✅ logs            │                  │ 🔒 properties      │
      │ ✅ settings        │                  │ ✅ inventory       │
      │ ✅ tips            │                  │ ✅ tickets         │
      │ ✅ feedbacks       │                  │                    │
      │ ✅ inventory*      │                  │ Sync Cron:         │
      │ ✅ office_*        │                  │ ⏰ 3 min (bookings)│
      │ ✅ boards          │                  │ ⏰ 3h (properties) │
      │ ✅ concierge       │                  │                    │
      │                    │                  │ Stays.net API:     │
      │ (26 coleções)      │◄─────────────────┤ 🔒 OAuth2 Client   │
      └────────────────────┘  complementar    └────────────────────┘
                                                       │
                                                       │
                                              ┌────────▼────────┐
                                              │  Stays.net API  │
                                              │  (casap.stays)  │
                                              ├─────────────────┤
                                              │ Reservas        │
                                              │ Propriedades    │
                                              │ Calendário      │
                                              │ Inventário Ref  │
                                              └─────────────────┘
```

**Legenda:**
- 🔒 **READ-ONLY** - Dados vindos exclusivamente da API Stays
- ✅ **READ/WRITE** - Dados complementares no Firebase
- ⏰ **SYNC** - Sincronização automática

---

## ✅ CHECKLIST DE INTEGRAÇÃO

### Backend (casape-api)

- [x] Rotas mapeadas: `src/routes/*.ts`
- [x] Auth middleware: `src/middleware/auth.ts`
- [x] Schedulers: `src/jobs/scheduler.ts`
- [x] Cliente Stays: `src/services/stays/StaysApiClient.ts`
- [x] Sync service: `src/services/sync/SyncService.ts`
- [x] MongoDB config: `src/config/mongodb.ts`
- [x] Entry point: `src/index.ts`

### Frontend (central-casaperio)

- [x] App state: `App.tsx`
- [x] Firestore: `services/storage.ts`
- [x] Stays API: `services/staysApiService.ts`
- [x] Properties API: `services/propertiesApiService.ts`
- [x] Inventory API: `services/inventoryApiService.ts`
- [x] Types: `types.ts`
- [x] Modules: 10 módulos mapeados
- [x] Components: 87+ componentes catalogados

### Regra Crítica

- [x] ⚠️ **NUNCA duplicar dados Stays no Firebase**
- [x] ✅ Reservas/Propriedades → **SOMENTE** API Stays
- [x] ✅ Tickets/Users/Inventory → Firebase complementar

---

## 📁 ESTRUTURA DE DIRETÓRIOS

### Backend (casape-api)

```
casape-api/
├── src/
│   ├── config/
│   │   ├── env.ts                    # Validação env vars
│   │   ├── mongodb.ts                # Setup MongoDB
│   │   └── platformImages.ts         # Mapeamento plataformas
│   ├── jobs/
│   │   └── scheduler.ts              # Cron jobs (3min, 3h)
│   ├── middleware/
│   │   └── auth.ts                   # Validação X-API-Key
│   ├── routes/
│   │   ├── index.ts                  # Hub de rotas
│   │   ├── health.ts                 # Health checks
│   │   ├── dashboard.ts              # Dashboard
│   │   ├── calendar.ts               # Calendário
│   │   ├── sync.ts                   # Sincronização
│   │   ├── financials.ts             # Financeiro
│   │   ├── statistics.ts             # Estatísticas
│   │   ├── guests.ts                 # Hóspedes
│   │   ├── properties.ts             # Propriedades
│   │   ├── propertyCharacteristics.ts # Características
│   │   ├── inventory.ts              # Inventário
│   │   ├── tickets.ts                # Tickets
│   │   ├── team.ts                   # Equipe
│   │   └── unified.ts                # Endpoint único
│   ├── services/
│   │   ├── stays/
│   │   │   ├── StaysApiClient.ts     # Cliente OAuth2
│   │   │   └── types.ts              # Tipos Stays
│   │   ├── sync/
│   │   │   ├── SyncService.ts        # Sync reservas
│   │   │   ├── PropertySyncService.ts # Sync propriedades
│   │   │   └── ClientEnrichmentService.ts # Enriquecimento
│   │   ├── DashboardService.ts
│   │   ├── CalendarService.ts
│   │   ├── FinancialsService.ts
│   │   ├── StatisticsService.ts
│   │   ├── GuestsService.ts
│   │   ├── UnifiedService.ts
│   │   ├── PropertiesService.ts
│   │   ├── PropertyCharacteristicsService.ts
│   │   ├── InventoryService.ts
│   │   ├── TicketsService.ts
│   │   └── TeamService.ts
│   ├── scripts/
│   │   └── manual-sync.ts            # Script manual
│   ├── index.ts                      # Entry point
│   └── server.ts                     # Setup Fastify
├── .env                              # Configuração
├── package.json
└── tsconfig.json
```

### Frontend (central-casaperio)

```
central-casaperio/
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── AppSidebar.tsx
│   │   └── NotificationCenter.tsx
│   ├── modals/
│   │   ├── TicketModals.tsx
│   │   ├── ReservationModals.tsx
│   │   └── StaffCallModal.tsx
│   ├── shared/
│   │   ├── FormInput.tsx
│   │   ├── FormSelect.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   └── [20+ componentes]
│   ├── stats/
│   │   ├── KPICard.tsx
│   │   └── [3+ componentes]
│   ├── views/
│   │   ├── MaintenanceView.tsx
│   │   ├── GuestView.tsx
│   │   └── TypeFilter.tsx
│   ├── routing/
│   │   └── ModuleRouter.tsx
│   ├── settings/
│   │   ├── tabs/
│   │   │   ├── PropertiesTab.tsx
│   │   │   ├── PrioritiesTab.tsx
│   │   │   ├── ServicesTab.tsx
│   │   │   ├── CatalogTab.tsx
│   │   │   └── SuppliersTab.tsx
│   │   └── modals/
│   │       ├── EditInventoryItemModal.tsx
│   │       └── EditServiceTypeModal.tsx
│   ├── screens/
│   │   └── LoadingScreens.tsx
│   ├── celebrations/
│   │   └── CelebrationPopup.tsx
│   ├── AdminPanel.tsx
│   ├── SettingsPanel.tsx
│   ├── InventoryPanel.tsx
│   ├── OfficePanel.tsx
│   ├── TabletApp.tsx (38KB)
│   ├── FieldApp.tsx (26KB)
│   ├── GeneralCalendar.tsx
│   ├── StatsDashboard.tsx
│   ├── GuestCRM.tsx
│   ├── GuestCMS.tsx
│   ├── ConciergeCMS.tsx
│   ├── PropertiesTool.tsx (27KB)
│   ├── FinancialPanel.tsx
│   ├── FlightsPanel.tsx
│   ├── FeedbackPanel.tsx
│   ├── ReportsPanel.tsx
│   ├── LogsPanel.tsx
│   ├── ProfilePanel.tsx
│   ├── MapPanel.tsx
│   ├── InboxPanel.tsx
│   ├── GuestCommunicator.tsx
│   ├── CalendarView.tsx
│   ├── BoardList.tsx
│   ├── BoardDetail.tsx (37KB)
│   ├── TicketForm.tsx (14KB)
│   ├── TicketDetailModal.tsx (19KB)
│   ├── ReservationForm.tsx (11KB)
│   ├── ReservationDetailModal.tsx (34KB)
│   ├── Login.tsx
│   ├── LandingPage.tsx
│   └── [10+ componentes]
├── services/
│   ├── firebase.ts                   # Init Firebase
│   ├── storage.ts (774 linhas)       # Firestore CRUD
│   ├── staysService.ts               # Stays legacy
│   ├── staysApiService.ts            # Stays API
│   ├── staysDataMapper.ts            # Mapeamento
│   ├── geminiService.ts              # Gemini AI
│   ├── propertiesApiService.ts       # MongoDB Properties
│   ├── inventoryApiService.ts        # Inventory API
│   └── checkoutAutomationService.ts  # Automação
├── contexts/
├── hooks/
├── utils/
├── App.tsx (920 linhas)              # Estado global
├── types.ts                          # Definições tipos
├── constants.ts
├── utils.ts
├── index.tsx
├── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## 🔑 VARIÁVEIS DE AMBIENTE

### Backend (casape-api/.env)

```bash
PORT=3001
NODE_ENV=development
API_KEY=chave_api_autenticacao

# MongoDB Atlas
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=stays_api

# Stays.net API
STAYS_API_BASE_URL=https://casap.stays.net
STAYS_CLIENT_ID=client_id
STAYS_CLIENT_SECRET=client_secret

# Configuração Sync
SYNC_INTERVAL_MINUTES=3
SYNC_DATE_RANGE_DAYS=365
```

### Frontend (central-casaperio/.env)

```bash
# Google Gemini AI
VITE_GEMINI_API_KEY=gemini_key

# Firebase
VITE_FIREBASE_API_KEY=firebase_key
VITE_FIREBASE_AUTH_DOMAIN=projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project_id
VITE_FIREBASE_STORAGE_BUCKET=projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=sender_id
VITE_FIREBASE_APP_ID=app_id

# Stays.net API (legacy - não usado no novo fluxo)
VITE_STAYS_CLIENT_ID=client_id
VITE_STAYS_CLIENT_SECRET=client_secret
VITE_STAYS_BASE_URL=https://conta.stays.net/api/v1
VITE_STAYS_AUTH_URL=https://conta.stays.net/oauth/token
```

---

**Documento gerado em:** 2025-12-23
**Repositório:** Casapē Monorepo (casape-api + central-casaperio)
**Versão:** 1.0
