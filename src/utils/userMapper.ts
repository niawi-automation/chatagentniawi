/**
 * Utilidades para mapear UserInfo (backend) a User (frontend)
 *
 * Este módulo gestiona la conversión del usuario autenticado del backend
 * al formato interno de la aplicación, generando IDs únicos y asignando
 * permisos completos por defecto.
 */

import type { UserInfo } from '@/types/auth';
import type { User, UserPermissions } from '@/types/agents';

/**
 * Genera un ID único y estable basado en el email del usuario
 * Usa base64 para crear un hash reproducible del email
 *
 * @param email - Email del usuario
 * @returns ID único basado en el email
 *
 * @example
 * generateUserIdFromEmail('user@garmin.e3stores.cloud')
 * // Returns: 'dXNlckBnYXJtaW4uZTNzdG9yZXMuY2xvdWQ'
 */
export const generateUserIdFromEmail = (email: string): string => {
  try {
    // Convertir email a base64 y eliminar caracteres de padding
    const base64 = btoa(email.toLowerCase().trim());
    return base64.replace(/=/g, '');
  } catch (error) {
    console.error('Error al generar ID desde email:', error);
    // Fallback: usar el email directamente
    return email.toLowerCase().trim();
  }
};

/**
 * Extrae el identificador del cliente desde el email
 * Soporta el formato multi-cliente: usuario@cliente.e3stores.cloud
 *
 * @param email - Email del usuario
 * @returns Identificador del cliente o 'default'
 *
 * @example
 * extractCompanyId('user@garmin.e3stores.cloud') // Returns: 'garmin'
 * extractCompanyId('user@example.com') // Returns: 'default'
 */
export const extractCompanyId = (email: string): string => {
  try {
    // Formato esperado: usuario@cliente.e3stores.cloud
    const match = email.match(/@([^.]+)\./);
    if (match && match[1]) {
      return match[1];
    }

    // Fallback: usar dominio completo
    const domain = email.split('@')[1];
    return domain || 'default';
  } catch (error) {
    console.error('Error al extraer company ID:', error);
    return 'default';
  }
};

/**
 * Retorna objeto de permisos completos para todos los usuarios
 *
 * NOTA: Actualmente todos los usuarios tienen acceso completo a todas las funcionalidades.
 * Este sistema está preparado para implementar restricciones granulares en el futuro.
 *
 * @returns Objeto UserPermissions con todos los permisos habilitados
 */
export const getAllPermissions = (): UserPermissions => ({
  agents: {
    view: true,
    create: true,
    edit: true,
    delete: true,
    configure: true,
    assign: true
  },
  users: {
    view: true,
    create: true,
    edit: true,
    delete: true,
    assignRoles: true,
    assignAgents: true
  },
  analytics: {
    view: true,
    export: true
  },
  settings: {
    view: true,
    edit: true,
    advanced: true
  },
  chat: {
    access: ['operations', 'hr', 'sales', 'documents'],
    export: true,
    history: true
  }
});

/**
 * Mapea UserInfo (del backend) al tipo User (frontend)
 *
 * Convierte la información básica del usuario autenticado a un objeto
 * User completo con permisos, roles y metadata necesaria para la aplicación.
 *
 * @param userInfo - Información del usuario desde el backend
 * @returns Objeto User completo para usar en AgentContext
 *
 * @example
 * const backendUser = { userName: 'Juan', email: 'juan@garmin.e3stores.cloud', ... };
 * const frontendUser = mapUserInfoToUser(backendUser);
 * // frontendUser.id = 'anVhbkBnYXJtaW4uZTNzdG9yZXMuY2xvdWQ'
 * // frontendUser.role = 'employee'
 * // frontendUser.companyId = 'garmin'
 */
export const mapUserInfoToUser = (userInfo: UserInfo): User => {
  const userId = generateUserIdFromEmail(userInfo.email);
  const companyId = extractCompanyId(userInfo.email);
  const permissions = getAllPermissions();

  return {
    id: userId,
    name: userInfo.userName,
    email: userInfo.email,
    role: 'employee', // Todos los usuarios tienen rol 'employee' por defecto
    companyId: companyId,
    availableAgents: [], // Se llena dinámicamente por AgentContext
    permissions: permissions,
    isActive: userInfo.isEmailConfirmed,
    createdAt: new Date(),
    lastLogin: new Date()
  };
};

/**
 * Valida que un UserInfo tenga los campos mínimos requeridos
 *
 * @param userInfo - Información del usuario a validar
 * @returns true si el usuario es válido, false en caso contrario
 */
export const isValidUserInfo = (userInfo: UserInfo | null): boolean => {
  if (!userInfo) return false;

  return !!(
    userInfo.email &&
    userInfo.userName &&
    typeof userInfo.email === 'string' &&
    typeof userInfo.userName === 'string' &&
    userInfo.email.includes('@')
  );
};
