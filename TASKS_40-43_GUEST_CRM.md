# Tasks 40-43: Guest & CRM - Indicadores e Persistência ✅

## Implementação Concluída

### Arquivos Modificados

1. **`types.ts`**
   - Adicionado campos `maintenanceSeenBy` e `maintenanceSeenAt` ao tipo `ReservationOverrides`
   - Suporte para persistir status de manutenção visto

2. **`components/ReservationDetailModal.tsx`**
   - **Task 41**: Implementado salvamento de status "Visto" no Firestore
   - Estado `maintenanceSeenBy` e `maintenanceSeenAt` agora persiste nos overrides
   - Função `handleMaintenanceAck` atualizada para salvar no Firestore
   - Carrega status visto dos overrides ao abrir o modal
   - Modal mostra "Visto por [nome] em [data]" após marcar
   
3. **`components/GuestCRM.tsx`**
   - **Task 40**: Tag "DOCS" vermelha quando documentação incompleta
   - **Task 40**: Tag "Docs OK" verde quando ambos checkbox marcados
   - **Task 41**: Indicador "NÃO VISTO" amarelo / "Ciente" verde no card
   - **Task 42**: Tags Early Check-in (laranja → verde se concedido)
   - **Task 42**: Tags Late Check-out (laranja → verde se concedido)
   - **Task 43**: Ícone de bebê quando "Possui Criança" marcado
   - Hook customizado para carregar overrides de todas reservas
   - Importado ícones: `FileCheck`, `CheckCircle2`, `Baby`, `AlertCircle`, `LogIn`, `LogOut`

---

## Tasks Implementadas

### ✅ Task 40 — Tag "DOCS" no Card

**Lógica:**
- Verifica `docsSent` E `docsSentToBuilding` (ambos devem estar `true`)
- Prioriza valores dos overrides, fallback para valores da reserva

**Exibição no Card:**
- **Incompleto**: Tag vermelha "DOCS"
- **Completo**: Tag verde "Docs OK" com ícone ✓

**Código:**
```typescript
const docsSent = override?.docsSent ?? res.docsSent ?? false;
const docsSentToBuilding = override?.docsSentToBuilding ?? res.docsSentToBuilding ?? false;
const docsComplete = docsSent && docsSentToBuilding;
```

---

### ✅ Task 41 — Persistir "Status Manutenção: Visto por X"

**Implementação:**
- Campos `maintenanceSeenBy` e `maintenanceSeenAt` salvos no Firestore
- Função `handleMaintenanceAck` salva no override E atualiza o objeto reserva (compatibilidade)
- Modal carrega status dos overrides ao abrir

**Modal:**
- Mostra "Visto por [Nome] em [Data]" quando `maintenanceSeenAt` existe
- Botão "Marcar Visto" fica oculto após marcar

**Card:**
- Tag amarela "NÃO VISTO" quando não foi visto
- Tag verde "Ciente" quando já foi visto
- Visível apenas para roles que não são "Guest Relations"

**Código:**
```typescript
const maintenanceSeen = override?.maintenanceSeenAt || res.maintenanceAck?.seenAt;
```

---

### ✅ Task 42 — Early Check-in / Late Check-out: Tags no Card

**Lógica:**
- Verifica `earlyCheckIn.requested` e `lateCheckOut.requested`
- Verifica `earlyCheckIn.granted` e `lateCheckOut.granted`

**Exibição:**
- **Solicitado mas não concedido**: Tag laranja "Early [hora]" ou "Late [hora]"
- **Concedido**: Tag verde "Early [hora]" ou "Late [hora]"
- Ícones: `LogIn` para Early, `LogOut` para Late

**Persistência:**
- Já existia no tipo `ReservationOverrides`
- Cards lêem dos overrides com fallback para reserva

**Código:**
```typescript
const earlyCheckIn = override?.earlyCheckIn ?? res.earlyCheckIn;
const lateCheckOut = override?.lateCheckOut ?? res.lateCheckOut;
```

---

### ✅ Task 43 — "Possui Criança": Ícone no Card

**Implementação:**
- Campo `hasChildren` já existia no tipo
- Checkbox no modal já salvava no override

**Exibição:**
- Ícone de bebê (rosa) quando `hasChildren === true`
- Tooltip "Possui Criança"

