import { User, AppModule, ViewMode } from '../types';

/**
 * Mapeamento de ViewModes para seus respectivos módulos necessários
 * Define qual permissão de módulo é necessária para acessar cada visualização
 *
 * REGRA: Se não está explicitamente permitido, é bloqueado.
 *
 * TIPOS ESPECIAIS:
 * - null: Acessível a todos (mesmo não autenticados)
 * - 'generic': Valida pelo activeModule
 * - 'any-except-maintenance': Acessível a todos exceto Maintenance
 * - 'management': Apenas Admin/Management
 */
export const VIEW_MODULE_MAP: Record<ViewMode, AppModule | 'any' | 'generic' | 'any-except-maintenance' | null> = {
  // Landing e profile são acessíveis a todos
  'landing': null,
  'profile': null,
  'settings': null,

  // ===== VIEWS GENÉRICAS (dependem do activeModule) =====
  // Estas views são usadas por múltiplos módulos (maintenance, concierge, guest)
  // A validação é feita pelo activeModule, não pelo view mode
  'cards': 'generic',
  'list': 'generic',
  'calendar': 'generic',
  'weekly-planning': 'generic',

  // ===== RESERVATIONS (Calendário Geral / Mapa Geral) =====
  // IMPORTANTE: 'general-calendar' é para RESERVAS, não Guest
  'general-calendar': 'reservations',

  // ===== GUEST & CRM =====
  'guest-crm': 'guest',      // CRM & Ciclo
  'cms': 'guest',            // CMS Tablet
  'feedbacks': 'guest',      // Avaliações

  // ===== CONCIERGE =====
  'concierge-cms': 'concierge',  // Gestão de Ofertas

  // ===== INVENTORY =====
  'inventory': 'inventory',

  // ===== OFFICE =====
  'office': 'office',

  // ===== MANAGEMENT (Admin) =====
  'admin': 'management',       // Acessos
  'financial': 'management',   // Financeiro
  'logs': 'management',        // Logs do sistema

  // ===== FERRAMENTAS GERAIS (EXCETO MAINTENANCE) =====
  // Estas ferramentas são úteis para todos os perfis, EXCETO Maintenance
  'properties': 'any-except-maintenance',  // Gestão de Imóveis
  'map': 'any-except-maintenance',         // Mapa de propriedades
  'flights': 'any-except-maintenance',     // Monitoramento de Voos
  'stats': 'any-except-maintenance',       // Estatísticas
  'messages': 'any-except-maintenance',    // Mensagens (inbox)
  'reports': 'any-except-maintenance',     // Relatórios

  // ===== BOARDS & FIELD APP =====
  'boards': 'boards',
  'field-app': 'field_app',

  // ===== HISTORY =====
  'history': 'any-except-maintenance',     // Histórico (todos exceto Maintenance)
};

/**
 * Verifica se o usuário pode acessar um módulo específico
 */
export function canAccessModule(user: User | null, module: AppModule): boolean {
  if (!user) return false;

  // Admin pode acessar tudo
  if (user.role === 'Admin') return true;

  // Se não tem allowedModules definido, assume que pode acessar tudo (backward compatibility)
  if (!user.allowedModules || user.allowedModules.length === 0) return true;

  // Verifica se o módulo está na lista de permitidos
  return user.allowedModules.includes(module);
}

/**
 * Verifica se o usuário pode acessar uma visualização específica
 * IMPORTANTE: Esta função deve ser usada junto com activeModule para validação completa
 */
