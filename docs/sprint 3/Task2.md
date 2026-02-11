# Task 2 — Adicionar data/hora de Check-in e Check-out nos cards/modais de Manutenção

## Contexto

Hoje o sistema já exibe **check-in/check-out** no card de Guest. O cliente quer a mesma informação também no contexto de **Manutenção**, nos cards/modais relacionados à reserva do chamado.

## O que precisa ser feito

- Identificar de onde vem a data/hora de **check-in** e **check-out** (ex.: dados da reserva pela Stays).
- Exibir em **Manutenção** (onde fizer sentido e já houver o card/modal do chamado):
  - (Ícone de check-in) `dd/mm/aaaa HH:mm`
  - (Ícone de check-out) `dd/mm/aaaa HH:mm`
- A informação deve aparecer **somente** quando o chamado estiver claramente associado a uma reserva/estadia.
- Regras de formatação:
  - Sempre mostrar **data + hora** (não apenas a data).
  - Respeitar timezone/padrão do app.
- Fallback:
  - Se não existir reserva vinculada ou dados faltarem, não quebrar UI (mostrar “—” ou ocultar bloco).

## Critérios de aceite

- [ ] Cards e/ou modal de Manutenção exibem **check-in e check-out com hora** quando houver dados.
- [ ] Formato consistente (`dd/mm/aaaa HH:mm`) e com ícones.
- [ ] Não quebra chamados sem reserva vinculada (fallback ok).
- [ ] Não aumenta o tempo de carregamento de Manutenção (reusar dados já carregados quando possível).
---

##  Implementação (preencher ao finalizar)

### **Causa/Contexto técnico:**

O sistema já exibia check-in/check-out no módulo **Guest & CRM**, mas o módulo **Manutenção** não mostrava essas informações **no modal de detalhes** dos chamados, mesmo quando havia uma reserva vinculada ao ticket. A primeira implementação (incorreta) havia adicionado essas informações apenas nos **cards** da lista de manutenção, quando o requisito era exibi-las **no modal** (tela que abre ao clicar no card).

Os dados de check-in/check-out (data + hora) já estavam disponíveis na interface `Reservation` (`checkInDate`, `checkInTime`, `checkOutDate`, `checkOutTime`), e os tickets podiam estar vinculados a reservas através do campo `reservationId`.

### **Solução aplicada:**

#### **1. Remoção da implementação incorreta (nos cards):**

Removido do arquivo `MaintenanceView.tsx`:
- Import de `useMemo`, `LogIn`, e `formatDateTimeCheckIn`
- `useMemo` que criava `ticketReservationMap` (Map<string, Reservation>)
- Bloco de exibição de check-in/check-out no **modo Cards** (linhas 421-437)
- Bloco de exibição de check-in/check-out no **modo Lista** (linhas 580-597)

#### **2. Implementação correta (no modal):**

**Arquivo `TicketDetailModal.tsx`:**
- Adicionado import `Reservation` de `types` e `LogIn` de `lucide-react`
- Adicionado import `formatDateTimeCheckIn` de `utils`
- Adicionada prop `staysReservations?: Reservation[]` na interface `TicketDetailModalProps`
- Criada função helper `getReservationForTicket()` com **estratégia dupla de busca**:
  - **Estratégia 1 (direta)**: Se `ticket.reservationId` existir, busca por match de `reservation.id` ou `reservation.externalId`
  - **Estratégia 2 (fallback inteligente)**: Se não encontrar por ID, busca por:
    - Same `propertyCode`
    - Data do ticket (`desiredDate` ou `createdAt`) dentro do período check-in → check-out (+1 dia de margem)
    - Prioriza reservas com status `Check-in` / `CHECKIN` (IN-HOUSE)
    - Se não houver IN-HOUSE, prioriza `Confirmada` / `CONFIRMED`
    - Retorna a primeira encontrada ou `null`

**Bloco de exibição no modal:**
- Posicionado logo **após os badges** (prioridade, serviço, entrada autorizada, etc.) e **antes da seção "Descrição do Problema"**
- Layout visual:
  - Card com gradiente azul/indigo (`bg-gradient-to-r from-blue-50 to-indigo-50`)
  - Título "Estadia" com ícone de calendário
  - Grid responsivo (1 coluna no mobile, 2 colunas no desktop)
  - **Check-in**: card branco com borda verde, ícone LogIn em círculo verde, texto formatado `dd/mm/yyyy HH:mm`
  - **Check-out**: card branco com borda laranja, ícone LogOut em círculo laranja, texto formatado `dd/mm/yyyy HH:mm`
