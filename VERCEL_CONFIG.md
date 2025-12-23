# Configuração do Vercel para Produção

## Problema Identificado

A aplicação em produção (`https://centralcasape2.vercel.app`) estava tentando chamar `http://localhost:3001`, resultando em erros CORS:

```
Access to fetch at 'http://localhost:3001/api/v1/inventory/reference-data'
from origin 'https://centralcasape2.vercel.app' has been blocked by CORS policy
```

## Causa Raiz

O código já tem fallback correto:
```typescript
const API_URL = import.meta.env.DEV
  ? '' // Usa Vite proxy em dev
  : (import.meta.env.VITE_API_BASE_URL || 'https://stays-api.onrender.com');
```

Mas durante o build do Vercel, se `VITE_API_BASE_URL` não estiver configurado nas variáveis de ambiente, o Vite pode estar usando valores incorretos.

## Solução

### 1. Variáveis de Ambiente no Vercel

Configure no dashboard do Vercel (Settings → Environment Variables):

```bash
VITE_API_BASE_URL=https://stays-api.onrender.com
VITE_API_KEY=c04d89b3d57aebfa9f81942d39984773
```

**Importante**: Estas variáveis devem ser configuradas para o ambiente de **Production**.

### 2. Arquivo .env Local

Para desenvolvimento local:

```bash
# .env (não commitado no Git)
VITE_API_BASE_URL=http://localhost:3001  # Usa proxy Vite em dev
VITE_API_KEY=c04d89b3d57aebfa9f81942d39984773
```

**Nota**: O arquivo `.env` está em `.gitignore` e NÃO deve ser commitado.

### 3. Como o Proxy Vite Funciona

Em desenvolvimento (`npm run dev`):
- `import.meta.env.DEV` = `true`
- `API_URL` = `''` (string vazia)
- Requisições para `/api/v1/*` são redirecionadas para `https://stays-api.onrender.com` pelo proxy Vite (vite.config.ts)

Em produção (build do Vercel):
- `import.meta.env.DEV` = `false`
- `API_URL` = `import.meta.env.VITE_API_BASE_URL` || `'https://stays-api.onrender.com'`
- Requisições vão diretamente para a API de produção

### 4. Verificação Pós-Deploy

Após fazer deploy no Vercel:

1. Abra DevTools → Console
2. Verifique se há erros de CORS
3. Vá para Network tab e procure por chamadas para `localhost` (não devem existir)
4. Todas as chamadas API devem ir para `https://stays-api.onrender.com`

### 5. Teste de Integração

Use o componente `InventoryDataTest` para verificar a conexão:

```typescript
// Componente já existente em src/components/InventoryDataTest.tsx
// Testa: Health Check, Reference Data, Sync Status, Trigger Sync
```

## Arquivos Afetados

Todos estes arquivos já usam o padrão correto de API_URL:

- `services/staysApiService.ts` ✅
- `services/inventoryApiService.ts` ✅
- `services/propertiesApiService.ts` ✅
- `src/hooks/useInventoryReference.ts` ✅
- `src/components/InventoryDataTest.tsx` ✅
- `src/components/PropertyAmenitiesSection.tsx` ✅
- `src/components/InventorySyncPanel.tsx` ✅

## Como Testar Localmente Antes do Deploy

```bash
# 1. Build de produção local
npm run build

# 2. Preview da build de produção
npm run preview

# 3. Verificar se está usando a URL correta
# Abra DevTools → Network e veja se chamadas vão para stays-api.onrender.com
```

## Troubleshooting

### Ainda vejo localhost nos logs?
- Verifique se as variáveis estão configuradas no Vercel
- Faça um novo deploy após configurar as variáveis
- Limpe o cache do navegador

### CORS ainda está bloqueando?
- Verifique se o backend `stays-api` permite requests de `centralcasape2.vercel.app`
- Confirme que o backend está rodando em `https://stays-api.onrender.com`

### Build do Vercel falhou?
- Verifique se todas as variáveis obrigatórias estão configuradas
- Firebase e Stays.net também precisam de credenciais configuradas
