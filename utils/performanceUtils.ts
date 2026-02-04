/**
 * Performance Utilities
 * Medição e logging de performance
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isDev = import.meta.env.DEV;

  start(name: string) {
    if (!this.isDev) return;
    
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
    });
  }

  end(name: string) {
    if (!this.isDev) return;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`⚠️ Performance metric "${name}" not started`);
      return;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    console.log(`⏱️ ${name}: ${metric.duration.toFixed(2)}ms`);
    return metric.duration;
  }

  measure(name: string, fn: () => void | Promise<void>): void | Promise<void> {
    if (!this.isDev) {
      return fn();
    }

    this.start(name);
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => this.end(name));
    } else {
      this.end(name);
      return result;
    }
  }

  getSummary(): string {
    if (!this.isDev) return '';

    const metrics = Array.from(this.metrics.values())
      .filter(m => m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));

    if (metrics.length === 0) return 'No metrics recorded';

    const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    
    let summary = '\n📊 Performance Summary:\n';
    summary += '═'.repeat(50) + '\n';
    
    metrics.forEach(m => {
      const percent = ((m.duration || 0) / total * 100).toFixed(1);
      summary += `  ${m.name.padEnd(30)} ${m.duration?.toFixed(2).padStart(8)}ms (${percent}%)\n`;
    });
    
    summary += '─'.repeat(50) + '\n';
    summary += `  ${'TOTAL'.padEnd(30)} ${total.toFixed(2).padStart(8)}ms\n`;
    summary += '═'.repeat(50);

    return summary;
  }

  reset() {
    this.metrics.clear();
  }
}

export const perfMonitor = new PerformanceMonitor();

/**
 * Calcula período padrão baseado no módulo/rota
 */
export function getDefaultPeriodForRoute(route: string, mode?: 'normal' | 'canvas'): { from: string; to: string } {
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Canvas sempre 6 meses a partir de hoje
  if (mode === 'canvas') {
    // Task 2: Canvas com range expandido - 3 meses para trás, 9 meses para frente
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 90); // 3 meses antes
    
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 270); // 9 meses depois
    
    return {
      from: formatDate(startDate),
      to: formatDate(endDate),
    };
  }

  // Períodos por rota
  switch (route) {
    case 'maintenance':
    case 'guest':
      // Manutenção e Guest CRM: -7 dias até +30 dias
      const maintenanceStart = new Date(today);
      maintenanceStart.setDate(maintenanceStart.getDate() - 7);
      const maintenanceEnd = new Date(today);
      maintenanceEnd.setDate(maintenanceEnd.getDate() + 30);
      return {
        from: formatDate(maintenanceStart),
        to: formatDate(maintenanceEnd),
      };

    case 'reservations':
      // Mapa geral (modo normal): mês atual até +3 meses
      const reservationsStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const reservationsEnd = new Date(today.getFullYear(), today.getMonth() + 3, 0);
      return {
        from: formatDate(reservationsStart),
        to: formatDate(reservationsEnd),
      };

    case 'management':
    case 'commercial':
      // Gestão e Comercial: -30 dias até +60 dias
      const mgmtStart = new Date(today);
      mgmtStart.setDate(mgmtStart.getDate() - 30);
      const mgmtEnd = new Date(today);
      mgmtEnd.setDate(mgmtEnd.getDate() + 60);
      return {
        from: formatDate(mgmtStart),
        to: formatDate(mgmtEnd),
      };

    default:
      // Fallback seguro: -30 dias até +90 dias
      const defaultStart = new Date(today);
      defaultStart.setDate(defaultStart.getDate() - 30);
      const defaultEnd = new Date(today);
      defaultEnd.setDate(defaultEnd.getDate() + 90);
      return {
        from: formatDate(defaultStart),
        to: formatDate(defaultEnd),
      };
  }
}
