# 🧪 Guia de Teste de Integração Stays.net

## Visão Geral

Este documento explica como testar a integração completa entre:
- **Frontend (centralcasape2)** → **Backend (stays-api)** → **Stays.net API** → **MongoDB**

**IMPORTANTE**: Esta integração **NÃO usa Firebase**. Todos os dados vêm diretamente do stays-api que puxa da Stays.net e salva no MongoDB.

## Arquitetura do Fluxo

```
┌─────────────────────┐
│  centralcasape2     │
│  (Frontend React)   │
└──────────┬──────────┘
           │ HTTP Request via Vite Proxy
           │ /api/v1/inventory/*
           ↓
┌─────────────────────┐
│    stays-api        │
│  (Backend Fastify)  │
└──────────┬──────────┘
           │ StaysApiClient
           │ OAuth2 + API calls
           ↓
┌─────────────────────┐
│   Stays.net API     │
│  (External API)     │
└──────────┬──────────┘
           │ Data returned
           ↓
┌─────────────────────┐
│     MongoDB         │
│  (Database)         │
└─────────────────────┘
```

## Pré-requisitos

### 1. Variáveis de Ambiente - stays-api

Arquivo: `/stays-api/.env`

```bash
# MongoDB
MONGO_URI=mongodb://localhost:27017/casape

# Stays.net API Credentials
STAYS_CLIENT_ID=your_client_id
STAYS_CLIENT_SECRET=your_client_secret
STAYS_BASE_URL=https://casap.stays.net

# Server
PORT=3001
```

### 2. Variáveis de Ambiente - centralcasape2

Arquivo: `/centralcasape2/.env`

```bash
VITE_API_BASE_URL=http://localhost:3001
```

### 3. Serviços Rodando

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: stays-api
cd stays-api
npm run dev

# Terminal 3: centralcasape2
cd centralcasape2
npm run dev
```

## Como Testar

### Teste Rápido com Componente de Teste

1. Acesse o app como **Admin**
2. Navegue para **Gestão de Inventário**
3. Clique no botão **🧪 Testar API**
4. Clique em **Executar Testes**

O componente executará 5 testes automaticamente:

#### ✅ Teste 1: Health Check
- **O que testa**: Conectividade com o stays-api
- **Endpoint**: `GET /health`
- **Sucesso se**: Retornar status 200 e dados do servidor

#### ✅ Teste 2: Reference Data
- **O que testa**: Se os dados de referência estão disponíveis no MongoDB
- **Endpoint**: `GET /api/v1/inventory/reference-data`
- **Sucesso se**: Retornar categorias, itens, condições e amenidades
- **Verifica**: Quantos registros de cada tipo existem

#### ✅ Teste 3: Sync Status
- **O que testa**: Status da última sincronização
- **Endpoint**: `GET /api/v1/inventory/sync-status`
- **Sucesso se**: Retornar informações sobre a última sync
- **Mostra**: Timestamp da última sincronização

#### ✅ Teste 4: Trigger Sync
- **O que testa**: Sincronização completa com Stays.net
- **Endpoint**: `POST /api/v1/inventory/sync-stays-data`
- **O que faz**:
  1. Conecta na Stays.net via OAuth2
  2. Busca categorias via `/external/v1/translation/inventory-categories`
  3. Busca itens via `/external/v1/translation/inventory-items`
  4. Busca condições via `/external/v1/translation/inventory-items-conditions`
  5. Busca amenidades via `/external/v1/translation/listing-amenities`
  6. Busca propriedades via `/external/v1/content/listings`
  7. Salva tudo no MongoDB
  8. Gera sugestões de vinculação amenidade→inventário
- **Sucesso se**: Retornar estatísticas de sync completas
- **Duração**: ~30-60 segundos (dependendo da quantidade de dados)

#### ✅ Teste 5: MongoDB Collections
- **O que testa**: Se os dados foram salvos no MongoDB
- **Endpoint**: `GET /api/v1/inventory/sync-status`
- **Sucesso se**: Retornar contagem de documentos nas coleções
- **Verifica**:
  - `inventory_reference_categories`
  - `inventory_reference_items`
  - `inventory_reference_conditions`
  - `inventory_reference_amenities`

### Teste Manual - Passo a Passo

#### 1. Verificar MongoDB Diretamente

```bash
# Conectar ao MongoDB
mongosh