- Fallback: Se não houver reserva vinculada ou dados faltarem, nada é exibido (bloco inteiro oculto)

#### **3. Propagação das props através da cadeia de componentes:**

**App.tsx:**
- Adicionada prop `staysReservations={staysReservations}` ao componente `<TicketModals>`

**TicketModals.tsx:**
- Adicionada prop `staysReservations?: Reservation[]` na interface `TicketModalsProps`
- Adicionado parâmetro `staysReservations = []` na desestruturação das props
- Passada prop `staysReservations={staysReservations}` para `<TicketDetailModal>`

### **Arquivos alterados:**

- **Modificados:**
  - `components/views/MaintenanceView.tsx`: 
    - Removidos imports: `useMemo`, `LogIn`, `formatDateTimeCheckIn`
    - Removido `ticketReservationMap` (useMemo)
    - Removida exibição de check-in/check-out nos cards (modo cards e lista)
  
  - `components/TicketDetailModal.tsx`:
    - Adicionados imports: `Reservation` (types), `LogIn` (lucide-react), `formatDateTimeCheckIn` (utils)
    - Adicionada prop `staysReservations?: Reservation[]`
    - Criada função helper `getReservationForTicket()`
    - Adicionado bloco de exibição de check-in/check-out no modal (após badges, antes de "Descrição do Problema")
  
  - `components/modals/TicketModals.tsx`:
    - Adicionada prop `staysReservations?: Reservation[]` na interface e parâmetros
    - Passada prop para `<TicketDetailModal>`
  
  - `App.tsx`:
    - Passada prop `staysReservations={staysReservations}` para `<TicketModals>`

### **Regras/Helpers criados ou ajustados:**

- **Função helper `getReservationForTicket()` (estratégia dupla)**:
  - **Estratégia 1 - Busca direta por ID**:
    - Se `ticket.reservationId` existir, busca por match de `reservation.id` **ou** `reservation.externalId`
    - Retorna imediatamente se encontrar
  
  - **Estratégia 2 - Busca fallback inteligente** (quando não há `reservationId` ou não encontrou):
    - Filtra reservas pela mesma `propertyCode`
    - Verifica se a data do ticket está dentro do período de estadia:
      - Usa `ticket.desiredDate` ou `ticket.createdAt` como referência
      - Compara com `checkInDate` ≤ data ≤ `checkOutDate` (+1 dia de margem)
    - **Priorização automática**:
      1. Reservas com status `Check-in` ou `CHECKIN` (IN-HOUSE)
      2. Reservas com status `Confirmada` ou `CONFIRMED`
      3. Primeira reserva encontrada que atenda aos critérios
    - Retorna a reserva mais relevante ou `null`
  
  - **Vantagens da estratégia híbrida**:
    - ✅ Funciona com tickets criados automaticamente (com `reservationId`)
    - ✅ Funciona com tickets criados manualmente (sem `reservationId`, mas propriedade com reserva ativa)
    - ✅ Evita exibir check-in/check-out de reservas antigas ou futuras (validação temporal)
    - ✅ Prioriza reservas com hóspede já no imóvel (IN-HOUSE)

- **Formato de data/hora**: `dd/mm/yyyy HH:mm` (padrão brasileiro)
- **Fallback automático**: 
  - Se `checkInTime` ou `checkOutTime` forem `null`/`undefined`, `formatDateTimeCheckIn` exibe `--:--`
  - Se não houver `reservationId` no ticket E não houver reserva ativa na propriedade, bloco inteiro não aparece
  - Se não houver `checkInDate` ou `checkOutDate`, bloco não aparece

### **Impactos e compatibilidade:**

- ✅ Não houve quebra de funcionalidades existentes
- ✅ Chamados sem reserva vinculada continuam funcionando normalmente (bloco oculto)
- ✅ Performance preservada (função helper executada apenas no modal, validação em memória)
- ✅ Layout responsivo (grid muda de 1 para 2 colunas no desktop)
- ✅ Checkouts automáticos exibem check-in/check-out (estratégia 1: busca por `reservationId`)
- ✅ **NOVO**: Chamados manuais criados durante estadia também exibem (estratégia 2: busca por propriedade + período)
- ✅ Validação temporal evita exibir dados de reservas antigas ou futuras
- ✅ Priorização automática de reservas IN-HOUSE garante relevância dos dados exibidos

