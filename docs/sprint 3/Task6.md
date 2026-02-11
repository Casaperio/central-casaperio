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

# Task 7 — Puxar senha correta do Wi-Fi pela Stays e exibir em Imóveis + Modo Tablet

## Contexto

A API da **Stays** fornece a senha do Wi-Fi dos imóveis, mas no módulo **Imóveis** essa informação não está aparecendo (vazio). O cliente quer exibir **nome da rede e senha** em Imóveis e também no **Modo Tablet** do respectivo imóvel.

## O que precisa ser feito

- Identificar no payload da Stays onde está:
  - SSID / Nome da rede
  - Senha do Wi-Fi
    (pode ser campo direto ou aninhado; mapear corretamente)
- Módulo Imóveis:
  - Exibir Wi-Fi (Nome da rede + Senha) no detalhe do imóvel (UI existente).
  - Se já existir card de Wi-Fi (como no exemplo), preencher com dados reais.
  - Fallback:
    - se não houver senha/nome, mostrar “Não informado” sem quebrar layout.
- Modo Tablet:
  - Exibir Wi-Fi do imóvel atual na tela correspondente (onde já faz sentido para o hóspede/verificação).
  - Manter design consistente com a seção Wi-Fi já existente (se houver).
- Restrições importantes:
  - **Não duplicar** dados da Stays no Firebase/Firestore (Stays é read-only para reservas/imóveis).
  - Pode usar cache em memória para evitar refetch excessivo, mas sempre com possibilidade de atualizar.
- UX:
  - Garantir que dados não “pisquem”/sumam (estado de loading e fallback coerente).

## Critérios de aceite

- [ ] Wi-Fi (nome + senha) aparece corretamente no módulo Imóveis quando a Stays fornecer.
- [ ] Wi-Fi aparece também no modo Tablet do imóvel.
- [ ] Se não existir dado, UI mostra fallback (“Não informado”) sem quebrar.
- [ ] Não há persistência indevida no Firebase/Firestore (somente leitura da Stays).
- [ ] Sem regressões em carregamento e navegação.
