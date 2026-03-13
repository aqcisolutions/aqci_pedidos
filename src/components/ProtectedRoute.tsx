import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './UI';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-gray-500 font-medium">Verificando acesso...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("Validando acesso /admin");
  console.log("tipo_usuario esperado:", allowedRole);
  console.log("tipo_usuario recebido:", profile?.tipo_usuario);

  if (allowedRole && (!profile || profile.tipo_usuario !== allowedRole)) {
    // User is logged in but doesn't have the required role or profile is missing
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[32px] p-8 md:p-12 shadow-xl border border-gray-100 text-center"
        >
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Acesso Negado</h1>
          <p className="text-gray-500 text-sm font-medium mb-8">
            Você não tem permissão para acessar esta área do sistema.
          </p>
          <Button
            onClick={() => {
              // Redirect to their correct dashboard based on their actual role
              if (profile.tipo_usuario === 'gestor') {
                window.location.href = '/gestor';
              } else if (profile.tipo_usuario === 'admin_loja') {
                window.location.href = '/admin';
              } else {
                window.location.href = '/';
              }
            }}
            className="w-full py-4"
          >
            Ir para minha área
          </Button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