# Selecionar database
use casape

# Verificar coleções
show collections

# Contar documentos
db.inventory_reference_categories.countDocuments()
db.inventory_reference_items.countDocuments()
db.inventory_reference_conditions.countDocuments()
db.inventory_reference_amenities.countDocuments()

# Ver exemplo de categoria
db.inventory_reference_categories.findOne()

# Ver exemplo de item
db.inventory_reference_items.findOne()

# Ver exemplo de amenidade
db.inventory_reference_amenities.findOne()
```

**Resultado esperado**:
```javascript
// Categoria
{
  _id: ObjectId("..."),
  stays_category_id: "cat_12345",
  names: {
    pt_BR: "Enxoval",
    en_US: "Linen"
  },
  last_synced: ISODate("2025-12-15T...")
}

// Item
{
  _id: ObjectId("..."),
  stays_item_id: "item_67890",
  stays_category_id: "cat_12345",
  names: {
    pt_BR: "Lençol King 400 Fios",
    en_US: "King Sheet 400 Thread"
  },
  last_synced: ISODate("2025-12-15T...")
}

// Amenidade
{
  _id: ObjectId("..."),
  stays_amenity_id: "amenity_123",
  names: {
    pt_BR: "Wi-Fi",
    en_US: "Wi-Fi"
  },
  category: "electronics",
  icon: "Wifi",
  last_synced: ISODate("2025-12-15T...")
}
```

#### 2. Testar Endpoints via cURL

```bash
# Health Check
curl http://localhost:3001/health

# Reference Data
curl http://localhost:3001/api/v1/inventory/reference-data

# Sync Status
curl http://localhost:3001/api/v1/inventory/sync-status

# Trigger Sync
curl -X POST http://localhost:3001/api/v1/inventory/sync-stays-data

# Property Amenities (substitua POP106 pelo código da propriedade)
curl http://localhost:3001/api/v1/inventory/property-amenities/POP106
```

#### 3. Testar Autocomplete no Frontend

1. Acesse **Gestão de Inventário**
2. Clique em **+ Novo Item**
3. Comece a digitar no campo **Nome do Item**
4. Verifique se aparecem sugestões:
   - Itens existentes no seu inventário
   - **Itens do catálogo Stays.net** (com tradução em inglês entre parênteses)
   - **Amenidades** (prefixadas com "Amenidade:")

**Exemplo de sugestões**:
```
Lençol King 400 Fios (King Sheet 400 Thread)
Smart TV 50" (Smart TV 50")
Amenidade: Wi-Fi (Wi-Fi)
Amenidade: Ar-condicionado (Air Conditioning)
```

#### 4. Testar Property Amenities

1. Acesse **Gestão de Inventário**
2. No filtro de propriedade, selecione uma propriedade específica (ex: POP106)
3. Verifique se aparece a seção **Amenidades da Propriedade**
4. Deve mostrar:
   - Nome em português e inglês
   - Categoria (se disponível)
   - Status de vinculação:
     - ✅ **Vinculado** - já existe item de inventário correspondente
     - 💡 **X sugestões** - existem itens sugeridos para vincular
     - ➕ **Criar Item** - nenhum item vinculado ou sugerido

## Troubleshooting

### ❌ Erro: "Failed to fetch"

**Problema**: Frontend não consegue conectar ao stays-api

**Soluções**:
1. Verifique se o stays-api está rodando: `http://localhost:3001/health`
2. Verifique o proxy no `vite.config.ts`:
   ```typescript
   proxy: {
     '/api/v1': {
       target: 'http://localhost:3001',
       changeOrigin: true,
     }
   }
   ```

