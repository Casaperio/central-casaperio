
# 🎯 PROMPT PARA CLAUDE CODE - INTEGRAÇÃO FINANCEIRA STAYS.NET

## 📋 CONTEXTO

Preciso integrar dados financeiros da API do Stays.net no meu sistema. Tenho dois projetos:
- **Backend:** `stays-api` (Node.js/Express - assumo que seja isso, ajuste se for diferente)
- **Frontend:** `centralcasape2` (React/Vue/Angular - ajuste conforme seu stack)

## 🎯 OBJETIVO

Criar endpoints no backend que consumam a API do Stays.net e retornem dados financeiros de reservas, e conectar esses endpoints ao painel financeiro do frontend.

## 📊 DADOS QUE PRECISAM SER PUXADOS DA API STAYS.NET

A API retorna um JSON com estas informações (baseado na documentação):

```json
{
  "_id": "5fd9f8c88223294d2d247363",
  "id": "MI01G",
  "type": "reserved",
  "currency": "BRL",
  "checkInDate": "2020-12-16",
  "checkOutDate": "2020-12-16",
  "pricePerNight": 150,           // → Valor por noite
  "reserveTotal": 600,            // → Total da reserva
  "baseAmountForwarding": 600,    // → Base de cálculo do Imp
  "sellPriceCorrected": 600,      // → Preço de venda corrigido
  "companyCommision": 0,          // → Comissão da empresa
  "buyPrice": 600,                // → Preço de compra
  "totalForwardFee": 0,           // → Total de taxas
  "fee": [{ "val": 150 }],        // → Taxa de Limpeza (e outras)
  "ownerFee": [],                 // → Taxas do proprietário
  "listing": {
    "id": "LZ02G",
    "internalName": "API Listing 001"
  },
  "client": {
    "name": "Jessica Santos",
    "firstName": "Jessica",
    "lastName": "Santos",
    "email": "noreply@stays.com.br"
  }
}
```

## 🏗️ ARQUITETURA ESPERADA

### **BACKEND (stays-api)**

1. **Configuração da API:**
   - Criar arquivo `.env` com credenciais:
     ```
     STAYS_ENDPOINT=https://play.stays.net
     STAYS_CLIENT_ID=seu_client_id
     STAYS_CLIENT_SECRET=seu_client_secret
     ```

2. **Service Layer:** Criar `services/staysService.js`
   - Autenticação Basic Auth (client_id:client_secret em Base64)
   - Método para buscar reservas: `GET /external/v1/bookings`
   - Método para buscar reservas por período
   - Tratamento de erros e retry logic

3. **Routes:** Criar `routes/financeiro.js`
   - `GET /api/financeiro/reservas` - Lista todas reservas
   - `GET /api/financeiro/reservas?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD` - Filtra por período
   - `GET /api/financeiro/resumo` - Retorna totalizadores (soma de comissões, total de reservas, etc)

4. **Controllers:** Criar `controllers/financeiroController.js`
   - Processar dados da API Stays
   - Calcular totalizadores
   - Formatar resposta para o frontend

5. **Middleware:** 
   - Cache de 5-10 minutos para não sobrecarregar a API do Stays
   - Rate limiting

### **FRONTEND (centralcasape2)**

1. **Service/API Client:** Criar `services/financeiroService.js`
   - Função para buscar reservas do backend
   - Função para buscar resumo financeiro

2. **Componente de Painel Financeiro:**
   - Tabela com colunas:
     - Valor por noite
     - Total da reserva
     - Base de cálculo
     - Preço de venda corrigido
     - Comissão da empresa
     - Preço de compra
     - Taxa de Limpeza
     - Taxas do proprietário
   - Filtros de data (início/fim)
   - Cards de resumo (total de comissões, total de reservas, etc)
   - Loading states e tratamento de erros

3. **State Management:**
   - Se usar Redux/Vuex/Pinia: criar actions/mutations para dados financeiros
   - Se não usar: gerenciar com hooks (useState/useEffect ou equivalente)

