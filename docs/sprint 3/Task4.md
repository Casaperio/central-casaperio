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
