# Task 6 — Módulo CRM & Ciclo: validar fonte correta + corrigir cálculos/dados incorretos

## Contexto

O cliente também reporta dados incorretos no **CRM & Ciclo**. Pode ser fonte errada, cache desatualizado ou lógica de cálculo equivocada (ex.: total gasto, nº de estadias, métricas agregadas).

## O que precisa ser feito

- Auditoria rápida do fluxo:
  - Identificar de onde o CRM & Ciclo busca dados.
  - Verificar se existe **cache** e se pode estar desatualizado (key errada, TTL inexistente, fallback antigo etc.).
- Validar e corrigir cálculos principais:
  - total de estadias
  - total de noites
  - total gasto (LTV)
  - status/segmentações (ex.: in-house, futuro, checkout)
- Consistência entre módulos:
  - Garantir que métricas do CRM & Ciclo sejam coerentes com dados exibidos em Guest & CRM e Reservas.
- Performance:
  - Evitar refetch em loop.
  - Se houver cache, garantir invalidation coerente ao atualizar dados (ex.: botão “atualizando dados…”).
- Observabilidade (mínimo):
  - Adicionar logs/guards pontuais (sem poluir) para facilitar diagnóstico quando dado vier vazio/inconsistente.

## Critérios de aceite

- [ ] CRM & Ciclo usa fonte correta e exibe números coerentes (sem discrepâncias óbvias).
- [ ] Cálculos de LTV/noites/estadias corrigidos.
- [ ] Cache (se existir) não fica “preso” em valor antigo; atualização reflete corretamente.
- [ ] Sem regressões no carregamento e na navegação do módulo.
