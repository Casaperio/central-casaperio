/**
 * 🔄 AUTO-REFRESH INTELIGENTE
 * 
 * Define políticas de refetch por rota/módulo
 * Balanceia atualização automática vs performance
 */

/**
 * Retorna intervalo de refetch em milissegundos baseado na rota
 * 
 * Rotas com dados que mudam mais frequentemente = intervalo menor
 * Rotas pesadas (canvas) = intervalo maior
 */
export function getRefetchInterval(routeIdentifier: string): number {
  const MINUTE = 60 * 1000;

  const intervals: Record<string, number> = {
    // Dados que mudam frequentemente - refetch mais rápido
    'guest': 3 * MINUTE,           // Hóspedes: check-ins/outs acontecem
    'maintenance': 3 * MINUTE,     // Manutenção: tickets criados frequentemente
    
    // Dados moderados
    'reservations': 5 * MINUTE,    // Reservas: atualizam, mas menos que guest
    'management': 5 * MINUTE,      // Gestão: relatórios e métricas
    
    // Dados pesados - refetch mais lento
    'canvas': 8 * MINUTE,          // Mapa Geral: 6 meses de dados, render pesado
    
    // Fallback
    'default': 5 * MINUTE,         // Padrão: 5 minutos
  };

  return intervals[routeIdentifier] || intervals['default'];
}

/**
 * Define se deve fazer refetch com aba em background
 * 
 * Recomendação: sempre false para evitar processamento pesado sem usuário ver
 */
export function shouldRefetchInBackground(_routeIdentifier: string): boolean {
  // Nunca refetch em background - economiza CPU/bateria
  // Usuário não está vendo, não precisa atualizar
  return false;
}

/**
 * Define se deve refetch ao focar janela
 * 
 * true = usuário volta para aba, busca dados frescos
 */
export function shouldRefetchOnWindowFocus(_routeIdentifier: string): boolean {
  // Sempre refetch ao focar - usuário quer dados atuais
  return true;
}

/**
 * Gera fingerprint simples dos dados para detectar mudanças reais
 * 
 * Evita reprocessamento pesado quando API retorna mesmos dados
 * Usa campos ESTÁVEIS (não voláteis como timestamps)
 */
export function generateDataFingerprint(data: any): string {
  if (!data) return 'empty';

  try {
    // Cria hash simples baseado em tamanhos e IDs (campos estáveis)
    const calendarUnitsCount = data.calendar?.units?.length || 0;
    const dashboardGroupsCount = data.dashboard?.agendaGroups?.length || 0;
    
    // Usar IDs de reservas ao invés de timestamps voláteis
    const reservationIds = data.calendar?.units
      ?.flatMap((unit: any) => unit.reservations || [])
      .map((r: any) => r.id)
      .sort()
      .join(',')
      .substring(0, 100); // Primeiros 100 chars dos IDs
    
    // Hash simples mas estável
    const hash = `${calendarUnitsCount}_${dashboardGroupsCount}_${reservationIds}`;
    
    return hash;
  } catch (e) {
    // Fallback: sempre diferente se der erro (força update)
    console.warn('[Fingerprint] Erro ao gerar fingerprint:', e);
    return `error_${Date.now()}`;
  }
}

/**
 * Configuração global de auto-refresh
 */
export const AUTO_REFRESH_CONFIG = {
  enabled: true,                    // Auto-refresh habilitado globalmente
  pauseWhenHidden: true,            // Pausar quando aba oculta
  refetchOnFocus: true,             // Refetch ao voltar para aba
  backgroundRefetch: false,         // Nunca refetch em background
  minIntervalMs: 3 * 60 * 1000,     // Mínimo: 3 minutos
  maxIntervalMs: 10 * 60 * 1000,    // Máximo: 10 minutos
} as const;
