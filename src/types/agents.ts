import { LucideIcon } from 'lucide-react';

export interface Agent {
  id: string;
  name: string;
  department: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  endpoint: string;
  capabilities: string[];
  status: 'active' | 'maintenance' | 'new';
}

// Asignación específica de agentes por usuario
export interface UserAgentAssignment {
  userId: string;
  assignedAgents: string[]; // Lista específica de agentes asignados
  assignmentType: 'role_based' | 'custom' | 'restricted'; // Tipo de asignación
  assignedBy: string; // ID del super_admin que hizo la asignación
  assignedAt: Date;
  notes?: string; // Notas sobre por qué se hizo esta asignación específica
}

// Sistema expandido de usuarios con super_admin
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'employee';
  companyId: string;
  availableAgents: string[]; // Se calcula dinámicamente basado en rol + asignaciones
  permissions: UserPermissions;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  createdBy?: string; // ID del super_admin que lo creó
  // Nueva funcionalidad de asignación granular
  agentAssignments?: UserAgentAssignment; // Asignaciones específicas de agentes
  useCustomAgentAccess?: boolean; // Si true, ignora permisos de rol y usa solo asignaciones específicas
}

// Permisos granulares por módulo
export interface UserPermissions {
  agents: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    configure: boolean;
    assign: boolean; // Nuevo: Permiso para asignar agentes a usuarios (solo super_admin)
  };
  users: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    assignRoles: boolean;
    assignAgents: boolean; // Nuevo: Permiso para asignar agentes específicos
  };
  analytics: {
    view: boolean;
    export: boolean;
  };
  settings: {
    view: boolean;
    edit: boolean;
    advanced: boolean;
  };
  chat: {
    access: string[]; // Lista base de agentes por rol
    export: boolean;
    history: boolean;
  };
}

// Empresa extendida para multi-tenancy
export interface Company {
  id: string;
  name: string;
  plan: 'trial' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  maxUsers: number;
  currentUsers: number;
  features: string[];
  createdAt: Date;
  subscription?: {
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
  };
  // Nueva funcionalidad
  agentAssignmentPolicy: 'role_based' | 'custom' | 'hybrid'; // Política de asignación de agentes
}

// Logs de actividad del sistema
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'login' | 'logout' | 'create_user' | 'edit_user' | 'delete_user' | 
          'create_agent' | 'edit_agent' | 'delete_agent' | 'change_settings' |
          'export_data' | 'role_change' | 'assign_agents' | 'revoke_agents'; // Nuevas acciones
  target?: string; // ID del usuario/agente afectado
  targetName?: string; // Nombre del usuario/agente afectado
  details: string;
  timestamp: Date;
  ipAddress?: string;
  companyId: string;
  // Nueva información para logs de asignación
  agentIds?: string[]; // IDs de agentes asignados/revocados
  assignmentType?: UserAgentAssignment['assignmentType'];
}

export interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  hasError?: boolean;
  agentId?: string;
  // Soporte opcional para contenido multimedia (MVP)
  attachments?: Attachment[];
  // Transcripción opcional para notas de voz
  transcript?: string;
  // Sistema de retry
  retryAttempt?: number; // Número del intento actual (1, 2, 3...)
  maxRetries?: number; // Máximo de intentos configurados
  isRetrying?: boolean; // Si está en proceso de retry
}

export interface ApiResponse {
  output: string;
  status?: 'success' | 'error';
  timestamp?: string;
}

// Definición de adjuntos para mensajes (MVP multimedia)
export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number; // bytes
  kind: 'image' | 'audio' | 'document' | 'other';
  encoding: 'base64' | 'url';
  // Si encoding es base64, data contiene solo el payload base64 (sin prefijo data:)
  data?: string;
  // Si encoding es url, url contiene la ubicación remota accesible
  url?: string;
  // Metadatos opcionales
  width?: number;
  height?: number;
  durationMs?: number;
}

export interface AgentSuggestions {
  [key: string]: readonly string[];
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'employee';
export type AgentStatus = 'active' | 'maintenance' | 'new';

export interface AgentContextType {
  agents: Agent[];
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent | null) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  getAvailableAgents: () => Agent[];
  getAgentEndpoint: (agentId: string) => string;
  updateUserPermissions: (userId: string, newPermissions: Partial<UserPermissions>) => boolean;
  changeUserRole: (userId: string, newRole: UserRole) => boolean;
  // Nuevas funciones para asignación granular de agentes
  assignAgentsToUser: (userId: string, agentIds: string[], assignmentType: UserAgentAssignment['assignmentType'], notes?: string) => boolean;
  revokeAgentsFromUser: (userId: string, agentIds?: string[]) => boolean;
  getUserAssignedAgents: (userId: string) => string[];
  getAvailableAgentsForAssignment: () => Agent[];
}

// Configuración del sistema
export interface SystemConfig {
  maxUsersPerCompany: number;
  defaultPermissions: Record<UserRole, UserPermissions>;
  enabledFeatures: string[];
  maintenanceMode: boolean;
  securitySettings: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordPolicy: {
      minLength: number;
      requireNumbers: boolean;
      requireSymbols: boolean;
      requireUppercase: boolean;
    };
  };
  // Nueva configuración de asignación de agentes
  agentAssignmentConfig: {
    allowRoleOverride: boolean; // Si se permite override de permisos de rol
    requireApproval: boolean; // Si las asignaciones requieren aprobación
    maxAgentsPerUser: number; // Máximo número de agentes por usuario
    auditAllAssignments: boolean; // Si se auditan todas las asignaciones
  };
}

// Helper type para resolución de acceso a agentes
export interface AgentAccessResolution {
  hasAccess: boolean;
  source: 'role' | 'custom_assignment' | 'restricted' | 'denied';
  assignedAgents: string[];
  roleAgents: string[];
  effectiveAgents: string[];
} 