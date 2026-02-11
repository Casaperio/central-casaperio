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