export function canAccessView(user: User | null, viewMode: ViewMode, activeModule?: AppModule | null): boolean {
  if (!user) return false;

  // Admin pode acessar tudo
  if (user.role === 'Admin') return true;

  const requiredModule = VIEW_MODULE_MAP[viewMode];

  // Views que não requerem módulo específico (landing, profile, settings)
  if (requiredModule === null) return true;

  // Views acessíveis a qualquer módulo EXCETO Maintenance
  if (requiredModule === 'any-except-maintenance') {
    // Se tem allowedModules definido
    if (user.allowedModules && user.allowedModules.length > 0) {
      // Bloquear se o usuário tem APENAS maintenance
      const hasOnlyMaintenance =
        user.allowedModules.length === 1 &&
        user.allowedModules[0] === 'maintenance';

      if (hasOnlyMaintenance) {
        return false; // ❌ Maintenance não pode acessar
      }

      return true; // ✅ Outros módulos podem acessar
    }

    // Se não tem allowedModules, assume acesso total (backward compatibility)
    if (!user.allowedModules || user.allowedModules.length === 0) return true;

    return false;
  }

  // Views acessíveis a qualquer módulo
  if (requiredModule === 'any') {
    // Se tem allowedModules definido, precisa ter pelo menos um módulo
    if (user.allowedModules && user.allowedModules.length > 0) return true;
    // Se não tem allowedModules, assume acesso total (backward compatibility)
    if (!user.allowedModules || user.allowedModules.length === 0) return true;
    return false;
  }

  // IMPORTANTE: Views genéricas dependem do activeModule
  if (requiredModule === 'generic') {
    if (!activeModule) {
      // Se não temos activeModule, não podemos validar view genérica
      return false;
    }
    // Valida se o usuário pode acessar o módulo ativo
    return canAccessModule(user, activeModule);
  }

  // Verifica permissão do módulo específico mapeado
  return canAccessModule(user, requiredModule);
}

/**
 * Retorna o primeiro módulo que o usuário tem permissão de acessar
 * Usado para redirecionar após login ou quando tenta acessar área não permitida
 */
export function getFirstAllowedModule(user: User | null): AppModule | null {
  if (!user) return null;

  // Admin pode acessar tudo, retorna maintenance como padrão
  if (user.role === 'Admin') return 'maintenance';

  // Se não tem allowedModules ou está vazio, retorna maintenance (backward compatibility)
  if (!user.allowedModules || user.allowedModules.length === 0) return 'maintenance';

  // Retorna o primeiro módulo permitido
  return user.allowedModules[0];
}

/**
 * Retorna todas as views que o usuário pode acessar
 */
export function getAllowedViews(user: User | null): ViewMode[] {
  if (!user) return [];

  return Object.keys(VIEW_MODULE_MAP).filter(viewMode =>
    canAccessView(user, viewMode as ViewMode)
  ) as ViewMode[];
}

/**
 * Retorna uma mensagem de erro personalizada quando o acesso é negado
 */
export function getAccessDeniedMessage(user: User | null): string {
  if (!user) return 'Você precisa estar autenticado para acessar esta página.';

  const allowedModules = user.allowedModules || [];

  if (allowedModules.length === 0) {
    return 'Você não tem permissão para acessar nenhum módulo. Entre em contato com o administrador.';
  }

  if (allowedModules.length === 1) {
    const moduleName = getModuleName(allowedModules[0]);
    return `Você só tem permissão para acessar o módulo: ${moduleName}`;
  }

  const moduleNames = allowedModules.map(m => getModuleName(m)).join(', ');
  return `Você só tem permissão para acessar os módulos: ${moduleNames}`;
}

/**
 * Retorna o nome amigável de um módulo
 */
export function getModuleName(module: AppModule): string {
  const names: Record<AppModule, string> = {
    'maintenance': 'Manutenção',
    'concierge': 'Concierge',
    'guest': 'Guest & CRM',
    'reservations': 'Reservas',
    'inventory': 'Inventário',
    'office': 'Escritório',
    'management': 'Gestão',
    'kiosk': 'Quiosque',
    'boards': 'Painéis',
    'field_app': 'Campo',
  };

  return names[module] || module;
}

/**
 * Retorna a view padrão para um módulo
 */
export function getDefaultViewForModule(module: AppModule): ViewMode {
  const defaults: Record<AppModule, ViewMode> = {
    'maintenance': 'cards',
    'concierge': 'cards',
    'guest': 'guest-crm',              // Guest usa CRM & Ciclo como padrão
    'reservations': 'general-calendar', // Reservas usa Calendário Geral
    'inventory': 'inventory',
    'office': 'office',
    'management': 'admin',
    'kiosk': 'landing',
    'boards': 'boards',
    'field_app': 'field-app',
  };

  return defaults[module] || 'cards';
}
