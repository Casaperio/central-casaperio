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

- [ ] A partir de hoje, todo ticket **não concluído** que ficar atrasado aparece em **Atrasados** e não some.
- [ ] Tickets antigos (antes do marco) não poluem a tela (não reintroduzir backlog inteiro).
- [ ] Concluir o chamado remove ele da seção Atrasados.
- [ ] Não há regressão em cards/lista/calendário e nem em filtros existentes.
