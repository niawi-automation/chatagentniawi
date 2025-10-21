// Servicio de autenticación

import { makeLoginRequest, makeRegisterRequest } from './apiClient';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RefreshTokenRequest, 
  RefreshTokenResponse 
} from '@/types/auth';
import { 
  setAccessToken, 
  setRefreshToken, 
  setTokenExpiresAt, 
  clearTokens 
} from '@/utils/tokenManager';

/**
 * Realizar login de usuario
 */
export const login = async (
  email: string,
  password: string,
  twoFactorCode?: string
): Promise<LoginResponse> => {
  const loginData: LoginRequest = {
    email: email.trim(),
    password,
  };

  // Agregar código 2FA si se proporciona
  if (twoFactorCode) {
    loginData.twoFactorCode = twoFactorCode;
  }

  try {
    // Usar useCookies=false para recibir el refreshToken en el response JSON
    // Esto evita problemas con cookies HTTP-only y redirecciones HTTP del backend
    const response = await makeLoginRequest<LoginResponse>(
      '/auth/login?useCookies=false',
      loginData
    );

    console.log('📦 Response del backend:', response);

    // Guardar tokens (con useCookies=false, todos vienen en el JSON)
    if (!response.accessToken || !response.refreshToken) {
      throw new Error('El backend no devolvió los tokens necesarios');
    }
    
    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    setTokenExpiresAt(Date.now() + (response.expiresIn * 1000));

    return response;
  } catch (error: any) {
    // Re-lanzar el error con información adicional
    throw {
      ...error,
      message: error.message || 'Error al iniciar sesión',
      status: error.status,
    };
  }
};

/**
 * Registrar nuevo usuario
 */
export const register = async (
  email: string,
  password: string
): Promise<void> => {
  const registerData: RegisterRequest = {
    email: email.trim(),
    password,
  };

  try {
    await makeRegisterRequest<void>('/auth/register', registerData);
  } catch (error: any) {
    // Re-lanzar el error con información adicional
    throw {
      ...error,
      message: error.message || 'Error al registrar usuario',
      status: error.status,
    };
  }
};

/**
 * Renovar token de acceso usando refresh token
 */
export const refreshToken = async (
  refreshTokenValue: string
): Promise<RefreshTokenResponse> => {
  const refreshData: RefreshTokenRequest = {
    refreshToken: refreshTokenValue,
  };

  try {
    const response = await makeLoginRequest<RefreshTokenResponse>(
      '/auth/refresh',
      refreshData
    );

    // Guardar nuevos tokens
    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    setTokenExpiresAt(Date.now() + (response.expiresIn * 1000));

    return response;
  } catch (error: any) {
    // Si el refresh falla, limpiar tokens
    clearTokens();
    
    // Re-lanzar el error
    throw {
      ...error,
      message: error.message || 'Error al renovar sesión',
      status: error.status,
    };
  }
};

/**
 * Cerrar sesión (limpiar tokens locales)
 */
export const logout = (): void => {
  clearTokens();
};

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  const { getAccessToken, getRefreshToken } = require('@/utils/tokenManager');
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  
  return !!(accessToken && refreshToken);
};

/**
 * Obtener información de debug de la sesión
 */
export const getSessionDebugInfo = () => {
  const { getAccessToken, getRefreshToken, getTokenExpiresAt, isTokenExpired } = require('@/utils/tokenManager');
  
  return {
    hasAccessToken: !!getAccessToken(),
    hasRefreshToken: !!getRefreshToken(),
    expiresAt: getTokenExpiresAt(),
    isExpired: isTokenExpired(),
  };
};
