import { RefreshCw, Loader } from 'lucide-react';
import { format } from 'date-fns';

interface LoadingStateProps {
  lastUpdated: Date | null;
  loading?: boolean;
}

export function LoadingState({ lastUpdated, loading }: LoadingStateProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader className="h-4 w-4 animate-spin" />
        <span>Carregando...</span>
      </div>
    );
  }

  if (lastUpdated) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <RefreshCw className="h-4 w-4" />
        <span>Atualizado: {format(lastUpdated, 'HH:mm:ss')}</span>
      </div>
    );
  }

  return null;
}
