import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import { ShieldAlert } from 'lucide-react';
import { Button } from './ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requireBackoffice?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireBackoffice,
}) => {
  const { user, isLoading, canAccessBackoffice } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#151e33]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff63f6] border-t-transparent shadow-stitch-glow" />
          <p className="text-sm font-medium text-white/70">A carregar a YME APP...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check Backoffice specific access (Admin, Director, HR, Legal Head/Manager)
  if (requireBackoffice && !canAccessBackoffice) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="rounded-2xl border border-[#ff63f6]/40 bg-[#ff63f6]/10 p-4 mb-4 text-[#ff63f6]">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold text-[#151e33] mb-2">Acesso Reservado</h2>
        <p className="max-w-md text-sm text-[#151e33]/60 mb-6 font-medium">
          Esta área é restrita a membros da Executive Board, Direção, Recursos Humanos e Legal & Finance.
        </p>
        <Button variant="primary" onClick={() => (window.location.href = '/')}>
          Voltar à Minha Jornada
        </Button>
      </div>
    );
  }

  // Check explicit roles if passed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="rounded-2xl border border-[#ff63f6]/40 bg-[#ff63f6]/10 p-4 mb-4 text-[#ff63f6]">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold text-[#151e33] mb-2">Acesso Restrito</h2>
        <p className="max-w-md text-sm text-[#151e33]/60 mb-6 font-medium">
          O teu perfil atual não tem permissões para aceder a esta secção.
        </p>
        <Button variant="primary" onClick={() => (window.location.href = '/')}>
          Voltar à Minha Jornada
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
