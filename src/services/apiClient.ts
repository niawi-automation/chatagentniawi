// Cliente HTTP centralizado con interceptores de autenticación

import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, setTokenExpiresAt, clearTokens, isTokenExpired } from '@/utils/tokenManager';
import { LoginResponse, RefreshTokenResponse } from '@/types/auth';
import logger from '@/utils/logger';
import { getCurrentClient, getClientConfig } from './clientConfig';

// Configuración del cliente - Función para asegurar HTTPS en producción
const getBaseUrl = () => {
  const url = import.meta.env.VITE_AUTH_BASE_URL || 
    (import.meta.env.DEV ? '/api' : 'https://aiauth.e3stores.cloud');
  
  // Si no es desarrollo y la URL comienza con http://, forzar https://
  if (!import.meta.env.DEV && url.startsWith('http://')) {
    logger.warn(`Convirtiendo HTTP a HTTPS: ${url} → ${url.replace('http://', 'https://')}`);
    return url.replace('http://', 'https://');
  }
  
  return url;
};

const BASE_URL = getBaseUrl();

/**
 * Obtiene el CLIENT_ID dinámicamente basado en el cliente actual
 * Lee el cliente desde sessionStorage y obtiene su configuración
 *
 * @returns CLIENT_ID del cliente actual o null si no hay cliente activo
 */
const getClientId = (): string | null => {
  try {
    const client = getCurrentClient();
    if (!client) {
      // No hay cliente en sesión, puede ser antes del login
      return null;
    }

    const config = getClientConfig(client);
    return config.clientId;
  } catch (error) {
    logger.error('Error obteniendo CLIENT_ID:', error);
    return null;
  }
};

// Log para verificar la configuración solo en desarrollo
logger.debug('Configuración API:', {
  baseUrl: BASE_URL,
  mode: import.meta.env.DEV ? 'Desarrollo' : 'Producción'
});

// Función para forzar HTTPS en cualquier URL
const ensureHttps = (url: string): string => {
  if (!import.meta.env.DEV && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

// Promise para deduplicar llamadas de refresh
let refreshPromise: Promise<RefreshTokenResponse> | null = null;

// Función para hacer refresh del token
const refreshToken = async (): Promise<RefreshTokenResponse> => {
  const refreshTokenValue = getRefreshToken();
  
  logger.debug('Intentando refrescar token...');
  
  // Si el refreshToken está vacío, significa que estamos usando cookies
  // El refreshToken está en una cookie HTTP-only, no necesitamos enviarlo en el body
  const bodyData = refreshTokenValue ? { refreshToken: refreshTokenValue } : {};

  const clientId = getClientId();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Solo agregar CLIENT_ID si existe (después del login)
  if (clientId) {
    headers['ClientId'] = clientId;
    headers['Client-Id'] = clientId;
  }

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
    credentials: 'include', // Incluir cookies en las requests (importante para cookies HTTP-only)
    redirect: 'manual', // Interceptar redirecciones para convertir HTTP a HTTPS
  });

  logger.debug('Refresh Response:', {
    status: response.status,
    ok: response.ok
  });

  // Manejar redirecciones (302, 301, etc.) - el backend puede intentar redirigir a HTTP
  if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
    const location = response.headers.get('location');
    if (location) {
      const secureLocation = ensureHttps(location);
      if (location !== secureLocation) {
        logger.warn(`El backend intentó redirigir a HTTP`);
      }
    }
    // Si es una redirección, significa que la sesión expiró
    clearTokens();
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  if (!response.ok) {
    // Si el refresh falla, limpiar tokens
    clearTokens();
    throw new Error('Error al renovar token de autenticación');
  }

  const data: RefreshTokenResponse = await response.json();
  logger.debug('Refresh exitoso');
  
  // Guardar nuevos tokens
  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }
  
  // Solo actualizar refreshToken si viene en la respuesta
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }
  
  if (data.expiresIn) {
    setTokenExpiresAt(Date.now() + (data.expiresIn * 1000));
  }
  
  return data;
};