**Código:**
```typescript
const hasChildren = override?.hasChildren ?? res.hasChildren ?? false;

{hasChildren && (
  <span className="text-[9px] px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded flex items-center gap-0.5" title="Possui Criança">
    <Baby size={10} />
  </span>
)}
```

---

## Fluxo de Dados

### Salvamento (Modal)
1. Usuário marca/desmarca campos no modal
2. Clica em "Salvar Alterações" ou ação específica (ex: "Marcar Visto")
3. `handleSaveChanges` ou `handleMaintenanceAck` salva no Firestore via `storageService.reservationOverrides.set()`
4. Estado local atualizado

### Carregamento (Modal)
1. Modal abre com `reservation` vindo da API Stays
2. `useEffect` busca overrides do Firestore via `storageService.reservationOverrides.get()`
3. Merge dos overrides com valores da reserva (prioridade para overrides)
4. Estados locais atualizados

### Exibição (Card)
1. `GuestCRM` carrega todos overrides das reservas via `useQuery`
2. Para cada card, busca override correspondente no mapa
3. Renderiza indicadores baseado em: `override ?? reservation ?? false`
4. Cache de 2 minutos para performance

---

## Critérios de Aceite - Status

### Task 40 ✅
- [x] Tag "DOCS" vermelha quando incompleto
- [x] Tag "Docs OK" verde quando completo
- [x] Lógica consistente entre modal e card
- [x] Persistência via overrides

### Task 41 ✅
- [x] "Marcar Visto" salva no Firestore
- [x] Modal mostra "Visto por X em data"
- [x] Persistência mantida após reload
- [x] Card reflete status (NÃO VISTO / Ciente)
- [x] Visível apenas para roles apropriados

### Task 42 ✅
- [x] Tag laranja quando solicitado
- [x] Tag verde quando concedido
- [x] Persistência no Firestore
- [x] Card atualiza após salvar modal

### Task 43 ✅
- [x] Ícone de bebê quando marcado
- [x] Persistência no Firestore
- [x] Card atualiza após salvar modal

### Geral ✅
- [x] Não cria/duplica reservas no Firebase
- [x] Firestore apenas para overrides
- [x] `npm run build` sem erros TypeScript
- [x] Atualização reativa (sem reload manual necessário)

---

## Cache e Performance

**Overrides Cache:**
- Query key: `['reservation-overrides', {ids}]`
- Stale time: 2 minutos
- React Query gerencia invalidação automática

**Benefício:**
- Evita múltiplas chamadas ao Firestore
- Cards renderizam rapidamente
- Invalidação automática ao salvar

---

## Estrutura Visual dos Cards

```
┌─────────────────────────────────────────────────┐
│ ● Código Imóvel                                 │
│   [DOCS] [NÃO VISTO] [👶]                      │
│   01/01/2026 - 10/01/2026                       │
│   [Early 10:00] [Late 15:00]                    │
│   📍 Nome do Imóvel                             │
│                                         R$ 5.000│
└─────────────────────────────────────────────────┘
```

**Cores:**
- 🔴 Vermelho: DOCS incompleto
- 🟢 Verde: Completo / Concedido / Ciente
- 🟠 Laranja: Solicitado mas não concedido
- 🟡 Amarelo: NÃO VISTO (manutenção)
- 🩷 Rosa: Possui Criança

---

## Próximos Passos (Opcional)

- [ ] Adicionar filtros no GuestCRM por indicadores (ex: "Só reservas com docs pendentes")
- [ ] Notificação visual quando há alterações não salvas no modal
- [ ] Histórico de mudanças nos overrides (audit log)
- [ ] Bulk actions (marcar múltiplos como visto)

---

## Observações Técnicas

1. **Fallback Chain**: `override ?? reservation ?? defaultValue`
   - Garante compatibilidade com dados antigos
   - Prioridade sempre para overrides

2. **Merge Strategy**: 
   - Modal: merge ao carregar, salva tudo ao persistir
   - Card: leitura read-only dos overrides

3. **Role-based Visibility**:
   - "Guest Relations" não vê indicador de manutenção
   - Outros roles veem todos indicadores

4. **Ícones Lucide-react**:
   - Consistência visual com resto da aplicação
   - Leves e performáticos
