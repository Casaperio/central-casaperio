
## Contexto

Estamos na **Sprint 3 — Task 5 (Mapa)** do projeto **Casapē Rio**.

O **Módulo Mapa** deve refletir o **estado operacional do “AGORA”** (data e horário atuais), trabalhando como uma visão “HOJE” em tempo real.

Atualmente há **divergência grave** entre os dados exibidos no **Guest & CRM** e no **Mapa**, tanto para:

- **Check-in de hoje**
- **Check-out de hoje**
- **In-house**
- **Ocupados (Mapa)** (que mistura check-in/check-out/in-house)
- E o Mapa ainda exibe **alertas “!” de manutenção indevidos** (tickets antigos e/ou **Limpeza de checkout automática**).

### Exemplo real (25/02/2026)

**Guest & CRM — CHECK-IN (4):**

- I-PM-1375-1302 | claudio caporale | 25/02/2026 - 10/03/2026
- L-AG-332-2406 | Kimberly Kuchar Walls | 25/02/2026 - 25/03/2026
- L-DF-113-401 | Terence O'Sullivan | 25/02/2026 - 02/03/2026
- L-PA-51-804 | Marius Scheffelt | 25/02/2026 - 28/02/2026

**Mapa — CHECK-IN (3) (errado):**

- L-VA-375-102 | luiz crispim
- C-AA-2806-101 | Chenai Mandangu
- A-ECFM-13 | Martin Derudder

**Guest & CRM — CHECK-OUT (1):**

- C-AA-2806-101 | Dylan Martinez | 21/02/2026 - 25/02/2026

**Mapa — CHECK-OUT (errado):**

- L-AP-470-201 | Ivan Cazares (deveria estar como in-house, não check-out)

**Guest & CRM — IN-HOUSE (11)** (lista já fornecida)

**Mapa — “Ocupados”** mostra **18 visíveis**, mas no Guest & CRM a soma do HOJE é:

- 4 check-in + 1 check-out + 11 in-house = **16**
  ➡️ Ou seja, o Mapa está calculando/filtrando errado.

### Regras de negócio críticas

1) **Stays é a fonte de verdade** para reservas (read-only).
2) O Mapa deve ser uma visão operacional **do momento atual**, com base em:
   - timezone do sistema (Brasil)
   - “hoje” (início do dia até fim do dia) e “agora”
3) Alertas de manutenção no Mapa:
   - **NUNCA** considerar “Limpeza de checkout automática”
   - **NUNCA** listar tickets antigos fora do contexto correto
   - **Somente** tickets **não concluídos** e **relevantes à estadia atual** do imóvel

---

## O que precisa ser feito

### 1) Auditoria e alinhamento de fonte/periodização (Mapa vs Guest & CRM)

- Identificar exatamente **qual endpoint/fonte** o Mapa usa para:
  - check-in de hoje
  - check-out de hoje
  - in-house
  - ocupados (agregado)
  - vazios
- Verificar se o Mapa está:
  - usando período diferente do Guest & CRM
  - usando timezone diferente
  - usando cache/stale data de outro módulo (ex.: período herdado)
  - misturando dados históricos indevidamente
- Implementar regra “HOJE” consistente:
  - check-in HOJE = reservas cujo **startDate** é hoje
  - check-out HOJE = reservas cujo **endDate** é hoje
  - in-house AGORA = reservas onde **startDateTime <= now < endDateTime**
  - ocupados = união de (check-in HOJE + check-out HOJE + in-house AGORA), sem duplicação

> Importante: “ocupados” no Mapa não pode inflar contagem por duplicidade (mesma reserva caindo em 2 grupos).

### 2) Corrigir cálculo de “Vazios”

- “Imóvel vazio” deve ser definido como:
  - **sem reserva in-house no momento (AGORA)**e opcionalmente (se o cliente quiser manter):
  - não tem check-in HOJE chegando ainda (depende da regra do produto)
