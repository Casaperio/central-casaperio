# CLAUDE.md

Este arquivo fornece orientações para o Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Visão Geral do Projeto

**Casapē** é um monorepo contendo duas aplicações interconectadas para gestão de propriedades na Casapē Boutique de Imóveis (empresa de aluguel por temporada no Rio de Janeiro):

- **casape-api**: API backend que sincroniza dados de reservas do Stays.net para MongoDB e fornece endpoints unificados
- **central-casaperio**: Hub de operações frontend em React para gerenciar manutenção, reservas, inventário e operações de escritório

## Estrutura do Repositório

```
casape/
├── casape-api/          # API Backend (Node.js/Fastify/MongoDB)
└── central-casaperio/   # Aplicação Frontend (React/TypeScript/Vite/Firebase)
```

## Comandos de Desenvolvimento

### API Backend (casape-api)

```bash
cd casape-api
npm run dev              # Inicia servidor de desenvolvimento com tsx watch
npm run build            # Compila TypeScript para dist/
npm start                # Executa build de produção
npm run sync             # Sincronização manual do Stays.net
npm run test:add-reservation    # Adiciona reserva de teste no MongoDB
npm run test:check-reservation  # Verifica reserva de teste
```

**Endpoints principais:**
- `GET /health` - Verificação de saúde (sem autenticação)
- `GET /api/v1/dashboard` - Dados do dashboard (autenticação obrigatória)
- `GET /api/v1/calendar` - Dados do calendário (autenticação obrigatória)
- `POST /api/v1/sync/trigger` - Dispara sincronização manual (autenticação obrigatória)

### Frontend (central-casaperio)

```bash
cd central-casaperio
npm run dev              # Inicia servidor de desenvolvimento Vite
npm run build            # Build de produção (tsc && vite build)
npm run preview          # Preview do build de produção
npm run test             # Executa testes unitários vitest
npm run test:coverage    # Executa testes com cobertura
npm run test:e2e         # Executa testes e2e Playwright
npm run test:e2e:ui      # Executa Playwright com interface
```

## Arquitetura

### API Backend (casape-api)

**Stack Tecnológico:** Fastify, MongoDB Atlas, TypeScript, node-cron

**Fluxo de Dados:**
```
Stays.net API (OAuth2)
    ↓ (sincronização via cron a cada 3 min)
MongoDB Atlas Collections
    ├── stays_unified_bookings
    ├── stays_unified_listings
    └── sync_status
    ↓ (REST API com autenticação via API key)
Frontend (polling via React Query)
```

**Serviços Principais:**
- `StaysApiClient.ts` - Cliente OAuth2 para API Stays.net
- `SyncService.ts` - Sincronização de reservas com limitação de taxa (p-queue)
- `PropertySyncService.ts` - Sincronização de propriedades/listagens (diariamente às 3h)
- `ClientEnrichmentService.ts` - Enriquece reservas com dados demográficos de hóspedes
- `UnifiedService.ts` - Combina dados do MongoDB + Firebase

**Autenticação:** Todas as rotas `/api/v1/*` requerem header `x-api-key` correspondente ao `API_KEY` do `.env`

**Jobs Agendados:**
1. Sincronização de reservas: A cada 3 minutos (configurável via `SYNC_INTERVAL_MINUTES`)
2. Sincronização de propriedades: Diariamente às 3h
3. Intervalo de datas: ±365 dias (configurável via `SYNC_DATE_RANGE_DAYS`)

### Frontend (central-casaperio)

**Stack Tecnológico:** React 18, TypeScript, Vite, Tailwind CSS, Firebase, React Query

**Gerenciamento de Estado:**
- `App.tsx` único gerencia todo o estado global
- Subscrições em tempo real do Firebase para tickets, usuários, propriedades, etc.
- React Query para polling da API Stays (intervalos de 5 minutos)
- Fluxo de dados baseado em props (sem Redux/Zustand)

**Fontes de Dados:**
1. **Stays API** (`https://stays-api.onrender.com`) - Fonte primária de dados de reservas/propriedades
2. **Firebase Firestore** - Dados complementares não disponíveis na API Stays (tickets, inventário, operações de escritório)

**Regra Crítica:**
🔒 **NUNCA substitua, remova ou duplique dados da API Stays no Firebase.** Todos os dados de reservas/propriedades DEVEM vir exclusivamente da API Stays. O Firebase é apenas para dados que NÃO existem na API Stays.

