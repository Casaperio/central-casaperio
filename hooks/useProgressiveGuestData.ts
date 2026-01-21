import { useState, useEffect } from 'react';
import { useStaysData } from './useStaysData';
import { getDefaultPeriodForRoute } from '../utils/performanceUtils';

/**
 * 🚀 PROGRESSIVE LOADING para Guest & CRM
 * 
 * Estratégia de carregamento em duas etapas:
 * 1. Carrega "HOJE" primeiro (rápido, ~2-5s)
 * 2. Expande para 7 dias em background (sem bloquear UI)
 * 
 * Melhora percepção de velocidade sem comprometer UX
 */
export function useProgressiveGuestData() {
  const [loadingStage, setLoadingStage] = useState<'today' | 'expanding' | 'complete'>('today');
  
  // Stage 1: Carregar apenas HOJE (período mínimo)
  const today = new Date().toISOString().split('T')[0];
  const todayPeriod = {
    from: today,
    to: today,
    routeIdentifier: 'guest',
  };
  
  // Stage 2: Período completo (7 dias)
  const fullPeriod = {
    ...getDefaultPeriodForRoute('guest', 'normal'),
    routeIdentifier: 'guest',
  };
  
  // Determinar qual período usar baseado no estágio
  const activePeriod = loadingStage === 'today' ? todayPeriod : fullPeriod;
  
  // Fetch com período ativo
  const staysData = useStaysData(activePeriod);
  
  // Quando stage 1 terminar, iniciar stage 2
  useEffect(() => {
    if (loadingStage === 'today' && !staysData.loading && !staysData.isFetching) {
      console.log('✅ [Progressive Loading] Stage 1 complete (TODAY), expanding to 7 days...');
      
      // Aguardar 500ms para UI renderizar, depois expandir
      const timer = setTimeout(() => {
        setLoadingStage('expanding');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loadingStage, staysData.loading, staysData.isFetching]);
  
  // Quando stage 2 terminar, marcar como completo
  useEffect(() => {
    if (loadingStage === 'expanding' && !staysData.loading && !staysData.isFetching) {
      console.log('✅ [Progressive Loading] Stage 2 complete (7 DAYS)');
      setLoadingStage('complete');
    }
  }, [loadingStage, staysData.loading, staysData.isFetching]);
  
  return {
    ...staysData,
    // Override loading para mostrar "complete" apenas quando tudo terminar
    isProgressiveLoading: loadingStage !== 'complete',
    loadingStage,
    // Dados parciais disponíveis desde stage 1
    hasPartialData: loadingStage !== 'today' || !staysData.loading,
  };
}