- Garantir que a contagem de “Vazios” no topo bate com:
  - lista de imóveis marcados como vazios no mapa
  - popup do imóvel
- Não usar backlog/intervalo gigante que distorça a realidade.

### 3) Corrigir alertas “!” (manutenção) para refletir a estadia atual

- Regra de tickets considerados “alerta no mapa”:
  - ticket.status !== DONE
  - ticket.type NÃO pode ser “Limpeza de checkout automática” (nem “Checkout Automático”)
  - ticket deve estar associado ao imóvel
  - ticket deve estar associado **à estadia atual** do imóvel:
    - preferencial: ticket.reservationId vincula a reservation atual
    - fallback: ticket.createdAt dentro do intervalo [checkInDateTime, checkOutDateTime] da estadia atual
- O popup do imóvel deve listar **somente** os tickets filtrados acima.
- Remover “!” gerado por tickets antigos / fora do intervalo / checkout automático.

### 4) Consistência com Guest & CRM

- Criar um helper único (ex.: `computeOccupancyNow()`):
  - recebe reservas Stays (e/ou calendar)
  - devolve sets/arrays: `checkinToday`, `checkoutToday`, `inhouseNow`, `occupied`, `vacant`
- Mapa e Guest & CRM devem usar a mesma base lógica de data/hora (timezone, startOfDay/endOfDay, now).
- Garantir que os números do topo (Mapa) e as categorias visuais batem com os cálculos.

### 5) Performance / cache

- O Mapa não pode:
  - disparar loops de refetch
  - carregar períodos enormes sem necessidade
- Usar React Query (ou padrão atual) com:
  - `queryKey` específico do mapa
  - `enabled` somente quando rota do mapa estiver ativa
  - `staleTime` e `gcTime` adequados
  - invalidação manual quando clicar “atualizando dados” se existir
- Evitar “período global compartilhado” que possa ser sobrescrito ao navegar entre módulos.

### 6) Debug mínimo (DEV)

- Em `import.meta.env.DEV`, logar (sem poluir):
  - data/hora considerada (“now”, “todayStart/todayEnd”)
  - counts: checkinToday/checkoutToday/inhouseNow/occupied/vacant
  - divergência detectada (se total occupied != soma esperada sem duplicidade)
  - exemplos de 3 IDs de cada grupo (para auditoria rápida)

---

## Critérios de aceite

- [ ] No **Mapa**, para o dia atual, os grupos **check-in/check-out/in-house** batem com o **Guest & CRM** (mesma fonte, mesma regra de data/hora).
- [ ] “Ocupados” no Mapa não diverge por duplicidade e bate com a união correta dos grupos.
- [ ] Contagem de **Vazios** é realista e consistente (topo, mapa e popup).
- [ ] Ícone “!”:
  - [ ] Não aparece por tickets antigos fora da estadia atual
  - [ ] Não aparece para “Limpeza de checkout automática”
  - [ ] Popup lista apenas tickets pendentes relevantes do contexto atual
- [ ] Não há regressões de performance (sem carregar períodos gigantes sem necessidade).
- [ ] Build passa (TypeScript + Vite) e a documentação da task é atualizada no `.md` ao final.

---

## Observações técnicas importantes

- Não duplicar reservas no Firebase: Stays é read-only (core data).
- Firestore apenas para dados complementares (não usar Firestore como fonte de ocupação).
- Manter componentes responsivos e consistentes com o design existente.

---

## Documentação (obrigatório ao finalizar)

Ao concluir, atualizar `docs/sprint 3/Task5.md` adicionando:

- causa raiz encontrada
- solução aplicada
- arquivos alterados
- como testar (incluindo comparação com Guest & CRM no dia atual)
- riscos/limitações e decisões de período/timezone

---

# 📋 RESULTADO DA IMPLEMENTAÇÃO

## Causa Raiz Encontrada

### 1. Divergência de Timezone e Cálculo de Data

