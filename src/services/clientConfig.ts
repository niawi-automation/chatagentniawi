/**
 * Multi-Client Configuration Service
 *
 * Manages client-specific configuration based on user email patterns.
 * Extracts client identifier from email format: {username}.{client}@ema.com
 *
 * Example:
 * - demo.garmin@ema.com → client: "garmin"
 * - demo.multipoint@ema.com → client: "multipoint"
 */

export interface ClientConfig {
  clientId: string;
  chatApiUrl: string;
  recommendationsApiUrl: string;
}

export type SupportedClient = 'garmin' | 'multipoint';

/**
 * Extract client identifier from email address
 *
 * @param email - User email in format {username}.{client}@ema.com
 * @returns Client identifier or null if pattern doesn't match
 *
 * @example
 * extractClientFromEmail('demo.garmin@ema.com') // Returns 'garmin'
 * extractClientFromEmail('user@gmail.com') // Returns null
 */
export const extractClientFromEmail = (email: string): string | null => {
  if (!email) return null;

  // Pattern: {username}.{client}@ema.com
  const emailPattern = /^[^.]+\.([^@]+)@ema\.com$/i;
  const match = email.match(emailPattern);

  if (!match || !match[1]) {
    return null;
  }

  return match[1].toLowerCase();
};

/**
 * Check if email follows the required client pattern
 *
 * @param email - User email to validate
 * @returns True if email follows {username}.{client}@ema.com pattern
 */
export const isValidClientEmail = (email: string): boolean => {
  return extractClientFromEmail(email) !== null;
};

/**
 * Get supported clients list from environment variables
 * Dynamically detects which clients are configured
 *
 * @returns Array of configured client identifiers
 */
export const getSupportedClients = (): string[] => {
  const clients: string[] = [];

  // Check for each potential client by looking for their CLIENT_ID env var
  const envVars = import.meta.env;

  // Iterate through env vars to find client configurations
  Object.keys(envVars).forEach(key => {
    if (key.startsWith('VITE_') && key.endsWith('_CLIENT_ID')) {
      // Extract client name: VITE_GARMIN_CLIENT_ID → garmin
      const client = key
        .replace('VITE_', '')
        .replace('_CLIENT_ID', '')
        .toLowerCase();

      if (envVars[key]) { // Only add if value exists
        clients.push(client);
      }
    }
  });

  return clients;
};

/**
 * Check if a client is supported (has configuration)
 *
 * @param client - Client identifier to check
 * @returns True if client has configuration in environment variables
 */
export const isClientSupported = (client: string): boolean => {
  if (!client) return false;
  return getSupportedClients().includes(client.toLowerCase());
};

/**
 * Get configuration for a specific client
 *
 * @param client - Client identifier (e.g., 'garmin', 'multipoint')
 * @returns Client configuration object
 * @throws Error if client is not configured
 */
export const getClientConfig = (client: string): ClientConfig => {
  if (!client) {
    throw new Error('Cliente no especificado');
  }

  const clientUpper = client.toUpperCase();
  const clientLower = client.toLowerCase();

  // Build env variable names
  const clientIdKey = `VITE_${clientUpper}_CLIENT_ID`;
  const chatUrlKey = `VITE_${clientUpper}_CHAT_API_URL`;
  const recommendationsUrlKey = `VITE_${clientUpper}_RECOMMENDATIONS_API_URL`;

  // Get values from environment
  const clientId = import.meta.env[clientIdKey];
  const chatApiUrl = import.meta.env[chatUrlKey];
  const recommendationsApiUrl = import.meta.env[recommendationsUrlKey];

  // Validate all required variables are present
  if (!clientId) {
    throw new Error(
      `Configuración faltante para cliente "${clientLower}". Variable requerida: ${clientIdKey}`
    );
  }

  if (!chatApiUrl) {
    throw new Error(
      `Configuración faltante para cliente "${clientLower}". Variable requerida: ${chatUrlKey}`
    );
  }

  if (!recommendationsApiUrl) {
    throw new Error(
      `Configuración faltante para cliente "${clientLower}". Variable requerida: ${recommendationsUrlKey}`
    );
  }

  return {
    clientId,
    chatApiUrl,
    recommendationsApiUrl,
  };
};

/**
 * Validate email and get client configuration in one step
 *
 * @param email - User email to validate and extract client from
 * @returns Object with client identifier and configuration
 * @throws Error if email pattern is invalid or client is not supported
 */
export const getClientFromEmail = (email: string): { client: string; config: ClientConfig } => {
  const client = extractClientFromEmail(email);

  if (!client) {
    throw new Error(
      'Email no válido. Solo se permiten cuentas @ema.com de clientes autorizados'
    );
  }

  if (!isClientSupported(client)) {
    throw new Error(
      `Cliente "${client}" no está configurado. Contacta a soporte técnico`
    );
  }

  const config = getClientConfig(client);

  return { client, config };
};

/**
 * Storage key for current client identifier
 */
export const CLIENT_STORAGE_KEY = 'current_client';

/**
 * Store current client in session storage
 *
 * @param client - Client identifier to store
 */
export const storeCurrentClient = (client: string): void => {
  if (!client) return;
  sessionStorage.setItem(CLIENT_STORAGE_KEY, client);
};

/**
 * Get current client from session storage
 *
 * @returns Stored client identifier or null
 */
export const getCurrentClient = (): string | null => {
  return sessionStorage.getItem(CLIENT_STORAGE_KEY);
};

/**
 * Clear current client from session storage
 */
export const clearCurrentClient = (): void => {
  sessionStorage.removeItem(CLIENT_STORAGE_KEY);
};

/**
 * Get current client configuration from session storage
 *
 * @returns Current client's configuration
 * @throws Error if no client is stored or client is not configured
 */
export const getCurrentClientConfig = (): ClientConfig => {
  const client = getCurrentClient();

  if (!client) {
    throw new Error('No hay cliente activo en la sesión');
  }

  return getClientConfig(client);
};