## 📝 ESTRUTURA DE PASTAS SUGERIDA

```
stays-api/
├── src/
│   ├── config/
│   │   └── stays.config.js       # Configurações da API Stays
│   ├── services/
│   │   └── staysService.js       # Lógica de integração
│   ├── controllers/
│   │   └── financeiroController.js
│   ├── routes/
│   │   └── financeiro.routes.js
│   ├── middleware/
│   │   └── cache.middleware.js
│   └── utils/
│       └── staysAuth.js          # Helper para autenticação

centralcasape2/
├── src/
│   ├── services/
│   │   └── financeiroService.js  # Client HTTP para backend
│   ├── components/
│   │   ├── PainelFinanceiro/
│   │   │   ├── index.jsx
│   │   │   ├── TabelaReservas.jsx
│   │   │   ├── CardsResumo.jsx
│   │   │   └── Filtros.jsx
│   └── hooks/                    # Se usar React
│       └── useFinanceiro.js
```

## 🔐 AUTENTICAÇÃO STAYS API

```javascript
// Exemplo de autenticação Basic Auth
const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const headers = {
  'Authorization': `Basic ${credentials}`,
  'Content-Type': 'application/json'
};
```

## 🚀 PASSOS DE IMPLEMENTAÇÃO

### **FASE 1: Backend (stays-api)**
1. Instalar dependências necessárias (axios, dotenv, node-cache)
2. Criar estrutura de pastas
3. Implementar `staysService.js` com autenticação
4. Criar endpoints em `financeiro.routes.js`
5. Implementar controllers com lógica de negócio
6. Adicionar cache e rate limiting
7. Testar endpoints com Postman/Insomnia

### **FASE 2: Frontend (centralcasape2)**
8. Criar service para consumir API do backend
9. Criar componentes de UI (tabela, cards, filtros)
10. Implementar state management
11. Adicionar loading states e error handling
12. Estilizar componentes
13. Testar integração completa

### **FASE 3: Refinamento**
14. Adicionar paginação na tabela
15. Adicionar export para Excel/CSV
16. Adicionar gráficos (opcional)
17. Otimizar performance
18. Adicionar testes

## ⚠️ CONSIDERAÇÕES IMPORTANTES

1. **Rate Limits:** A API do Stays pode ter limites de requisições - implementar cache
2. **Autenticação:** Nunca expor credenciais no frontend - sempre via backend
3. **Datas:** Usar formato ISO 8601 (YYYY-MM-DD)
4. **Moeda:** Considerar formatação BRL (R$ 1.234,56)
5. **Timeout:** Configurar timeout de 30s para requisições à API Stays
6. **Retry Logic:** Implementar retry com backoff exponencial em caso de falha

## 📚 REFERÊNCIAS

- Documentação Stays: https://stays.net/external-api/
- Endpoint de reservas: `/external/v1/bookings`
- Autenticação: Basic Auth com client_id:client_secret

## 🎯 RESULTADO ESPERADO

Ao final, devo ter:
- ✅ Backend consumindo API Stays com cache
- ✅ Endpoints REST documentados
- ✅ Frontend exibindo dados em painel financeiro
- ✅ Filtros funcionando (data início/fim)
- ✅ Cards de resumo com totalizadores
- ✅ Tratamento de erros adequado

---

## 💡 PROMPT RESUMIDO PARA PLAN MODE

Por favor, analise este projeto e crie um plano detalhado para:

1. Integrar a API do Stays.net no backend `stays-api`
2. Criar endpoints REST para dados financeiros de reservas
3. Implementar cache e rate limiting
4. Criar componentes no frontend `centralcasape2` para exibir esses dados em painel financeiro
5. Conectar frontend ao backend com tratamento de erros

Siga a arquitetura e estrutura de pastas sugeridas acima. Implemente FASE por FASE, testando cada etapa antes de prosseguir.

---