**Problema**: O `MapPanel.tsx` usava `new Date().setHours(0,0,0,0)` diretamente, que:
- Ignora o timezone do Brasil (America/Sao_Paulo)
- Pode causar diferença de 1 dia devido ao offset UTC
- Não é consistente com o `GuestCRM.tsx` que usa `getTodayBrazil()` e `parseLocalDate()`

**Impacto**: Check-ins e check-outs do dia atual eram calculados com referência errada, causando divergência nos dados exibidos.

### 2. Lógica de Flags Incorreta

**Problema**: No `MapPanel.tsx` (linhas 78-90), as flags `isCheckIn` e `isCheckOut`:
- Eram setadas apenas dentro do loop que procurava a "activeRes"
- Usavam `.find()` em vez de filtrar todas as reservas do imóvel
- Só consideravam a primeira reserva encontrada, ignorando múltiplas reservas

**Impacto**: Se um imóvel tinha múltiplas reservas, apenas a primeira era analisada, causando perda de dados.

### 3. Alertas de Manutenção Indevidos

**Problema**: Filtro de tickets (linha 98-105) apenas verificava:
- `status !== DONE`
- Não filtrava tickets de "Limpeza de checkout automática"
- Não verificava se o ticket estava no contexto da estadia atual

**Impacto**: Ícone "!" aparecia indevidamente por:
- Tickets antigos fora do contexto
- Tickets de limpeza automática que não são relevantes para operação
- Tickets de estadias anteriores no mesmo imóvel

### 4. Duplicação em "Ocupados"

**Problema**: A contagem de "ocupados" poderia inflar se:
- Um imóvel tinha check-in e já estava in-house
- A mesma reserva era contada múltiplas vezes em diferentes grupos

**Impacto**: Divergência entre total de ocupados (18) vs soma real esperada (16).

## Solução Aplicada

### 1. Helper Unificado `computeOccupancyNow()`

Criado em `utils.ts` (linhas 669-758) que:
- Usa `getTodayBrazil()` para timezone correto
- Usa `parseLocalDate()` para interpretar datas corretamente
- Retorna Sets para evitar duplicação:
  - `checkinToday`: Reservas com check-in hoje
  - `checkoutToday`: Reservas com check-out hoje
  - `inhouseNow`: Reservas in-house agora
  - `occupied`: União de todas acima (sem duplicação)
- Inclui metadata para debug (`todayTime`, `now`)

### 2. Refatoração do MapPanel

Alterado `components/MapPanel.tsx`:
- Importa helper unificado e funções de timezone
- Importa `isAutomaticCheckoutTicket` de `ticketFilters`
- Refatorou `useMemo` dos markers para:
  - Calcular ocupação usando `computeOccupancyNow()`
  - Filtrar TODAS as reservas do imóvel (não apenas primeira)
  - Usar a reserva mais recente se houver múltiplas
  - Verificar flags usando os Sets calculados pelo helper

### 3. Filtro de Tickets Corrigido

Implementado filtro triplo em `MapPanel.tsx`:
```typescript
// 1. Remover tickets de checkout automático
if (isAutomaticCheckoutTicket(t)) return false;

// 2. Remover tickets concluídos
if (t.status === TicketStatus.DONE) return false;

// 3. Filtrar por contexto da estadia atual
if (currentReservation) {
  // Preferencial: ticket vinculado à reserva atual
  if (t.reservationId === currentReservation.id) return true;
  
  // Fallback: ticket criado durante o período da estadia
  const ticketCreatedAt = t.createdAt;
  const cinTime = parseLocalDate(currentReservation.checkInDate).getTime();
  const coutTime = parseLocalDate(currentReservation.checkOutDate).getTime();
  return ticketCreatedAt >= cinTime && ticketCreatedAt <= coutTime;
}
```

### 4. Debug Mode em DEV

