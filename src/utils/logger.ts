// Sistema de logging seguro que previene exposición de datos sensibles en producción

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

/**
 * Logger seguro que solo muestra información en desarrollo
 * En producción, solo se muestran errores críticos sin datos sensibles
 */
export const logger = {
  /**
   * Información general - solo en desarrollo
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Advertencias - solo en desarrollo
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Errores - siempre se muestran pero sin datos sensibles
   * Usar solo para errores críticos
   */
  error: (message: string, error?: any) => {
    if (isProd) {
      // En producción, solo mensaje genérico
      console.error(message);
    } else {
      // En desarrollo, mensaje completo y detalles
      console.error(message, error);
    }
  },

  /**
   * Debug detallado - solo en desarrollo
   * Usar para debugging temporal
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Función helper para sanitizar datos sensibles antes de loggear
   */
  sanitize: (obj: any): any => {
    if (!obj) return obj;
    
    const sensitiveKeys = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'access_token',
      'refresh_token',
      'authorization',
      'cookie',
      'secret',
      'apiKey',
      'api_key'
    ];

    if (typeof obj !== 'object') return obj;

    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = logger.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }
};

export default logger;

