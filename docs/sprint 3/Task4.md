# Task 4 — Modal de detalhes do hóspede (Guest & CRM) com carregamento sob demanda + skeleton

## Contexto

No Guest & CRM, ao clicar numa pessoa, o cliente quer ver um resumo semelhante ao **CRM & Ciclo**: histórico de reservas, total gasto, total de noites, comentários etc. Porém, o módulo já é sensível a performance, então esses dados devem ser carregados **somente ao abrir o modal**, com **skeleton**.

## O que precisa ser feito

- Criar um modal de “Detalhes do Hóspede” acionado ao clicar no card/linha do hóspede no Guest & CRM.
- Conteúdo do modal (mínimo):
  - Cabeçalho com nome + indicadores (ex.: “2ª reserva”, VIP se existir, etc.).
  - Métricas: **total gasto**, **total noites**, **nº de estadias** (e outras que já existam no CRM & Ciclo).
  - **Histórico de reservas** (onde já se hospedou / lista com datas e imóvel).
  - **Comentários** do hóspede (se existir no sistema: Firestore “guest comments” / CRM).
- Performance:
  - O Guest & CRM **não deve pré-carregar** esses dados do modal.
  - Ao abrir modal:
    - disparar fetch sob demanda (Stays/CRM/Firestore conforme fonte correta),
    - mostrar **skeleton/loading state**,
    - tratar erro com fallback amigável.
  - Cache local (em memória) permitido para reabrir o mesmo hóspede sem refetch imediato, se já houver padrão no app.
- UX/UI:
  - Modal responsivo (desktop/mobile), alinhado ao design atual.
  - Conteúdo com seções claras e scroll interno se necessário.

## Critérios de aceite

- [ ] Clique no hóspede abre modal com resumo + histórico + métricas + comentários.
- [ ] Dados do modal só carregam **quando o modal abre** (sem deixar Guest & CRM mais lento).
- [ ] Skeleton aparece durante carregamento e erro é tratado sem quebrar tela.
- [ ] Modal responsivo e consistente com padrões visuais do sistema.

### Implementacao (preencher ao finalizar)

- **Causa/Contexto tecnico:** o GuestView abre o ReservationDetailModal, mas o resumo 360 do hospede (estilo CRM & Ciclo) nao existia nesse fluxo. O ponto visual pedido era o nome do hospede e badge de reservas dentro do modal.
- **Solucao aplicada:** criado GuestSummaryModal como modal secundario, aberto ao clicar no nome/badge de reservas no ReservationDetailModal. O novo modal carrega dados sob demanda via React Query: financeiros detalhados da Stays (getDetailedFinancials) e observacoes internas do Firestore (guestNotes.get), com skeleton durante loading e fallback amigavel em erro.
- **Arquivos alterados:** components/GuestSummaryModal.tsx, components/ReservationDetailModal.tsx, docs/sprint 3/Task4.md.
- **Regras/Helpers criados ou ajustados:** helper local de normalizacao de nome e calculo de noites no novo modal para consolidar historico/metricas por hospede.
- **Impactos e compatibilidade:** sem alteracao no carregamento inicial do GuestView; o fetch pesado ocorre apenas ao abrir o modal de resumo. Mantido comportamento existente do modal principal e padrao visual responsivo (desktop/mobile).
- **Como testar (passo a passo):**
  1. Abrir Guest & CRM na visualizacao de reservas (GuestView) e clicar em uma reserva para abrir ReservationDetailModal.
  2. Clicar no nome do hospede (agora com estilo de link) ou no badge de N reservas.
  3. Validar abertura do GuestSummaryModal com skeleton inicial, depois metricas (total gasto/noites/estadias), historico de reservas e comentarios.
  4. Simular falha de rede da API financeira e validar mensagem de fallback sem quebrar a tela.
  5. Reabrir o mesmo hospede e validar reaproveitamento de cache do React Query (sem refetch imediato).
- **Observacoes:** regra de dados core preservada (Stays como fonte de reserva/financeiro e Firestore apenas para complemento de comentarios internos).