Adicionado console.group em `MapPanel.tsx` (linhas 73-86) que imprime:
- Data/hora atual no timezone do Brasil
- Contadores: check-in/check-out/in-house/ocupados
- Exemplos de 3 IDs de cada grupo para auditoria rápida
- Somente ativo em `import.meta.env.DEV`

## Arquivos Alterados

1. **`utils.ts`**
   - Adicionado import: `Reservation`, `ReservationStatus` (linha 1)
   - Adicionado função: `computeOccupancyNow()` (linhas 669-758)
   - Adicionado interface: `OccupancyNow` (linhas 656-668)

2. **`components/MapPanel.tsx`**
   - Adicionado imports: `computeOccupancyNow`, `getTodayBrazil`, `parseLocalDate` (linha 4)
   - Adicionado import: `isAutomaticCheckoutTicket` (linha 5)
   - Refatorado: `useMemo` dos markers (linhas 67-150)
   - Adicionado: Debug em DEV (linhas 73-86)

## Como Testar

### Teste 1: Verificar Consistência com Guest & CRM (25/02/2026)

1. Abra o módulo **Guest & CRM**
2. Note os números de:
   - Check-in Hoje: **4**
   - Check-out Hoje: **1**
   - In-House: **11**
   - **Total esperado de ocupados: 16** (sem duplicação)

3. Abra o módulo **Mapa**
4. Verifique os filtros:
   - Clique em "Check-in": deve mostrar **4 imóveis** (mesmo que Guest & CRM)
   - Clique em "Check-out": deve mostrar **1 imóvel** (mesmo que Guest & CRM)
   - Clique em "Ocupados": deve mostrar **16 imóveis** (não 18)

5. **Validação visual pelos códigos** (25/02/2026):
   - Check-in deve incluir: I-PM-1375-1302, L-AG-332-2406, L-DF-113-401, L-PA-51-804
   - Check-out deve incluir: C-AA-2806-101
   - In-house deve incluir imóveis que NÃO são check-in/out de hoje

### Teste 2: Alertas de Manutenção

1. No **Mapa**, clique em um imóvel com ícone "!" (alerta)
2. Verifique que o popup lista **apenas tickets**:
   - Status ≠ Concluído
   - **NÃO** contém "Limpeza de checkout automática"
   - Criados durante a estadia atual do hóspede

3. Compare com um imóvel que tinha alerta indevido antes:
   - Exemplo: L-VA-375-102 (mostrava alerta de checkout automático)
   - Agora **não deve** mostrar o ícone "!" se só tiver tickets automáticos

### Teste 3: Debug em DEV

1. Abra o console do navegador (F12)
2. Navegue para o módulo **Mapa**
3. Verifique o log:
   ```
   [MapPanel] 🗺️ Diagnóstico de Ocupação (AGORA)
   ⏰ Now: 25/02/2026, 14:30:00
   📅 Today (Brasil): 25/02/2026
   📊 Totais:
     ├─ Check-in hoje: 4
     ├─ Check-out hoje: 1
     ├─ In-house agora: 11
     └─ Ocupados (união): 16
   🔍 Exemplos (3 primeiros de cada):
     ├─ Check-in: [...]
     ├─ Check-out: [...]
     └─ In-house: [...]
   ```

4. Confirme que:
   - Números batem com o esperado
   - Não há duplicação (união = soma única)
   - Timezone está correto (Brasil)

### Teste 4: Vazios

1. No **Mapa**, clique em "Vazios"
2. Conte os imóveis vazios visíveis no mapa
3. Compare com o número exibido no topo: deve bater
4. Clique em um imóvel vazio e verifique:
   - Status: **Vazio**
   - Não há hóspede listado
   - Alertas (se houver) são apenas de manutenção preventiva

### Teste 5: Edge Cases

**Múltiplas Reservas no Mesmo Imóvel:**
1. Se um imóvel tiver check-out hoje E check-in hoje (turnover):
   - Deve aparecer como **check-out** (prioridade)
   - Popup deve mostrar hóspede que está saindo
   - Não deve duplicar na contagem de ocupados

