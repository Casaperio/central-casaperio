# Task 3 — Cards de Manutenção atrasados não podem sumir (prioridade + “a partir de hoje”)

## Contexto

O cliente percebe que chamados **não concluídos** podem “sumir” por causa do filtro de período/agrupamento por dia. Ele quer que, **a partir de hoje** (para evitar o backlog antigo), qualquer chamado **não concluído** que esteja **atrasado** fique em destaque e **permaneça visível** em Manutenção até ser concluído.

## O que precisa ser feito

- Definir “marco” de regra: **startOfToday** (timezone do app).
- Criar/ajustar a lógica de “Atrasado”:
  - Considerar apenas tickets dentro do recorte “a partir de hoje” (ex.: criado >= hoje OU data desejada/prevista >= hoje — seguir o critério mais coerente com a modelagem existente).
  - Um ticket é “atrasado” se:
    - **não está DONE/Concluído** e
    - sua referência de prazo (preferência: **scheduledDate/ETA**, fallback: data desejada) é **< now**.
- Garantir visibilidade:
  - Em Manutenção, sempre renderizar uma seção/bloco no topo: **Atrasados**.
  - Esses itens não podem ser removidos pela filtragem de período enquanto não forem concluídos.
- Ordenação:
  - Atrasados primeiro (mais antigos primeiro ou mais urgentes primeiro — definir e aplicar consistentemente).
  - Depois, manter a ordem atual por dia/período.
- Não afetar chamados “antigos” anteriores ao marco (não trazer o backlog inteiro).
- Manter o comportamento do filtro “Período”:
  - Se houver atrasados, eles aparecem independentemente do período selecionado.
  - Se não houver atrasados, a tela funciona como hoje.

## Critérios de aceite

- [x] A partir de hoje, todo ticket **não concluído** que ficar atrasado aparece em **Atrasados** e não some.
- [x] Tickets antigos (antes do marco) não poluem a tela (não reintroduzir backlog inteiro).
- [x] Concluir o chamado remove ele da seção Atrasados.
- [x] Não há regressão em cards/lista/calendário e nem em filtros existentes.

---

## ✅ Implementação (preencher ao finalizar)

### **Causa/Contexto técnico:**
O sistema de filtros por período estava ocultando tickets atrasados quando o usuário selecionava períodos específicos (Hoje, 7 dias, etc.), fazendo com que chamados importantes que precisassem de atenção "sumissem" da interface. A lógica existente agrupava tickets apenas por data agendada, sem considerar a criticidade de tickets em atraso.

### **Solução aplicada:**
1. **Marco temporal "a partir de hoje"**: Implementada lógica que considera apenas tickets criados hoje ou no futuro, OU com data desejada/agendada >= hoje, evitando trazer todo o backlog histórico do período de testes
2. **Seção especial "Atrasados"**: Criado grupo prioritário que sempre aparece no topo da lista, independente de filtros de período
3. **Função de detecção aprimorada**: Definida lógica que verifica se ticket não está concluído, tem prazo definido e está dentro do escopo temporal
4. **Exceção no filtro de período**: Tickets atrasados sempre passam pela filtragem de período, garantindo visibilidade contínua
5. **Destaque visual**: Tags e estilos especiais (vermelho em destaque, anel pulsante) para identificar imediatamente tickets atrasados

### **Arquivos alterados:**
- **`components/views/MaintenanceView.tsx`**:
  - Atualizada função `isTicketOverdue()` com marco temporal "a partir de hoje"
  - Melhorado estilo visual do título da seção "Atrasados" (vermelho com ícone AlertCircle)
  - Aprimorada lógica de tags visuais para evitar sobreposição quando ticket está atrasado

- **`hooks/features/useMaintenanceFilters.ts`**:
  - Adicionado array `overdue: MaintenanceItem[]` para separar tickets atrasados
  - Criada função `isTicketOverdueInScope()` que implementa a lógica do marco temporal
  - Implementada exceção no filtro de período para tickets atrasados sempre passarem
  - Criado grupo especial `overdueGroup` que sempre aparece no topo
  - Ordenação de atrasados por antiguidade (mais antigos primeiro)

