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
