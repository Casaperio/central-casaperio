
# Sprint 3 — Regras Gerais (Copilot / Claude Sonnet 4.5 / Codex)

## Contexto

Você está trabalhando no projeto **Casaperio** (frontend web + modo tablet + integrações), com módulos como **Manutenção**, **Guest & CRM**, **CRM & Ciclo**, **Mapa** e **Imóveis**, consumindo dados principalmente da **API Stays (read-only)** e usando **Firebase/Firestore apenas para dados complementares** quando já for padrão do projeto (sem duplicar reservas/imóveis).

Esta pasta (`/sprint-3`) contém os prompts das tasks da sprint. **Antes de iniciar qualquer implementação, leia este arquivo e siga as regras abaixo.**

---

## Regras Obrigatórias da Sprint 3

### 1) Entendimento antes de codar

Para cada task:

- Entenda o **fluxo do usuário** (desktop, mobile e tablet quando aplicável).
- Entenda a **arquitetura atual do projeto** (onde ficam views, modais, utils, types, integrações, cache, filtros).
- Identifique **quais arquivos são afetados** e como a mudança pode impactar outras telas.
- Planeje a solução com foco em:
  - **não quebrar funcionalidades existentes**
  - **consistência visual**
  - **manter performance**
  - **evitar duplicação de lógica**

### 2) Fonte de dados e regra crítica (Stays é read-only)

- **Reservas e imóveis vêm somente da Stays** (não duplicar no Firebase/Firestore).
- Firestore (quando usado) é apenas para **dados complementares** (ex.: comentários, overrides, tickets internos etc.), sempre seguindo o padrão já existente no projeto.
- Qualquer dado vindo da Stays deve ser tratado como **fonte de verdade** para o que for “core”.

### 3) Consistência de lógica: centralizar regras em helpers

- Sempre que houver regra repetida (ex.: filtros, status, cálculo de atrasado, validação de dados, formatação de datas):
  - Preferir criar/usar helpers em `utils` (ou local padrão do projeto).
  - Evitar “regras escondidas” espalhadas por componentes.

### 4) UX/UI e Responsividade (desktop + mobile + tablet)

- Tudo que for implementado deve ser:
  - Responsivo no **mobile**
  - Coerente com o layout atual (componentes, spacing, badges, chips, skeletons, etc.)
  - Sem “quebrar” o modo tablet (quando a task tocar dados compartilhados)
- Se a task pedir carregamento sob demanda:
  - Implementar **loading state/skeleton**
  - Evitar travar a tela principal

### 5) Performance e carregamento

- Evitar refetch desnecessário e loops de estado.
- Se existir cache/persistência de filtros, seguir o padrão já usado no app.
- Em listas grandes, aplicar debounce para busca e evitar recomputações pesadas.

### 6) Compatibilidade e não regressão

- Toda alteração deve preservar:
  - Fluxos já existentes (especialmente Manutenção e Tablet)
  - Regras de visibilidade e filtros já implantados
  - Estados e validações já consolidados (ex.: status global, ETA, etc.)
- Se uma task tocar lógica sensível, adicionar guards/fallbacks para dados faltantes.

---

## Regra de Documentação Obrigatória (ao finalizar cada task)

Ao concluir a implementação de uma task, você DEVE:

1. Abrir o arquivo `.md` da task dentro desta pasta `sprint-3`.
2. Manter o prompt original intacto no topo.
3. Abaixo do prompt, adicionar uma seção final de documentação:

### ✅ Implementação (preencher ao finalizar)

- **Causa/Contexto técnico:** (o que foi identificado no código atual)
- **Solução aplicada:** (o que foi mudado e por quê)
- **Arquivos alterados:** (lista objetiva)
- **Regras/Helpers criados ou ajustados:** (se houver)
- **Impactos e compatibilidade:** (o que foi preservado / cuidados)
- **Como testar (passo a passo):** (fluxo manual recomendado)
- **Observações:** (pendências, limitações, decisões)

> Importante: essa documentação deve ser clara, objetiva e suficiente para qualquer pessoa entender o que foi feito e validar.

---

## Critérios gerais de aceite da Sprint 3

- [ ] Todas as tasks implementadas sem regressões visíveis nos módulos existentes.
- [ ] UI responsiva e consistente com o design atual.
- [ ] Regras críticas respeitadas (Stays read-only; Firebase apenas complementar).
- [ ] Performance preservada (carregamento sob demanda quando solicitado).
- [ ] Cada task finalizada com documentação adicionada no `.md` correspondente, abaixo do prompt.
