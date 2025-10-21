// Componente para proteger rutas con restauración de sesión

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isLoading, restoreSession } = useAuthContext();
  const location = useLocation();
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);

  useEffect(() => {
    // Solo intentar restaurar sesión una vez
    if (!hasAttemptedRestore && !isAuthenticated && !isLoading) {
      setHasAttemptedRestore(true);
      restoreSession();
    }
  }, [isAuthenticated, isLoading, hasAttemptedRestore, restoreSession]);

  // Mostrar loading mientras se verifica autenticación
  if (isLoading || (!hasAttemptedRestore && !isAuthenticated)) {
    return fallback || (
      <div className="min-h-screen bg-niawi-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-niawi-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Restaurando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado después de intentar restaurar, no renderizar nada
  // El AuthContext manejará la redirección a login
  if (!isAuthenticated) {
    return null;
  }

  // Usuario autenticado, renderizar children
  return <>{children}</>;
};

export default ProtectedRoute;