### **Como testar (passo a passo):**

#### **Teste principal (modal):**
1. Acessar **Manutenção** (modo cards ou lista)
2. Clicar em um chamado que esteja vinculado a uma reserva:
   - Chamado de hóspede (criado a partir de uma reserva)
   - Checkout automático
   - Chamado manual com `reservationId` preenchido
3. Verificar que o modal exibe um bloco "Estadia" com fundo azul/indigo logo abaixo dos badges
4. Verificar dois cards internos:
   - **Check-in**: ícone verde (LogIn), texto `dd/mm/yyyy HH:mm`
   - **Check-out**: ícone laranja (LogOut), texto `dd/mm/yyyy HH:mm`
5. Verificar que no mobile o layout permanece legível (cards em coluna)

#### **Teste de fallback:**
1. Clicar em um chamado **sem** `reservationId` (ex: chamado preventivo ou manual sem reserva vinculada)
2. **Caso A**: Propriedade sem reserva ativa → Bloco "Estadia" **não aparece** (comportamento esperado)
3. **Caso B**: Propriedade **com reserva ativa** (IN-HOUSE ou confirmada) no período → Bloco "Estadia" **aparece** (busca fallback por propriedade + período)
4. Verificar que o modal não quebra em ambos os casos

**Exemplo real (reportado):**
- Chamado "L-RL-17-101" criado manualmente (sem `reservationId`)
- Propriedade tem reserva IN-HOUSE (31/01/2026 - 28/02/2026)
- Data do chamado: 11/02/2026 (dentro do período)
- **Resultado esperado**: Bloco "Estadia" DEVE aparecer com check-in/check-out da reserva ativa ✅

#### **Teste de responsividade:**
1. Abrir modal no **desktop**: verificar que check-in e check-out aparecem lado a lado (2 colunas)
2. Abrir modal no **mobile** (redimensionar janela < 768px): verificar que aparecem em coluna (1 coluna)
3. Verificar que não há overflow ou elementos cortados

#### **Teste de checkouts automáticos:**
1. Aguardar ou criar um checkout automático (reserva com data de checkout chegando)
2. Clicar no card de checkout (roxo)
3. Verificar que o modal exibe corretamente as informações de check-in/check-out da reserva

#### **Validação visual:**
- Ícone LogIn: verde, dentro de círculo verde claro
- Ícone LogOut: laranja, dentro de círculo laranja claro
- Background do bloco: gradiente azul (from-blue-50 to-indigo-50)
- Borda do bloco: azul (border-blue-200)
- Cards internos: fundo branco, bordas verdes (check-in) e laranja (check-out)
- Labels em uppercase: "CHECK-IN" e "CHECK-OUT" (cinza, texto pequeno)

### **Observações:**

- A funcionalidade agora depende de `staysReservations` estar carregada no `App.tsx` e ser propagada através de `TicketModals` até `TicketDetailModal`
- **Estratégia dupla de busca** (direta + fallback):
  - **Com `reservationId`**: Busca direta por `reservation.id` ou `reservation.externalId`
  - **Sem `reservationId`**: Busca inteligente por `propertyCode` + validação temporal + priorização por status
- Não há loading adicional: se `staysReservations` estiver vazio, o bloco simplesmente não aparece
- A função `formatDateTimeCheckIn` já existente em `utils.ts` foi reutilizada
- TypeScript: Tipos atualizados, sem erros de compilação
- **Correção aplicada**: Implementação movida dos **cards** para o **modal** (local correto conforme requisito)
- **Melhoria aplicada**: Busca fallback por propriedade + período cobre casos de tickets manuais sem `reservationId` explícito

**Casos de uso cobertos:**
1. ✅ Ticket com `reservationId` explícito (checkout automático, ticket criado via reserva)
2. ✅ Ticket sem `reservationId` mas com reserva ativa na propriedade (ticket manual durante estadia)
3. ✅ Ticket sem `reservationId` e sem reserva ativa (nada é exibido, comportamento correto)
4. ✅ Propriedade com múltiplas reservas no período (prioriza IN-HOUSE)

---

**Status Final:** ✅ CORRIGIDO, IMPLEMENTADO E MELHORADO - Check-in/check-out aparecem no MODAL com busca inteligente
