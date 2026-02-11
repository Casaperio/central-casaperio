# Task 1 — Inserir filtro de imóvel (Manutenção + Guest & CRM)

## Contexto

O cliente quer filtrar a visualização por **imóvel** em dois módulos: **Manutenção** e **Guest & CRM**. O filtro deve ser um **select com dropdown**, permitir **múltiplas escolhas**, ter **barra de pesquisa**, funcionar junto com os filtros já existentes (período, tipo, responsáveis etc.) e ser **responsivo no mobile**, sem quebrar nada.

## O que precisa ser feito

- Implementar um novo filtro “Imóveis” em:
  - Módulo **Manutenção** (cards/lista/calendário, conforme existir).
  - Módulo **Guest & CRM** (lista/cards/visões do módulo).
- O componente deve:
  - Suportar **multi-select**.
  - Ter **campo de busca** dentro do dropdown.
  - Exibir itens selecionados de forma clara (chips/contador) e permitir limpar seleção.
  - Ser **responsivo** (no mobile, não estourar layout; considerar modal/bottom-sheet se necessário).
- Integração com dados:
  - A lista de imóveis deve vir da **mesma fonte confiável já usada no sistema** (ex.: Stays / catálogo interno).
  - O filtro deve aplicar o recorte por imóvel em **todas as consultas/renderizações** do módulo (listas, agrupamentos por dia, contagens e estados visuais).
- Integração com outros filtros:
  - O resultado final deve ser a **interseção**: (período + tipo + responsáveis + status + imóveis selecionados).
  - Garantir que “Todos” continue funcionando (sem seleção = não filtra por imóvel).
- Persistência de UX (opcional se já houver padrão):
  - Se o app já persiste filtros (URL/localStorage/state global), manter o mesmo padrão para este novo filtro.

## Critérios de aceite

- [ ] Existe filtro “Imóveis” em **Manutenção** e **Guest & CRM**.
- [ ] Permite **selecionar 1..N imóveis** e **buscar** no dropdown.
- [ ] Funciona junto com filtros atuais sem regressão (interseção correta).
- [ ] No mobile fica utilizável (dropdown não quebra layout; seleção/limpar acessíveis).
- [ ] Sem seleção = comportamento atual (não filtra).
- [ ] Não impacta negativamente performance (sem refetch desnecessário; respeitar debounce quando aplicável).
---

## ✅ Implementação (preencher ao finalizar)

### **Causa/Contexto técnico:**

O sistema já possuía filtros multi-select para **Tipo** e **Responsável** no módulo Manutenção, mas não havia filtro por **Imóvel**. O módulo Guest & CRM também não possuía filtro de imóveis. Os dados de propriedades já estavam disponíveis no App através do hook `usePropertiesData`, que carrega os imóveis do MongoDB (fonte de verdade: Stays API).

### **Solução aplicada:**

1. **Componente reutilizável PropertyFilter**: Criado seguindo o padrão do `AssigneeFilter`, com funcionalidades de:
   - Multi-select com checkboxes
   - Barra de busca integrada no dropdown
   - Contador de selecionados
   - Botão de limpar seleção
   - Layout responsivo (flex com min/max widths)

2. **Atualização de estados e tipos**:
   - Alterado `filterMaintenanceProperty` de `string` para `string[]` no App.tsx
   - Atualizado `resetTrigger` para incluir join do array de propriedades
   - Adicionado `guestSelectedProperties` como novo estado no App.tsx

3. **Hooks atualizados**:
   - `useMaintenanceFilters`: Atualizada interface e lógica de filtro para suportar array de propriedades (multi-select) com backward compatibility
   - `useMaintenanceCalendar`: Suporte a array de propriedades
   - `useGuestPeriodFilter`: Adicionado parâmetro `selectedProperties` e lógica de filtro

4. **Integração nos componentes**:
   - `MaintenanceView`: Adicionado PropertyFilter na linha de filtros, passando properties e setter
   - `GuestView`: Adicionado PropertyFilter em layout flex com StatusFilter, passando properties e handler

### **Arquivos alterados:**

- **Novos:**
  - `components/views/PropertyFilter.tsx` (componente reutilizável)

- **Modificados:**
  - `App.tsx`: Estados de filtro, handlers e props passadas para views
  - `hooks/features/useMaintenanceFilters.ts`: Interface e lógica multi-select
  - `hooks/features/useMaintenanceCalendar.ts`: Interface e lógica multi-select
  - `hooks/features/useGuestPeriodFilter.ts`: Adicionado filtro de propriedades
  - `components/views/MaintenanceView.tsx`: Import, props e renderização do PropertyFilter
  - `components/views/GuestView.tsx`: Import, props e renderização do PropertyFilter

### **Regras/Helpers criados ou ajustados:**

- **Backward compatibility**: A lógica de filtro suporta tanto `string` (antigo) quanto `string[]` (novo), garantindo que componentes ainda não migrados continuem funcionando
- **Filtro vazio = todos**: Quando `selectedProperties.length === 0`, não aplica filtro (mostra todos os imóveis)
- **Interseção de filtros**: O filtro de propriedade funciona em conjunto com período, tipo, responsável e status (AND lógico)

### **Impactos e compatibilidade:**

- ✅ Não houve quebra de funcionalidades existentes
- ✅ Filtros atuais (período, tipo, responsável, status) continuam funcionando
- ✅ Performance preservada (sem refetch adicional, dados já carregados)
- ✅ Responsividade mantida (layout flex adaptativo)
- ✅ Checkouts virtuais respeitam o filtro de propriedade

### **Como testar (passo a passo):**

**Módulo Manutenção:**
1. Acessar **Manutenção** (modo cards ou lista)
2. Localizar o filtro ''Filtrar por Imóvel'' na linha de filtros (ao lado de Tipo e Responsável)
3. Clicar no dropdown e verificar:
   - Lista de imóveis ordenada alfabeticamente
   - Barra de busca funcional (busca por código ou endereço)
   - Checkboxes para multi-select
   - Botão ''Limpar seleção'' (aparece quando há seleção)
4. Selecionar 1 ou mais imóveis e verificar:
   - Contador atualizado (ex: ''2 imóveis selecionados'')
   - Apenas tickets/checkouts das propriedades selecionadas aparecem
   - Outros filtros continuam funcionando (interseção)
5. Testar no mobile (layout responsivo, dropdown não quebra)

**Módulo Guest & CRM:**
1. Acessar **Guest & CRM** (modo cards ou lista)
2. Localizar o filtro ''Filtrar por Imóvel'' (abaixo do filtro de status, em flex horizontal)
3. Repetir testes do Manutenção (busca, multi-select, limpar)
4. Verificar que apenas reservas das propriedades selecionadas aparecem
5. Testar combinação com filtros de período e status

**Casos de borda:**
- Sem seleção = mostra todos os imóveis (comportamento padrão)
- Busca sem resultados = mensagem ''Nenhum imóvel encontrado''
- Limpar seleção retorna ao estado inicial
- Navegação entre módulos preserva estado de cada filtro independentemente

### **Observações:**

- A lista de propriedades vem do hook `usePropertiesData`, que já carrega os dados do MongoDB (sincronizado com Stays API)
- O filtro não persiste entre sessões (estado local do React), mas poderia ser facilmente estendido com localStorage se necessário
- Performance: Não há impacto negativo, pois a filtragem é feita em memória sobre dados já carregados
- Acessibilidade: O dropdown fecha ao clicar fora (via useEffect com mousedown listener)
- TypeScript: Tipos atualizados em todos os lugares, sem erros de compilação

---

**Status Final:** ✅ IMPLEMENTADO E TESTADO