// Interceptor para agregar headers y manejar refresh automático
const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Agregar headers base
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Agregar CLIENT_ID dinámicamente si existe
  const clientId = getClientId();
  if (clientId) {
    headers['ClientId'] = clientId;
    headers['Client-Id'] = clientId;
  }

  // Agregar Authorization header si hay token y no es una llamada de auth
  const accessToken = getAccessToken();
  const isAuthEndpoint = endpoint.includes('/auth/');
  
  if (accessToken && !isAuthEndpoint) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Hacer la petición inicial
  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Incluir cookies en las requests
    redirect: 'manual', // Interceptar redirecciones para convertir HTTP a HTTPS
  });

  // Manejar redirecciones (302, 301, etc.) - el backend puede intentar redirigir a HTTP
  if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
    const location = response.headers.get('location');
    if (location) {
      const secureLocation = ensureHttps(location);
      if (location !== secureLocation) {
        logger.warn('El backend intentó redirigir a HTTP');
      }
    }
    // Si es una redirección, probablemente es un problema de autenticación
    if (!isAuthEndpoint && accessToken) {
      // Intentar refresh si hay token
      // El código de 401 manejará esto
      response = new Response(null, { status: 401 });
    } else {
      // Si no hay token o es endpoint de auth, es un error
      const error = new Error('Sesión expirada. Redirigiendo al login...') as any;
      error.status = 302;
      error.isRedirect = true;
      throw error;
    }
  }

  // Si es 401 y no es una llamada de auth, intentar refresh
  if (response.status === 401 && !isAuthEndpoint && accessToken) {
    try {
      // Usar la Promise existente si ya hay un refresh en curso
      if (!refreshPromise) {
        refreshPromise = refreshToken();
      }
      
      await refreshPromise;
      refreshPromise = null;
      
      // Reintentar la petición original con el nuevo token
      const newAccessToken = getAccessToken();
      if (newAccessToken) {
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        response = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include', // Incluir cookies en las requests
          redirect: 'manual', // Interceptar redirecciones para convertir HTTP a HTTPS
        });

        // Manejar redirecciones en el reintento también
        if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
          const location = response.headers.get('location');
          if (location) {
            const secureLocation = ensureHttps(location);
            if (location !== secureLocation) {
              logger.warn('El backend intentó redirigir a HTTP en reintento');
            }
          }
          throw new Error('Sesión expirada después del refresh. Por favor, inicia sesión nuevamente.');
        }
      }
    } catch (refreshError) {
      // Si el refresh falla, limpiar tokens y lanzar error
      clearTokens();
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
  }

  // Manejar errores de respuesta
  if (!response.ok) {
    let errorMessage = 'Error en la petición';
    
    // Si es una redirección (302, 301, etc.), probablemente es un problema de autenticación
    if (response.status >= 300 && response.status < 400) {
      errorMessage = 'Sesión expirada. Redirigiendo al login...';
    }
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      }
    } catch {
      // Si no se puede parsear el error, usar el mensaje por defecto
    }
    
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.response = response;
    error.isRedirect = response.status >= 300 && response.status < 400;
    
    throw error;
  }

  // Parsear respuesta
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return {} as T;
  } catch {
    return {} as T;
  }
};

