

# Casapē Maintenance Hub

Sistema de gerenciamento de chamados (tickets) desenvolvido para a **Casapē Boutique de Imóveis**, integrando as equipes de Guest Relations e Manutenção com insights alimentados por IA.

## Funcionalidades

*   **Gestão de Chamados**: Criação, edição e acompanhamento de status (Aberto, Em Andamento, Concluído).
*   **Dashboards**:
    *   **Cards**: Visão geral rápida com indicadores visuais de urgência.
    *   **Lista**: Tabela detalhada para gestão em massa.
    *   **Calendário**: Visualização temporal dos agendamentos.
*   **Estatísticas & IA**: Gráficos de performance e análise qualitativa automática via Google Gemini 2.5 Flash.
*   **Gestão de Equipe (Admin)**: Controle de acesso, reset de senhas e exclusão de usuários.
*   **Configurações do Sistema (Admin)**: Cadastro dinâmico de Imóveis, Prioridades e Tipos de Serviço.

## Tecnologias

*   **Frontend**: React 18 (TypeScript)
*   **Estilização**: Tailwind CSS
*   **Ícones**: Lucide React
*   **Gráficos**: Recharts
*   **IA**: Google Gemini API (`@google/genai`)

## Instalação e Execução

Este projeto foi desenhado para rodar diretamente em navegadores modernos via ES Modules ou em plataformas como Vercel.

### Variáveis de Ambiente

Para habilitar a IA, crie um arquivo `.env` na raiz (se usar Vite/Build step) ou configure nas variáveis de ambiente da sua hospedagem:

```
VITE_API_KEY=sua_chave_api_google_gemini
```
ou
```
API_KEY=sua_chave_api_google_gemini
```

### Acesso Padrão (Demo)

*   **Admin**: `admin@casape.com` / `NAOACESSAR`
*   **Guest Relations**: `ana@casape.com` / `123`
*   **Manutenção**: `joao@casape.com` / `123`

## Estrutura do Projeto

*   `/components`: Componentes reutilizáveis (Login, Dashboard, Forms, Modais).
*   `/services`: Integração com APIs externas (Gemini AI).
*   `App.tsx`: Lógica principal, roteamento e gerenciamento de estado global.
*   `types.ts`: Definições de tipos TypeScript.
*   `constants.ts`: Dados iniciais (Mock) e configurações padrão.

---
Desenvolvido para Casapē Rio.
