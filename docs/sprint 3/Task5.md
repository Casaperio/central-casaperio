# Task 5 — Módulo Mapa: corrigir dados de imóveis vazios + alertas pendentes coerentes

## Contexto

O cliente reporta que o **Mapa** mostra dados incorretos (ex.: “25 imóveis vazios” irreal) e os alertas “!” exibem chamados antigos e chamados de **Limpeza de Checkout automática**, o que não deve aparecer como alerta de manutenção.

## O que precisa ser feito

- Validar fonte de dados do Mapa:
  - Confirmar se o cálculo de “vazios/ocupados” está usando a fonte correta (Stays) e o **período correto** (ex.: “agora/hoje”).
  - Revisar timezone e critérios de ocupação (reservas ativas vs futuras vs encerradas).
- Corrigir cálculo de imóveis vazios:
  - Ajustar lógica para refletir a realidade operacional (ex.: imóvel vazio = sem reserva ativa no momento).
  - Garantir que contagem e lista batam entre si.
- Corrigir alertas pendentes no Mapa:
  - O ícone “!” deve considerar **somente tickets relevantes**:
    - excluir “Limpeza de checkout automática”
    - excluir tickets antigos fora do período/estadia atual
  - Regra recomendada:
    - mostrar alertas apenas para tickets **não concluídos** e vinculados à **estadia atual** do imóvel (ou dentro do intervalo do período selecionado, se existir filtro).
  - No popup do imóvel, listar apenas esses chamados válidos (com data e tipo).
- Garantir consistência:
  - Os números do topo (vazios/ocupados/manutenção) devem bater com o que o mapa renderiza.
  - Não introduzir duplicidade nem cache desatualizado.

## Critérios de aceite

- [ ] Contagem/lista de imóveis vazios reflete a realidade (cálculo correto e consistente).
- [ ] “!” não aparece por chamados antigos e nem por “checkout automático”.
- [ ] Popup do imóvel lista somente chamados pendentes relevantes do período/estadia correta.
- [ ] Sem regressões no carregamento do mapa e nos filtros existentes.
