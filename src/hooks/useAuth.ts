import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const authStatus = localStorage.getItem('niawi-auth');
    setIsAuthenticated(authStatus === 'authenticated');
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('niawi-auth');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  };

  return {
    isAuthenticated,
    isLoading,
    logout,
    requireAuth
  };
}; 