### ❌ Erro: "Unauthorized" ou "401"

**Problema**: Credenciais da Stays.net inválidas

**Soluções**:
1. Verifique o arquivo `.env` do stays-api
2. Confirme que `STAYS_CLIENT_ID` e `STAYS_CLIENT_SECRET` estão corretos
3. Teste manualmente a autenticação:
   ```bash
   curl -X POST https://casap.stays.net/oauth/token \
     -u "CLIENT_ID:CLIENT_SECRET" \
     -d "grant_type=client_credentials"
   ```

### ❌ Erro: "Connection refused" no MongoDB

**Problema**: MongoDB não está rodando

**Soluções**:
1. Inicie o MongoDB: `mongod`
2. Ou use Docker: `docker run -d -p 27017:27017 mongo`
3. Verifique a conexão: `mongosh`

### ❌ Erro: "No data returned" após sync

**Problema**: Stays.net API pode estar offline ou retornando dados vazios

**Soluções**:
1. Verifique os logs do stays-api no terminal
2. Teste manualmente os endpoints da Stays.net:
   ```bash
   # Obter token
   TOKEN=$(curl -s -X POST https://casap.stays.net/oauth/token \
     -u "CLIENT_ID:CLIENT_SECRET" \
     -d "grant_type=client_credentials" | jq -r .access_token)

   # Testar categorias
   curl -H "Authorization: Bearer $TOKEN" \
     https://casap.stays.net/external/v1/translation/inventory-categories
   ```

### ❌ Erro: Import paths não encontrados

**Problema**: Componentes não encontrados

**Solução**: Verifique os paths no InventoryPanel.tsx:
```typescript
import { useInventoryReference } from '../src/hooks/useInventoryReference';
import { InventorySyncPanel } from '../src/components/InventorySyncPanel';
import { PropertyAmenitiesSection } from '../src/components/PropertyAmenitiesSection';
import { InventoryDataTest } from '../src/components/InventoryDataTest';
```

## Verificação de Sucesso

✅ **Integração funcionando corretamente se**:

1. ✅ Todos os 5 testes no componente de teste passam com status verde
2. ✅ MongoDB tem documentos nas 4 coleções de referência
3. ✅ Autocomplete mostra sugestões de itens da Stays.net
4. ✅ Seção de amenidades aparece ao selecionar propriedade
5. ✅ Painel de sincronização mostra estatísticas atualizadas
6. ✅ Logs do stays-api mostram "✅ Comprehensive sync complete"

## Logs Importantes

### stays-api logs (esperados durante sync):

```
📥 Starting comprehensive Stays.net sync...
📥 Syncing amenities from Stays.net...
✅ Synced 150 amenities (150 new, 0 updated)
📥 Syncing property amenities...
✅ Updated 10 properties with amenities
📥 Generating amenity suggestions...
✅ Comprehensive sync complete in 45.32s
```

### MongoDB logs (esperados):

```javascript
// Após primeira sync
db.inventory_reference_categories.countDocuments()  // ~50
db.inventory_reference_items.countDocuments()       // ~2500
db.inventory_reference_conditions.countDocuments()  // ~10
db.inventory_reference_amenities.countDocuments()   // ~150
```

## Próximos Passos

Após validar que tudo está funcionando:

1. **Adicionar mais funcionalidades**:
   - Botão "Criar Item" nas amenidades que cria item automaticamente
   - Vincular amenidades existentes a itens do inventário
   - Export de relatórios multilíngue

2. **Otimizações**:
   - Cache dos dados de referência no frontend
   - Sincronização incremental (apenas dados novos/modificados)
   - Sync automática agendada (cron job)

3. **Produção**:
   - Configurar variáveis de ambiente de produção
   - Agendar syncs periódicas (ex: 1x por dia)
   - Monitorar logs de sincronização
   - Adicionar alertas para falhas de sync
