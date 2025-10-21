// Cliente HTTP centralizado con interceptores de autenticación

import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, setTokenExpiresAt, clearTokens, isTokenExpired } from '@/utils/tokenManager';
import { LoginResponse, RefreshTokenResponse } from '@/types/auth';

// Configuración del cliente - Función para asegurar HTTPS en producción
const getBaseUrl = () => {
  const url = import.meta.env.VITE_AUTH_BASE_URL || 
    (import.meta.env.DEV ? '/api' : 'https://aiauth.e3stores.cloud');
  
  // Si no es desarrollo y la URL comienza con http://, forzar https://
  if (!import.meta.env.DEV && url.startsWith('http://')) {
    console.warn(`⚠️ Convirtiendo HTTP a HTTPS: ${url} → ${url.replace('http://', 'https://')}`);
    return url.replace('http://', 'https://');
  }
  
  return url;
};

const BASE_URL = getBaseUrl();
const CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID || '019986ed-5fea-7886-a2b6-e35968f8ef17';

// Log para verificar la configuración
console.log('🔧 Configuración API:');
console.log('  - Base URL:', BASE_URL);
console.log('  - Client ID:', CLIENT_ID);
console.log('  - Modo:', import.meta.env.DEV ? 'Desarrollo' : 'Producción');

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
  
  if (!refreshTokenValue) {
    throw new Error('No hay refresh token disponible');
  }

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ClientId': CLIENT_ID,
      'Client-Id': CLIENT_ID,
    },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
    credentials: 'include', // Incluir cookies en las requests
    redirect: 'follow', // Permitir redirecciones normales
  });

  if (!response.ok) {
    // Si el refresh falla, limpiar tokens
    clearTokens();
    throw new Error('Error al renovar token de autenticación');
  }

  const data: RefreshTokenResponse = await response.json();
  
  // Guardar nuevos tokens
  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);
  setTokenExpiresAt(Date.now() + (data.expiresIn * 1000));
  
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
    'ClientId': CLIENT_ID,
    'Client-Id': CLIENT_ID,
    ...options.headers,
  };

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
    redirect: 'follow', // Permitir redirecciones normales
  });

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
          redirect: 'follow', // Permitir redirecciones normales
        });
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
    'ClientId': CLIENT_ID,
    'Client-Id': CLIENT_ID,
    ...options.headers,
  };

  const fullUrl = `${BASE_URL}${endpoint}`;
  console.log('🔐 Login Request:', {
    url: fullUrl,
    clientId: CLIENT_ID,
    data: { ...data, password: '***' }
  });

  let response = await fetch(fullUrl, {
    ...options,
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'include', // Incluir cookies en las requests
    redirect: 'follow', // Permitir redirecciones pero verificaremos la URL
  });

  console.log('📥 Login Response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url,
    type: response.type
  });

  // Verificar si la URL final es HTTPS en producción
  if (!import.meta.env.DEV && response.url && response.url.startsWith('http://')) {
    console.warn(`⚠️ El backend redirigió a HTTP: ${response.url}`);
    // Reintentar con la URL en HTTPS
    const secureUrl = ensureHttps(response.url);
    response = await fetch(secureUrl, {
      ...options,
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
    });
  }

  if (!response.ok) {
    let errorMessage = 'Error en el login';
    console.error('❌ Login failed:', response.status, response.statusText);
    
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

// Función para hacer register (manejo especial sin Authorization header)
export const makeRegisterRequest = async <T>(
  endpoint: string,
  data: any,
  options: RequestInit = {}
): Promise<T> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'ClientId': CLIENT_ID,
    'Client-Id': CLIENT_ID,
    'Accept': 'application/problem+json',
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'include', // Incluir cookies en las requests
    redirect: 'follow', // Permitir redirecciones normales
  });

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
