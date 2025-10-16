import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  const navigate = useNavigate();
  const authContext = useAuthContext();

  const requireAuth = () => {
    if (!authContext.isLoading && !authContext.isAuthenticated) {
      navigate('/login');
    }
  };

  return {
    isAuthenticated: authContext.isAuthenticated,
    isLoading: authContext.isLoading,
    user: authContext.user,
    lastError: authContext.lastError,
    logout: authContext.logout,
    login: authContext.login,
    register: authContext.register,
    requireAuth,
    clearError: authContext.clearError,
    // Funciones de gestión de cuenta
    updateUserInfo: authContext.updateUserInfo,
    resendConfirmationEmail: authContext.resendConfirmationEmail,
    forgotPassword: authContext.forgotPassword,
    resetPassword: authContext.resetPassword,
    confirmEmail: authContext.confirmEmail,
    // Funciones de 2FA
    configure2FA: authContext.configure2FA,
  };
}; 