### **Regras/Helpers criados ou ajustados:**
- **`isTicketOverdueInScope()`**: Nova função que implementa a lógica de detecção de atraso com marco temporal:
  - Verifica se ticket não está concluído (status ≠ DONE)
  - Checa se tem data limite (scheduledDate | desiredDate)
  - Aplica filtro de escopo temporal (createdAt >= hoje OU scheduledDate >= hoje)
  - Compara deadline com data atual
- **Grupo "Atrasados"**: Sempre inserido no início da lista, com ordenação por antiguidade
- **Exceção no filtro de período**: Tickets atrasados sempre visíveis, independente do período selecionado

### **Impactos e compatibilidade:**
- **Preservado**: Todos os filtros existentes (assignee, propriedade, tipo, status) continuam funcionando
- **Preservado**: Agrupamento por data para tickets não atrasados mantido inalterado  
- **Preservado**: Funcionamento do modo calendário não foi afetado
- **Preservado**: Ordenação e display de tickets concluídos mantido
- **Preservado**: Cards de checkout virtual e funcionamento do tablet
- **Novo**: Seção "Atrasados" aparece apenas quando há tickets atrasados no escopo
- **Melhorado**: Visual mais claro para identificar urgência de tickets atrasados

### **Como testar (passo a passo):**
1. **Criar ticket de teste atrasado**:
   - Criar novo chamado com data desejada de ontem
   - Verificar se aparece na seção "Atrasados" no topo
   - Confirmar que tem visual destacado (vermelho, tag "⚠️ ATRASADO")

2. **Testar filtros de período**:
   - Selecionar "Hoje" no filtro de período
   - Verificar se ticket atrasado ainda aparece na seção "Atrasados"
   - Testar com "7 dias", "30 dias" - ticket atrasado deve sempre estar visível

3. **Testar resolução de atraso**:
   - Marcar ticket atrasado como "Concluído"
   - Verificar se sai da seção "Atrasados"
   - Verificar se aparece na seção de concluídos do dia

4. **Verificar escopo temporal**:
   - Tickets muito antigos (antes de hoje) não devem aparecer como atrasados
   - Apenas tickets criados hoje ou com data >= hoje devem ser considerados

5. **Testar outros filtros**:
   - Aplicar filtros de responsável, propriedade, tipo
   - Verificar se seção "Atrasados" respeita esses filtros
   - Confirmar que não há regressões nos filtros existentes

### **Observações:**
- A implementação usa o conceito de "escopo temporal" para evitar que tickets muito antigos (do período de testes) poluam a interface
- O visual destacado (vermelho pulsante) garante máxima visibilidade para situações críticas
- A ordenação por antiguidade na seção "Atrasados" prioriza os casos mais urgentes
- Tickets atrasados mantêm suas tags de tipo (CHECKOUT, PREVENTIVA, etc.) mas em formato menor para não conflitar com a tag "ATRASADO"

### **Correções Aplicadas Pós-Implementação:**

**🔧 Correção da Lógica de Horários (11/02/2026):**
- **Problema identificado**: A lógica inicial estava zerando as horas na comparação de deadline, fazendo com que tickets com horários específicos (ex: 04:15, 14:30) não fossem detectados como atrasados no mesmo dia
- **Correção aplicada**: 
  - Implementada detecção de horário específico (`hasSpecificTime`)
  - Quando há horário específico: mantém hora completa na comparação
  - Quando é meia-noite (00:00): mantém comportamento anterior (compara apenas datas)
- **Exemplo corrigido**: Ticket com prazo "11/02/2026 às 04:17" agora é detectado como atrasado às 10:00 do mesmo dia
- **Impacto**: Maior precisão na detecção de atrasos em tempo real, especialmente para tickets com prazos intradiários
