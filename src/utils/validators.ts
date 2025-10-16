// Utilidades de validación y sanitización

/**
 * Validar formato de email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validar fortaleza de contraseña según requisitos del backend
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validar código de 2FA (6 dígitos)
 */
export const validateTwoFactorCode = (code: string): boolean => {
  const cleanCode = code.replace(/\s/g, '');
  return /^\d{6}$/.test(cleanCode);
};

/**
 * Sanitizar parámetros de query string
 */
export const sanitizeQueryParam = (param: string | null | undefined): string => {
  if (!param) return '';
  
  // Remover caracteres potencialmente peligrosos
  return param
    .replace(/[<>\"']/g, '') // Remover caracteres HTML/JS
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/data:/gi, '') // Remover data:
    .trim();
};

/**
 * Sanitizar string de entrada general
 */
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"'&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    });
};

/**
 * Validar que un string no esté vacío
 */
export const validateRequired = (value: string | null | undefined): boolean => {
  return !!(value && value.trim().length > 0);
};

/**
 * Validar longitud mínima y máxima
 */
export const validateLength = (
  value: string,
  minLength: number,
  maxLength: number
): boolean => {
  const trimmed = value.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
};

/**
 * Validar que dos contraseñas coincidan
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};

/**
 * Validar código de recuperación de contraseña
 */
export const validateResetCode = (code: string): boolean => {
  // El código de reset puede variar, pero generalmente es alfanumérico
  const cleanCode = code.trim();
  return cleanCode.length >= 6 && /^[a-zA-Z0-9]+$/.test(cleanCode);
};

/**
 * Obtener mensaje de error amigable para el usuario
 */
export const getFriendlyErrorMessage = (error: any): string => {
  // Si es un error del backend con estructura conocida
  if (error?.detail) {
    return error.detail;
  }
  
  // Si tiene un mensaje de error
  if (error?.message) {
    return error.message;
  }
  
  // Errores comunes de red
  if (error?.code === 'NETWORK_ERROR') {
    return 'Error de conexión. Verifica tu internet e intenta nuevamente.';
  }
  
  if (error?.status === 401) {
    return 'Credenciales incorrectas. Verifica tu email y contraseña.';
  }
  
  if (error?.status === 403) {
    return 'No tienes permisos para realizar esta acción.';
  }
  
  if (error?.status === 429) {
    return 'Demasiados intentos. Intenta nuevamente en unos minutos.';
  }
  
  if (error?.status >= 500) {
    return 'Error del servidor. Intenta nuevamente más tarde.';
  }
  
  // Error genérico
  return 'Ha ocurrido un error inesperado. Intenta nuevamente.';
};

/**
 * Validar si un error indica que se requiere 2FA
 */
export const isTwoFactorRequiredError = (error: any): boolean => {
  return error?.status === 400 && 
         (error?.detail?.includes('2FA') || 
          error?.detail?.includes('two factor') ||
          error?.detail?.includes('authentication code'));
};

/**
 * Validar si un error indica lockout de cuenta
 */
export const isLockoutError = (error: any): boolean => {
  return error?.status === 429 || 
         (error?.status === 400 && 
          (error?.detail?.includes('locked') || 
           error?.detail?.includes('blocked') ||
           error?.detail?.includes('too many attempts')));
};

/**
 * Validar si un error indica que el email no está confirmado
 */
export const isEmailNotConfirmedError = (error: any): boolean => {
  return error?.status === 400 && 
         error?.detail?.includes('email') &&
         error?.detail?.includes('confirm');
};
