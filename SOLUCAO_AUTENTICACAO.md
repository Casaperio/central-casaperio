# 🔧 Solução para Erro de Autenticação (401 Unauthorized)

## ✅ Status: Backend funcionando perfeitamente!

Executei testes e confirmei que o **stays-api está funcionando corretamente**:

```bash
✅ Health OK
✅ Sync Status OK (com API key)
✅ Reference Data OK (19 categorias, 486 itens, 4 condições)
✅ Autenticação funcionando (retorna 401 sem API key como esperado)
```

## 🔍 Diagnóstico do Problema

O erro "HTTP 401: Unauthorized" acontece porque:

1. ✅ O **backend (stays-api)** está rodando corretamente
2. ✅ O **MongoDB** tem dados (509 documentos)
3. ✅ A **API Key** está configurada em ambos os lados
4. ❌ O **frontend** não está conseguindo se comunicar com o proxy Vite

## 🛠️ Solução Passo a Passo

### 1. REINICIE o Frontend

**IMPORTANTE**: Você PRECISA reiniciar o servidor Vite para que as mudanças no `vite.config.ts` tenham efeito!

```bash
# Pare o servidor atual (Ctrl+C)
# Depois reinicie:
cd /Volumes/DouglasNvme/Documents/GitHub/casape/centralcasape2
npm run dev
```

### 2. Verifique as Variáveis de Ambiente

Confirme que o arquivo `.env` tem a API key:

```bash
cd /Volumes/DouglasNvme/Documents/GitHub/casape/centralcasape2
cat .env | grep VITE_API_KEY
```

Deve retornar:
```
VITE_API_KEY=c04d89b3d57aebfa9f81942d39984773
```

Se não tiver, adicione essa linha no `.env`:
```bash
echo "VITE_API_KEY=c04d89b3d57aebfa9f81942d39984773" >> .env
```

### 3. Verifique se o stays-api está rodando

```bash
curl http://localhost:3001/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"...","uptime":...}
```

Se não funcionar, inicie o stays-api:
```bash
cd /Volumes/DouglasNvme/Documents/GitHub/casape/stays-api
npm run dev
```

### 4. Execute o Script de Teste

```bash
cd /Volumes/DouglasNvme/Documents/GitHub/casape/centralcasape2
./test-api-connection.sh
```

Todos os 4 testes devem passar com ✅.

### 5. Teste no Navegador

Após reiniciar o frontend:

1. Abra `http://localhost:5173` (ou a porta que o Vite mostrar)
2. Faça login como Admin
3. Vá para **Gestão de Inventário**
4. Clique em **🧪 Testar API**
5. Clique em **Executar Testes**

**Resultado esperado**: Todos os 5 testes devem passar!

## 📊 O que já está funcionando no Backend

O MongoDB já tem dados sincronizados da Stays.net:

```
Coleções MongoDB:
├─ inventory_reference_categories: 19 documentos
├─ inventory_reference_items: 486 documentos
├─ inventory_reference_conditions: 4 documentos
└─ inventory_reference_amenities: 0 documentos (precisa sincronizar)
```

## 🔄 Como Sincronizar Amenidades

Depois que os testes passarem, você pode:

### Opção 1: Via Interface (Recomendado)
1. Clique em **Sincronizar Agora** no painel "Sincronização Stays.net"
2. Aguarde ~30-60 segundos
3. Veja as estatísticas atualizadas

### Opção 2: Via cURL
```bash
curl -X POST -H "X-API-Key: c04d89b3d57aebfa9f81942d39984773" \
  http://localhost:3001/api/v1/inventory/sync-stays-data
```

## 🐛 Problemas Comuns

### Erro: "Unexpected token '<', '<!DOCTYPE '... is not valid JSON"

**Causa**: O proxy do Vite está retornando HTML ao invés de JSON
**Solução**:
1. Pare o frontend (Ctrl+C)
2. Reinicie com `npm run dev`
3. O Vite precisa recarregar o `vite.config.ts`

### Erro: "Failed to fetch"

**Causa**: stays-api não está rodando
**Solução**:
```bash
cd stays-api
npm run dev
```

### Erro: "HTTP 401: Unauthorized"

**Causa 1**: Frontend não reiniciado após mudanças no vite.config.ts
**Solução**: Reinicie o frontend

**Causa 2**: VITE_API_KEY não está no .env
**Solução**: Adicione ao .env e reinicie

**Causa 3**: API Key errada
**Solução**: Confirme que ambos usam `c04d89b3d57aebfa9f81942d39984773`

### Erro: "Connection refused"

**Causa**: MongoDB não está rodando
**Solução**:
```bash
mongod
# ou
docker run -d -p 27017:27017 mongo
```

## 📁 Arquivos Modificados

1. ✅ **vite.config.ts** - Configuração do proxy com logs de debug
2. ✅ **inventoryApiService.ts** - Já envia X-API-Key header
3. ✅ **InventoryDataTest.tsx** - Componente de teste criado
4. ✅ **InventoryPanel.tsx** - Botão "🧪 Testar API" adicionado

## 🎯 Checklist Final

Antes de testar no navegador, confirme:

- [ ] stays-api rodando em `localhost:3001`
- [ ] MongoDB rodando em `localhost:27017`
- [ ] `.env` do stays-api tem `API_KEY=c04d89b3d57aebfa9f81942d39984773`
- [ ] `.env` do frontend tem `VITE_API_KEY=c04d89b3d57aebfa9f81942d39984773`
- [ ] Frontend REINICIADO após mudanças no vite.config.ts
- [ ] Script `./test-api-connection.sh` passou todos os testes

## 🚀 Próximos Passos Após Resolver

Quando tudo estiver funcionando:

1. **Sincronizar Amenidades**:
   - Clicar em "Sincronizar Agora"
   - Aguardar finalização
   - Verificar que amenities > 0

2. **Testar Autocomplete**:
   - Criar novo item
   - Digitar no campo nome
   - Ver sugestões da Stays.net

3. **Testar Property Amenities**:
   - Selecionar propriedade no filtro
   - Ver seção de amenidades aparecer

4. **Validar Dados**:
   - Verificar MongoDB:
     ```bash
     mongosh
     use casape
     db.inventory_reference_amenities.countDocuments()
     db.inventory_reference_amenities.findOne()
     ```

## 💡 Dica Final

Se mesmo após reiniciar tudo ainda não funcionar:

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Abra uma aba anônima
3. Verifique o console do navegador (F12) para erros
4. Verifique o terminal do Vite para ver os logs do proxy

O proxy do Vite agora tem logs detalhados que mostrarão:
```
Sending Request to the Target: GET /api/v1/inventory/sync-status
Received Response from the Target: 200 /api/v1/inventory/sync-status
```

Se ver "401" na resposta, significa que o header X-API-Key não está sendo enviado corretamente.
