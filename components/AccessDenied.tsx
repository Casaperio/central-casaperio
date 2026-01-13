import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { User } from '../types';
import { getAccessDeniedMessage, getFirstAllowedModule, getModuleName } from '../utils/permissions';

interface AccessDeniedProps {
  currentUser: User;
  attemptedView?: string;
  onNavigateToAllowed: () => void;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ currentUser, attemptedView, onNavigateToAllowed }) => {
  const message = getAccessDeniedMessage(currentUser);
  const allowedModule = getFirstAllowedModule(currentUser);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="bg-red-100 rounded-full p-4">
            <ShieldAlert size={48} className="text-red-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>

        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {attemptedView && (
          <p className="text-sm text-gray-500 mb-6">
            Você tentou acessar: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{attemptedView}</span>
          </p>
        )}

        {allowedModule && (
          <button
            onClick={onNavigateToAllowed}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Ir para {getModuleName(allowedModule)}
          </button>
        )}

        <p className="text-xs text-gray-500 mt-6">
          Se você acredita que deveria ter acesso a esta área, entre em contato com o administrador do sistema.
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;
