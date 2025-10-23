// Utilidades para manejo seguro de tokens

interface TokenStorage {
  accessToken: string | null;
  expiresAt: number | null;
}

// Almacenamiento en memoria (se pierde al recargar la página)
let memoryStorage: TokenStorage = {
  accessToken: null,
  expiresAt: null
};

// Claves para sessionStorage
const REFRESH_TOKEN_KEY = 'niawi_refresh_token';
const TOKEN_EXPIRES_AT_KEY = 'niawi_token_expires_at';

/**
 * Obtener el access token desde memoria
 */
export const getAccessToken = (): string | null => {
  return memoryStorage.accessToken;
};

/**
 * Guardar access token en memoria
 */
export const setAccessToken = (token: string): void => {
  memoryStorage.accessToken = token;
};

/**
 * Obtener refresh token desde sessionStorage
 */
export const getRefreshToken = (): string | null => {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn('Error al obtener refresh token:', error);
    return null;
  }
};

/**
 * Guardar refresh token en sessionStorage
 */
export const setRefreshToken = (token: string): void => {
  try {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.warn('Error al guardar refresh token:', error);
  }
};

/**
 * Obtener timestamp de expiración del token
 * Primero intenta desde memoria, si no existe, desde sessionStorage
 */
export const getTokenExpiresAt = (): number | null => {
  // Primero intentar desde memoria
  if (memoryStorage.expiresAt) {
    return memoryStorage.expiresAt;
  }
  
  // Si no está en memoria, intentar desde sessionStorage
  try {
    const stored = sessionStorage.getItem(TOKEN_EXPIRES_AT_KEY);
    if (stored) {
      const expiresAt = parseInt(stored, 10);
      // Actualizar memoria para siguiente consulta
      memoryStorage.expiresAt = expiresAt;
      return expiresAt;
    }
  } catch (error) {
    console.warn('Error al obtener expiresAt:', error);
  }
  
  return null;
};

/**
 * Guardar timestamp de expiración del token en memoria Y sessionStorage
 */
export const setTokenExpiresAt = (expiresAt: number): void => {
  memoryStorage.expiresAt = expiresAt;
  
  // También guardar en sessionStorage para persistir al recargar
  try {
    sessionStorage.setItem(TOKEN_EXPIRES_AT_KEY, expiresAt.toString());
  } catch (error) {
    console.warn('Error al guardar expiresAt:', error);
  }
};

/**
 * Verificar si el token está expirado
 */
export const isTokenExpired = (expiresAt?: number | null): boolean => {
  const expires = expiresAt || memoryStorage.expiresAt;
  if (!expires) return true;
  
  // Agregar margen de 60 segundos antes de la expiración real
  const now = Date.now();
  const margin = 60 * 1000; // 60 segundos en milisegundos
  
  return now >= (expires - margin);
};

/**
 * Verificar si el token expirará pronto (en los próximos 60 segundos)
 */
export const isTokenExpiringSoon = (expiresAt?: number | null): boolean => {
  const expires = expiresAt || memoryStorage.expiresAt;
  if (!expires) return true;
  
  const now = Date.now();
  const margin = 60 * 1000; // 60 segundos en milisegundos
  
  return (expires - now) <= margin;
};

/**
 * Limpiar todos los tokens (memoria y sessionStorage)
 */
export const clearTokens = (): void => {
  memoryStorage.accessToken = null;
  memoryStorage.expiresAt = null;
  
  try {
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  } catch (error) {
    console.warn('Error al limpiar tokens:', error);
  }
};

/**
 * Programar refresh proactivo del token
 */
export const scheduleTokenRefresh = (
  expiresIn: number,
  callback: () => Promise<void>
): (() => void) => {
  // Calcular cuándo hacer el refresh (60 segundos antes de expirar)
  const refreshDelay = (expiresIn - 60) * 1000; // Convertir a milisegundos
  
  // Solo programar si hay tiempo suficiente
  if (refreshDelay <= 0) {
    return () => {};
  }
  
  const timeoutId = setTimeout(() => {
    callback().catch(error => {
      console.error('Error en refresh automático:', error);
    });
  }, refreshDelay);
  
  // Retornar función para cancelar el timeout
  return () => clearTimeout(timeoutId);
};

/**
 * Verificar si hay tokens válidos guardados
 */
export const hasValidTokens = (): boolean => {
  const refreshToken = getRefreshToken();
  const accessToken = getAccessToken();
  
  return !!(refreshToken && accessToken && !isTokenExpired());
};

/**
 * Obtener información de debug de los tokens (solo para desarrollo)
 */
export const getTokenDebugInfo = () => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  const expiresAt = getTokenExpiresAt();
  
  return {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    expiresAt,
    isExpired: isTokenExpired(),
    isExpiringSoon: isTokenExpiringSoon(),
    expiresInSeconds: expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) : 0
  };
};




