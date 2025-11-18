/**
 * Client Email Validation Utilities
 *
 * Provides validation functions for emails that follow the client pattern.
 * Used primarily in login forms to validate emails before submission.
 */

import { extractClientFromEmail, isClientSupported } from '../services/clientConfig';

export interface ClientValidationResult {
  isValid: boolean;
  client: string | null;
  error: string | null;
}

/**
 * Validate email and extract client with detailed error messages
 *
 * @param email - Email address to validate
 * @returns Validation result with client identifier or error message
 *
 * @example
 * validateClientEmail('demo.garmin@ema.com')
 * // { isValid: true, client: 'garmin', error: null }
 *
 * validateClientEmail('user@gmail.com')
 * // { isValid: false, client: null, error: 'Email no válido...' }
 */
export const validateClientEmail = (email: string): ClientValidationResult => {
  // Basic empty check
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      client: null,
      error: 'El email es requerido',
    };
  }

  // Extract client from email pattern
  const client = extractClientFromEmail(email);

  // Check if pattern matches
  if (!client) {
    return {
      isValid: false,
      client: null,
      error: 'Email no válido. Solo se permiten cuentas @ema.com de clientes autorizados',
    };
  }

  // Check if client is configured
  if (!isClientSupported(client)) {
    return {
      isValid: false,
      client,
      error: `Cliente "${client}" no está configurado. Contacta a soporte técnico`,
    };
  }

  // All validations passed
  return {
    isValid: true,
    client,
    error: null,
  };
};

/**
 * Simple boolean validation - check if email is valid for login
 *
 * @param email - Email address to validate
 * @returns True if email is valid and client is supported
 */
export const isValidLoginEmail = (email: string): boolean => {
  const result = validateClientEmail(email);
  return result.isValid;
};

/**
 * Get user-friendly error message for invalid email
 *
 * @param email - Email address that failed validation
 * @returns Error message string
 */
export const getClientEmailError = (email: string): string => {
  const result = validateClientEmail(email);
  return result.error || 'Email inválido';
};

/**
 * Extract and validate client from email in one call
 *
 * @param email - Email address to process
 * @returns Client identifier if valid, null otherwise
 */
export const getValidatedClient = (email: string): string | null => {
  const result = validateClientEmail(email);
  return result.isValid ? result.client : null;
};