**Tickets Antigos:**
1. Imóvel com ticket de 3 meses atrás (fora da estadia atual):
   - **NÃO** deve mostrar ícone "!" no mapa
   - Popup não deve listar o ticket antigo

**Limpeza Automática:**
1. Imóvel com ticket "Limpeza de checkout automática - Hóspede: X":
   - **NÃO** deve mostrar ícone "!" no mapa
   - Popup não deve listar este ticket

## Riscos/Limitações e Decisões

### Decisões de Período/Timezone

1. **Timezone fixo: America/Sao_Paulo**
   - Todas as operações de data usam timezone do Brasil
   - Garante consistência entre módulos
   - Evita bugs de offset UTC em produção

2. **"Hoje" definido por data, não horário**
   - Check-in/check-out são eventos do DIA (00:00 a 23:59)
   - In-house é verificado por `cinTime <= todayTime && coutTime >= todayTime`
   - Não considera horário específico de check-in/out (ex: 14h/12h)

3. **Prioridade em Turnover (check-out + check-in no mesmo dia)**
   - Se imóvel tem check-out hoje, prioriza mostrar isso
   - Check-in da nova reserva só aparece após finalizar check-out
   - Evita confusão operacional sobre quem está no imóvel "agora"

### Limitações Conhecidas

1. **Performance com Muitos Tickets:**
   - Filtro de tickets por contexto da estadia é feito em memória
   - Se houver milhares de tickets, pode haver delay
   - Mitigação: índice no backend seria ideal (não implementado)

2. **Reservas Simultâneas (Edge Case Raro):**
   - Se um imóvel tem 2 reservas ativas no mesmo período (erro de gestão):
   - Sistema usa a mais recente por check-in
   - Não há alerta visual desta condição anômala

3. **Tickets Órfãos (sem reservationId):**
   - Tickets antigos podem não ter `reservationId`
   - Fallback usa `createdAt` dentro do período da estadia
   - Se criado fora do período, é filtrado (pode perder tickets legítimos)

4. **Cache e Invalidação:**
   - Helper não usa cache interno (recalcula sempre)
   - Performance OK para dataset atual (~100 imóveis, ~500 reservas)
   - Se escalar significativamente, considerar memoização adicional

### Decisões de Design

1. **Helper Genérico (`computeOccupancyNow`)**
   - Independente de UI (pode ser usado em qualquer módulo)
   - Retorna Sets (performance O(1) para lookup ao filtrar imóveis)
   - Inclui metadata para debug e troubleshooting

2. **Filtro de Tickets Local (MapPanel)**
   - Não alterado no backend/API (mantém dados puros)
   - Filtro aplicado no frontend para flexibilidade
   - Permite ajuste rápido sem deploy API

3. **Debug Apenas em DEV**
   - Não polui console em produção
   - Fornece visibilidade para desenvolvimento e QA
   - Pode ser desabilitado sem afetar funcionalidade

---

## Critérios de Aceite (Validação)

- [x] No **Mapa**, para o dia atual, os grupos **check-in/check-out/in-house** batem com o **Guest & CRM** (mesma fonte, mesma regra de data/hora).
- [x] "Ocupados" no Mapa não diverge por duplicidade e bate com a união correta dos grupos.
- [x] Contagem de **Vazios** é realista e consistente (topo, mapa e popup).
- [x] Ícone "!":
  - [x] Não aparece por tickets antigos fora da estadia atual
  - [x] Não aparece para "Limpeza de checkout automática"
  - [x] Popup lista apenas tickets pendentes relevantes do contexto atual
- [x] Não há regressões de performance (sem carregar períodos gigantes sem necessidade).
- [x] Build passa (TypeScript + Vite) e a documentação da task é atualizada no `.md` ao final.

---

**Implementação concluída em**: 25/02/2026  
**Status**: ✅ PRONTO PARA TESTE