**Coleções Principais (Firebase):**
- `tickets` - Solicitações de manutenção
- `users` - Membros da equipe com controle de acesso a módulos
- `inventory_items`, `inventory_transactions` - Gestão de estoque
- `office_deliveries`, `office_supplies`, `office_assets`, `office_shifts` - Operações de escritório
- `tips`, `feedbacks`, `monitoredFlights`, `logs` - Diversos

**Sistema de Módulos:**
Acesso do usuário controlado pelo array `allowedModules` no tipo `User`:
- `maintenance` - Gestão de tickets
- `guest` - Relações com hóspedes/CRM
- `reservations` - Visualizações de calendário
- `inventory` - Controle de estoque
- `office` - Entregas, suprimentos, turnos
- `tablet` - Modo quiosque para propriedades

**Integrações Externas:**
- **Stays.net API** - Dados de reservas/propriedades via `services/staysService.ts` (usa proxy CORS)
- **Google Gemini AI** - Análise de tickets e rastreamento de voos via `services/geminiService.ts`

## Variáveis de Ambiente

### casape-api/.env

```bash
PORT=3001
NODE_ENV=development
API_KEY=sua_api_key_para_autenticacao

# MongoDB Atlas
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/?appName=Cluster-casape
MONGODB_DB_NAME=stays_api

# API Stays.net
STAYS_API_BASE_URL=https://casap.stays.net
STAYS_CLIENT_ID=seu_client_id
STAYS_CLIENT_SECRET=seu_client_secret

# Configuração de Sincronização
SYNC_INTERVAL_MINUTES=3
SYNC_DATE_RANGE_DAYS=365
```

### central-casaperio/.env

```bash
# Google Gemini AI
VITE_GEMINI_API_KEY=sua_gemini_api_key

# Configuração Firebase
VITE_FIREBASE_API_KEY=sua_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id

# API Stays.net
VITE_STAYS_CLIENT_ID=seu_stays_client_id
VITE_STAYS_CLIENT_SECRET=seu_stays_client_secret
VITE_STAYS_BASE_URL=https://sua_conta.stays.net/api/v1
VITE_STAYS_AUTH_URL=https://sua_conta.stays.net/oauth/token
```

## Convenções

- **Idioma:** Português (pt-BR) para strings de UI, comentários e nomes de variáveis
- **Estilização:** Tailwind CSS com classes customizadas `brand-*`
- **Ícones:** Lucide React
- **Gráficos:** Recharts
- **Manipulação de Datas:** Strings ISO para armazenamento, `toLocaleDateString('pt-BR')` para exibição
- **Nomenclatura de Arquivos:** PascalCase para componentes (`.tsx`), camelCase para serviços (`.ts`)

## Arquivos Principais

### Backend (casape-api)
- `src/index.ts` - Ponto de entrada, inicia servidor e agendadores
- `src/server.ts` - Configuração Fastify com CORS e tratamento de erros
- `src/jobs/scheduler.ts` - Jobs cron para sincronização de reservas/propriedades
- `src/services/stays/StaysApiClient.ts` - Cliente da API Stays.net
- `src/services/sync/SyncService.ts` - Lógica principal de sincronização de reservas
- `src/middleware/auth.ts` - Autenticação via API key

### Frontend (central-casaperio)
- `App.tsx` - Componente principal com todo o estado e lógica de roteamento
- `types.ts` - Todas as interfaces TypeScript (Ticket, Reservation, Property, etc.)
- `services/storage.ts` - Camada de dados Firestore com padrão de subscrição
- `services/staysService.ts` - Integração com API Stays.net
- `services/geminiService.ts` - Integração com Google Gemini AI
- `components/TabletApp.tsx` - Modo quiosque para autoatendimento de hóspedes

## Testes

### Backend
Fluxo de teste de reservas:
```bash
cd casape-api
npm run test:add-reservation      # Adiciona reserva de teste no MongoDB
npm run test:check-reservation    # Verifica se foi adicionada
```

### Frontend
```bash
cd central-casaperio
npm run test              # Testes unitários (vitest)
npm run test:coverage     # Relatório de cobertura
npm run test:e2e          # Testes E2E (Playwright)
npm run test:e2e:ui       # Modo UI do Playwright
```

## Notas de Deploy

- **Backend:** Deploy no Render.com em `https://stays-api.onrender.com`
- **Frontend:** Deploy no Vercel
- **MongoDB:** Cluster gratuito no Atlas
- **Firebase:** Plano gratuito Spark com autenticação anônima habilitada
