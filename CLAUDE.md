# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Casapē Central** is a property management operations hub for Casapē Boutique de Imóveis, a vacation rental company in Rio de Janeiro. The app manages maintenance tickets, guest reservations, inventory, office operations, and integrates with Stays.net for booking sync.

## Development Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # Production build (tsc && vite build)
npm run preview  # Preview production build
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Google Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Stays.net API
VITE_STAYS_CLIENT_ID=your_stays_client_id
VITE_STAYS_CLIENT_SECRET=your_stays_client_secret
VITE_STAYS_BASE_URL=https://your_account.stays.net/api/v1
VITE_STAYS_AUTH_URL=https://your_account.stays.net/oauth/token
```

## Architecture

### State Management Pattern

Single `App.tsx` manages all global state with Firebase real-time subscriptions. Components receive data via props - no external state management library.

```
App.tsx (state owner)
├── Firebase Auth (anonymous)
├── Firestore subscriptions → setTickets, setReservations, etc.
└── Components receive data as props
```

### Data Layer (`services/storage.ts`)

Subscription-based data access layer wrapping Firestore. Each entity (tickets, reservations, users, etc.) exposes:
- `subscribe(callback)` - Real-time listener returning unsubscribe function
- `add(item)` - Create new document
- `update(item)` - Update existing document
- `delete(id)` - Remove document

Firestore collections: `tickets`, `reservations`, `users`, `properties`, `settings`, `tips`, `feedbacks`, `monitoredFlights`, `logs`, `inventory_items`, `inventory_transactions`, `office_deliveries`, `office_supplies`, `office_assets`, `office_shifts`

### External Integrations

**Stays.net API** (`services/staysService.ts`):
- OAuth2 client credentials flow via CORS proxy (`corsproxy.io`)
- Fetches listings and reservations from `casap.stays.net`
- Normalizes Stays data to app's `Reservation` type

**Google Gemini AI** (`services/geminiService.ts`):
- Ticket analysis and reporting via `gemini-2.5-flash`
- Real-time flight status lookup with Google Search tool

### Key Types (`types.ts`)

- `Ticket` - Maintenance requests with status workflow (Aberto → Em Andamento → Concluído)
- `Reservation` - Guest bookings with channel tracking, expenses, and Stays.net sync
- `Property` - Managed properties with room configurations, WiFi credentials, door codes
- `InventoryItem` / `InventoryTransaction` - Stock management with location tracking
- `Delivery` / `OfficeSupply` / `CompanyAsset` / `WorkShift` - Office operations

### Module System

User access is controlled by `allowedModules` on `User` type. Available modules:
- `maintenance` - Ticket management
- `guest` - Guest relations / CRM
- `reservations` - Calendar views
- `inventory` - Stock control
- `office` - Deliveries, supplies, shifts
- `tablet` - Kiosk mode for properties

### View Modes

`ViewMode` type controls which panel/view is rendered. Main views: `cards`, `list`, `calendar`, `general-calendar`, `weekly-planning`, `stats`, `admin`, `settings`, `profile`, `logs`, `reports`, `cms`, `feedbacks`, `flights`, `inventory`, `office`, `properties`, `financial`

## File Organization

```
├── App.tsx              # Main component with all state and routing
├── types.ts             # All TypeScript interfaces and enums
├── constants.ts         # Mock data and defaults
├── utils.ts             # Utility functions (generateId, formatters)
├── services/
│   ├── firebase.ts      # Firebase initialization
│   ├── storage.ts       # Firestore data layer
│   ├── staysService.ts  # Stays.net API integration
│   └── geminiService.ts # Google Gemini AI integration
├── components/          # Feature components (22 total)
│   ├── TabletApp.tsx    # Kiosk mode for guest self-service
│   ├── CalendarView.tsx # Calendar visualization
│   └── ...
└── vite.config.ts       # Vite build configuration
```

## Conventions

- Language: Portuguese (pt-BR) for UI strings and comments
- Styling: Tailwind CSS with custom `brand-*` color classes
- Icons: Lucide React
- Charts: Recharts
- Date handling: ISO strings for storage, localized display with `toLocaleDateString('pt-BR')`

## Firebase Collections Schema

Tickets, reservations, and other entities use Firestore document IDs as their `id` field. The `storageService` strips the `id` before writing and adds it back when reading from snapshots.

🔒 REGRA OBRIGATÓRIA — LEIA COM ATENÇÃO

É estritamente proibido remover, alterar ou substituir qualquer integração de dados proveniente da API:
https://stays-api.onrender.com

Todo e qualquer dado que seja fornecido por essa API deve continuar sendo obtido exclusivamente dela, sem exceções.

Em hipótese alguma dados oriundos da API Stays (Render) podem ser:

Substituídos por dados do Firebase

Replicados no Firebase

Simulados, mockados ou recriados por qualquer outra fonte

O Firebase só pode ser utilizado exclusivamente para campos, informações ou funcionalidades que NÃO existam ou NÃO sejam retornadas pela API https://stays-api.onrender.com
.

Caso um dado exista na API Stays, ele deve obrigatoriamente continuar vindo dela, mesmo que exista dado semelhante no Firebase.

⚠️ Qualquer violação dessa regra é considerada incorreta.