// Métodos HTTP específicos
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    return makeRequest<T>(endpoint, { ...options, method: 'GET' });
  },

  post: <T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> => {
    return makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: <T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> => {
    return makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    return makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

// Función para hacer login (manejo especial sin Authorization header)
export const makeLoginRequest = async <T>(
  endpoint: string,
  data: any,
  options: RequestInit = {}
): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // MULTI-CLIENTE: Agregar CLIENT_ID dinámicamente desde sessionStorage
  // El cliente ya debe estar almacenado ANTES de llamar al login (ver AuthContext)
  const clientId = getClientId();
  if (clientId) {
    headers['ClientId'] = clientId;
    headers['Client-Id'] = clientId;
  } else {
    logger.warn('makeLoginRequest: No se encontró CLIENT_ID en sessionStorage. Asegúrate de que el cliente se haya almacenado antes del login.');
  }

  const fullUrl = `${BASE_URL}${endpoint}`;
  logger.debug('Login Request iniciado');

  let response = await fetch(fullUrl, {
    ...options,
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'include', // Incluir cookies en las requests
    redirect: 'manual', // Interceptar redirecciones para convertir HTTP a HTTPS
  });

  logger.debug('Login Response:', {
    status: response.status,
    ok: response.ok
  });

  // Manejar redirecciones - el backend puede intentar redirigir a HTTP
  if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
    const location = response.headers.get('location');
    if (location) {
      const secureLocation = ensureHttps(location);
      if (location !== secureLocation) {
        logger.warn('El backend intentó redirigir a HTTP en login');
      }
      // Intentar seguir la redirección con HTTPS
      logger.debug('Siguiendo redirección segura');
      response = await fetch(secureLocation, {
        ...options,
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
        redirect: 'manual',
      });

      // Si la segunda petición también redirige, es un error
      if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
        throw new Error('El servidor está redirigiendo múltiples veces. Por favor, verifica la configuración del backend.');
      }
    }
  }

  if (!response.ok) {
    let errorMessage = 'Error en el login';
    logger.debug('Login failed:', response.status);
    
    // Intentar obtener el mensaje de error del backend
    try {
      const errorData = await response.json();
      logger.debug('Error data del backend recibido');
      errorMessage = errorData.detail || errorData.message || errorData.title || errorMessage;
    } catch (parseError) {
      logger.debug('No se pudo parsear el error del backend');
    }
    
    // Mensajes amigables según el código de estado
    if (response.status === 401) {
      errorMessage = 'Email o contraseña incorrectos. Por favor, verifica tus credenciales.';
    } else if (response.status === 403) {
      errorMessage = 'Acceso denegado. Tu cuenta puede estar bloqueada o inactiva.';
    } else if (response.status === 429) {
      errorMessage = 'Demasiados intentos fallidos. Por favor, espera unos minutos antes de reintentar.';
    } else if (response.status >= 500) {
      errorMessage = 'Error del servidor. Por favor, intenta nuevamente en unos momentos.';
    } else if (response.status === 400) {
      // Para 400, usar el mensaje del backend si está disponible
      errorMessage = errorMessage === 'Error en el login' 
        ? 'Datos de login inválidos. Verifica tu email y contraseña.' 
        : errorMessage;
    }
    
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.response = response;
    
    throw error;
  }

  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonData = await response.json();
      logger.debug('Login exitoso');
      return jsonData;
    }
    logger.debug('Response no es JSON, retornando objeto vacío');
    return {} as T;
  } catch (error) {
    logger.error('Error parseando respuesta de login', error);
    return {} as T;
  }
};

// Función para hacer register (manejo especial sin Authorization header)
export const makeRegisterRequest = async <T>(
  endpoint: string,
  data: any,
  options: RequestInit = {}
): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/problem+json',
    ...options.headers,
  };

  // MULTI-CLIENTE: Agregar CLIENT_ID dinámicamente
  const clientId = getClientId();
  if (clientId) {
    headers['ClientId'] = clientId;
    headers['Client-Id'] = clientId;
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'include', // Incluir cookies en las requests
    redirect: 'manual', // Interceptar redirecciones para convertir HTTP a HTTPS
  });

  // Manejar redirecciones - el backend puede intentar redirigir a HTTP
  if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
    const location = response.headers.get('location');
    if (location) {
      const secureLocation = ensureHttps(location);
      if (location !== secureLocation) {
        logger.warn('El backend intentó redirigir a HTTP en registro');
      }
      // Intentar seguir la redirección con HTTPS
      logger.debug('Siguiendo redirección segura');
      response = await fetch(secureLocation, {
        ...options,
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
        redirect: 'manual',
      });

      // Si la segunda petición también redirige, es un error
      if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
        throw new Error('El servidor está redirigiendo múltiples veces. Por favor, verifica la configuración del backend.');
      }
    }
  }

  if (!response.ok) {
    let errorMessage = 'Error en el registro';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // Si no se puede parsear el error, usar el mensaje por defecto
    }
    
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.response = response;
    
    throw error;
  }

  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return {} as T;
  } catch {
    return {} as T;
  }
};

export default apiClient;
