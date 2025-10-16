// Context de autenticación con gestión de estado y refresh automático

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, UserInfo, UpdateUserInfoRequest, TwoFactorConfigRequest, TwoFactorConfigResponse } from '@/types/auth';
import { login as authLogin, register as authRegister, logout as authLogout, refreshToken } from '@/services/authService';
import { getUserInfo, updateUserInfo, resendConfirmationEmail, forgotPassword, resetPassword, confirmEmail, configure2FA } from '@/services/manageService';
import { 
  getAccessToken, 
  getRefreshToken, 
  getTokenExpiresAt, 
  setAccessToken, 
  setRefreshToken, 
  setTokenExpiresAt, 
  clearTokens, 
  isTokenExpired, 
  scheduleTokenRefresh 
} from '@/utils/tokenManager';
import { getFriendlyErrorMessage, isTwoFactorRequiredError, isLockoutError } from '@/utils/validators';

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar el contexto
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Estado de autenticación
  const [user, setUser] = useState<UserInfo | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Función para limpiar error
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  // Función para actualizar estado de autenticación
  const updateAuthState = useCallback((token: string | null, userInfo: UserInfo | null) => {
    setAccessTokenState(token);
    setIsAuthenticated(!!token && !!userInfo);
    setUser(userInfo);
  }, []);

  // Función para hacer login
  const login = useCallback(async (email: string, password: string, twoFactorCode?: string) => {
    try {
      setIsLoading(true);
      clearError();

      const response = await authLogin(email, password, twoFactorCode);
      
      // Obtener información del usuario
      const userInfo = await getUserInfo();
      
      // Actualizar estado
      updateAuthState(response.accessToken, userInfo);
      
      // Programar refresh automático
      scheduleTokenRefresh(response.expiresIn, refreshSession);
      
      // Navegar al dashboard
      navigate('/dashboard');
      
    } catch (error: any) {
      const errorMessage = getFriendlyErrorMessage(error);
      setLastError(errorMessage);
      
      // Si requiere 2FA, no navegar
      if (isTwoFactorRequiredError(error)) {
        throw new Error('2FA_REQUIRED');
      }
      
      // Si es lockout, mostrar mensaje específico
      if (isLockoutError(error)) {
        setLastError('Cuenta bloqueada por 5 minutos debido a múltiples intentos fallidos');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, clearError, updateAuthState]);

  // Función para registrar usuario
  const register = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();

      await authRegister(email, password);
      
      // Navegar a login con mensaje de éxito
      navigate('/login?registered=true');
      
    } catch (error: any) {
      const errorMessage = getFriendlyErrorMessage(error);
      setLastError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, clearError]);

  // Función interna para cerrar sesión sin redirección
  const clearAuthState = useCallback(() => {
    authLogout();
    updateAuthState(null, null);
    setLastError(null);
  }, [updateAuthState]);

  // Función para cerrar sesión
  const logout = useCallback(() => {
    clearAuthState();
    navigate('/login');
  }, [clearAuthState, navigate]);

  // Función para refresh de sesión
  const refreshSession = useCallback(async () => {
    try {
      const refreshTokenValue = getRefreshToken();
      
      if (!refreshTokenValue) {
        throw new Error('No hay refresh token disponible');
      }

      const response = await refreshToken(refreshTokenValue);
      
      // Obtener información actualizada del usuario
      const userInfo = await getUserInfo();
      
      // Actualizar estado
      updateAuthState(response.accessToken, userInfo);
      
      // Programar próximo refresh
      scheduleTokenRefresh(response.expiresIn, refreshSession);
      
    } catch (error) {
      console.error('Error al refrescar sesión:', error);
      // Si falla el refresh, cerrar sesión
      logout();
    }
  }, [logout, updateAuthState]);

  // Función para restaurar sesión al cargar la app
  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();

      // Intentar obtener información del usuario directamente
      // Esto funcionará si hay una cookie de sesión válida
      try {
        const userInfo = await getUserInfo();
        
        // Si obtenemos la info del usuario, significa que hay una sesión válida
        const token = getAccessToken();
        updateAuthState(token, userInfo);
        
        // Programar refresh si es necesario y tenemos tokens
        const expiresAt = getTokenExpiresAt();
        if (expiresAt) {
          const expiresIn = Math.floor((expiresAt - Date.now()) / 1000);
          if (expiresIn > 60) {
            scheduleTokenRefresh(expiresIn, refreshSession);
          }
        }
        
        return;
      } catch (userInfoError: any) {
        // Si es un error de redirección o 401/403, la sesión no es válida
        if (userInfoError.isRedirect || userInfoError.status === 401 || userInfoError.status === 403) {
          console.log('Sesión no válida, redirigiendo al login...');
          // Limpiar estado y redirigir al login
          clearAuthState();
          navigate('/login');
          return;
        }
        // Si no podemos obtener info del usuario, intentar con tokens
        const token = getAccessToken();
        const refreshTokenValue = getRefreshToken();
        
        if (!token || !refreshTokenValue) {
          setIsLoading(false);
          return;
        }

        // Si el token está expirado, intentar refresh
        if (isTokenExpired()) {
          await refreshSession();
        } else {
          // Obtener información del usuario
          const userInfo = await getUserInfo();
          updateAuthState(token, userInfo);
          
          // Programar refresh si es necesario
          const expiresAt = getTokenExpiresAt();
          if (expiresAt) {
            const expiresIn = Math.floor((expiresAt - Date.now()) / 1000);
            if (expiresIn > 60) {
              scheduleTokenRefresh(expiresIn, refreshSession);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error al restaurar sesión:', error);
      // Si falla la restauración, limpiar estado
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  }, [clearError, refreshSession, updateAuthState, clearAuthState, navigate]);

  // Función para actualizar información del usuario
  const updateUserInfoHandler = useCallback(async (data: UpdateUserInfoRequest) => {
    try {
      clearError();
      const response = await updateUserInfo(data);
      
      // Actualizar información del usuario en el estado
      setUser(prev => prev ? { ...prev, ...response } : null);
      
    } catch (error: any) {
      const errorMessage = getFriendlyErrorMessage(error);
      setLastError(errorMessage);
      throw error;
    }
  }, [clearError]);

  // Función para reenviar confirmación de email
  const resendConfirmationEmailHandler = useCallback(async (email: string) => {
    try {
      clearError();
      await resendConfirmationEmail(email);
    } catch (error: any) {
      const errorMessage = getFriendlyErrorMessage(error);
      setLastError(errorMessage);
      throw error;
    }
  }, [clearError]);

  // Función para olvidé mi contraseña
  const forgotPasswordHandler = useCallback(async (email: string) => {
    try {
      clearError();
      await forgotPassword(email);
    } catch (error: any) {
      const errorMessage = getFriendlyErrorMessage(error);
      setLastError(errorMessage);
      throw error;
    }
  }, [clearError]);

  // Función para resetear contraseña
  const resetPasswordHandler = useCallback(async (email: string, newPassword: string, resetCode: string) => {
    try {
      clearError();
      await resetPassword(email, newPassword, resetCode);
    } catch (error: any) {
      const errorMessage = getFriendlyErrorMessage(error);
      setLastError(errorMessage);
      throw error;
    }
  }, [clearError]);

  // Función para confirmar email
  const confirmEmailHandler = useCallback(async (userId: string, code: string, changedEmail?: string) => {
    try {
      clearError();
      await confirmEmail(userId, code, changedEmail);
      
      // Actualizar estado del usuario
      setUser(prev => prev ? { ...prev, isEmailConfirmed: true } : null);
      
    } catch (error: any) {
      const errorMessage = getFriendlyErrorMessage(error);
      setLastError(errorMessage);
      throw error;
    }
  }, [clearError]);

  // Función para configurar 2FA
  const configure2FAHandler = useCallback(async (config: TwoFactorConfigRequest): Promise<TwoFactorConfigResponse> => {
    try {
      clearError();
      const response = await configure2FA(config);
      
      // Actualizar estado del usuario si se activa/desactiva 2FA
      if (config.enable !== undefined) {
        setUser(prev => prev ? { ...prev, isTwoFactorEnabled: config.enable } : null);
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = getFriendlyErrorMessage(error);
      setLastError(errorMessage);
      throw error;
    }
  }, [clearError]);

  // Efecto para restaurar sesión al montar el componente
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Efecto para sincronizar accessToken con el estado
  useEffect(() => {
    const token = getAccessToken();
    setAccessTokenState(token);
  }, []);

  // Valor del contexto
  const value: AuthContextType = {
    // Estado
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    lastError,

    // Acciones
    login,
    register,
    logout,
    refreshSession,
    restoreSession,
    clearError,

    // Gestión de cuenta
    updateUserInfo: updateUserInfoHandler,
    resendConfirmationEmail: resendConfirmationEmailHandler,
    forgotPassword: forgotPasswordHandler,
    resetPassword: resetPasswordHandler,
    confirmEmail: confirmEmailHandler,

    // 2FA
    configure2FA: configure2FAHandler,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
