import { BarChart3, Users, Briefcase, FileText } from 'lucide-react';
import type { Agent, UserRole, UserPermissions, User, UserAgentAssignment, AgentAccessResolution, ActivityLog } from '../types/agents';

export const AGENTS: Agent[] = [
  {
    id: 'operations',
    name: 'Agente de Operaciones',
    department: 'Operaciones',
    description: 'Especialista en planificación de producción, inventarios y logística',
    icon: BarChart3,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    endpoint: '/operations',
    capabilities: ['Planificación', 'Inventarios', 'Producción', 'KPIs'],
    status: 'active'
  },
  {
    id: 'hr',
    name: 'Agente de RRHH',
    department: 'Recursos Humanos',
    description: 'Asistente para gestión de personal, nóminas y políticas internas',
    icon: Users,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    endpoint: '/hr',
    capabilities: ['Gestión Personal', 'Nóminas', 'Políticas', 'Evaluaciones'],
    status: 'maintenance'
  },
  {
    id: 'sales',
    name: 'Agente de Ventas',
    department: 'Comercial',
    description: 'Especialista en análisis comercial, clientes y oportunidades de negocio',
    icon: Briefcase,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    endpoint: '/sales',
    capabilities: ['CRM', 'Forecasting', 'Análisis Cliente', 'Oportunidades'],
    status: 'maintenance'
  },
  {
    id: 'documents',
    name: 'Validador de Documentos',
    department: 'WTS',
    description: 'Análisis y validación automática de documentos empresariales',
    icon: FileText,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    endpoint: '/documents',
    capabilities: ['Validación', 'OCR', 'Compliance', 'Clasificación'],
    status: 'active'
  }
] as const;

// Sistema expandido de permisos por rol (BASE - puede ser override por asignaciones específicas)
export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  super_admin: ['operations', 'hr', 'sales', 'documents'], // Acceso completo + gestión de subcuentas
  admin: ['operations', 'hr', 'sales', 'documents'],
  manager: ['operations', 'documents'],
  employee: ['operations']
} as const;

// Permisos granulares por defecto para cada rol (ACTUALIZADOS con nuevos permisos)
export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  super_admin: {
    agents: { view: true, create: true, edit: true, delete: true, configure: true, assign: true },
    users: { view: true, create: true, edit: true, delete: true, assignRoles: true, assignAgents: true },
    analytics: { view: true, export: true },
    settings: { view: true, edit: true, advanced: true },
    chat: { access: ['operations', 'hr', 'sales', 'documents'], export: true, history: true }
  },
  admin: {
    agents: { view: true, create: true, edit: true, delete: true, configure: true, assign: false },
    users: { view: true, create: true, edit: true, delete: false, assignRoles: true, assignAgents: false },
    analytics: { view: true, export: true },
    settings: { view: true, edit: true, advanced: false },
    chat: { access: ['operations', 'hr', 'sales', 'documents'], export: true, history: true }
  },
  manager: {
    agents: { view: true, create: false, edit: false, delete: false, configure: false, assign: false },
    users: { view: true, create: false, edit: false, delete: false, assignRoles: false, assignAgents: false },
    analytics: { view: true, export: false },
    settings: { view: true, edit: false, advanced: false },
    chat: { access: ['operations', 'documents'], export: true, history: true }
  },
  employee: {
    agents: { view: false, create: false, edit: false, delete: false, configure: false, assign: false },
    users: { view: false, create: false, edit: false, delete: false, assignRoles: false, assignAgents: false },
    analytics: { view: false, export: false },
    settings: { view: true, edit: false, advanced: false },
    chat: { access: ['operations'], export: false, history: true }
  }
} as const;

export const AGENT_SUGGESTIONS: Record<string, readonly string[]> = {
  operations: [
    "¿Qué programas tienen mayor volumen de producción este mes?",
    "¿Hay retrasos en las fechas prometidas al cliente esta semana?",
    "¿Cuántas órdenes están en costura actualmente?",
    "¿Qué líneas de producción han tenido más carga recientemente?",
  ],
  hr: [
    "¿Cuántos empleados tenemos actualmente?",
    "¿Hay evaluaciones de desempeño pendientes?",
    "¿Cuál es la rotación de personal este trimestre?",
    "¿Qué políticas de RRHH necesitan actualización?",
  ],
  sales: [
    "¿Cuáles son nuestros mejores clientes este mes?",
    "¿Qué oportunidades de venta están abiertas?",
    "¿Cómo van las metas comerciales del trimestre?",
    "¿Qué productos tienen mejor margen?",
  ],
  documents: [
    "¿Qué tipos de documentos están disponibles en la base de datos?",
    "Buscar contratos que contengan términos de suministro",
    "Analizar facturas y mostrar información de pagos",
    "¿Puedes encontrar documentos relacionados con órdenes de compra?",
  ]
} as const;

// NUEVA LÓGICA DE RESOLUCIÓN DE ACCESO A AGENTES
export const resolveUserAgentAccess = (user: User): AgentAccessResolution => {
  // 1. Obtener agentes base del rol
  const roleAgents = ROLE_PERMISSIONS[user.role] || [];
  
  // 2. Verificar si tiene asignaciones específicas
  const hasCustomAssignments = user.agentAssignments && user.useCustomAgentAccess;
  
  if (hasCustomAssignments && user.agentAssignments) {
    const assignedAgents = user.agentAssignments.assignedAgents;
    
    switch (user.agentAssignments.assignmentType) {
      case 'custom':
        // Asignación completamente custom - ignora rol
        return {
          hasAccess: assignedAgents.length > 0,
          source: 'custom_assignment',
          assignedAgents,
          roleAgents: [...roleAgents],
          effectiveAgents: assignedAgents
        };
        
      case 'restricted':
        // Restricción - reduce los permisos del rol
        const restrictedAgents = roleAgents.filter(agentId => 
          assignedAgents.includes(agentId)
        );
        return {
          hasAccess: restrictedAgents.length > 0,
          source: 'restricted',
          assignedAgents,
          roleAgents: [...roleAgents],
          effectiveAgents: restrictedAgents
        };
        
      case 'role_based':
      default:
        // Basado en rol + puede tener extensiones
        const extendedAgents = [...new Set([...roleAgents, ...assignedAgents])];
        return {
          hasAccess: extendedAgents.length > 0,
          source: 'role',
          assignedAgents,
          roleAgents: [...roleAgents],
          effectiveAgents: extendedAgents
        };
    }
  }
  
  // 3. Solo permisos de rol (comportamiento actual)
  return {
    hasAccess: roleAgents.length > 0,
    source: 'role',
    assignedAgents: [],
    roleAgents: [...roleAgents],
    effectiveAgents: [...roleAgents]
  };
};

// Funciones helper actualizadas para verificar permisos granulares
export const hasPermission = (user: { permissions: UserPermissions }, module: keyof UserPermissions, action: string): boolean => {
  const modulePermissions = user.permissions[module] as any;
  return modulePermissions && modulePermissions[action] === true;
};

// Verificar acceso a agente específico (NUEVA LÓGICA INTELIGENTE)
export const hasAgentAccess = (user: User, agentId: string): boolean => {
  const resolution = resolveUserAgentAccess(user);
  return resolution.effectiveAgents.includes(agentId);
};

// Obtener todos los agentes efectivos para un usuario
export const getUserEffectiveAgents = (user: User): string[] => {
  const resolution = resolveUserAgentAccess(user);
  return resolution.effectiveAgents;
};

// Función helper para obtener agente por ID
export const getAgentById = (id: string): Agent | undefined => {
  return AGENTS.find(agent => agent.id === id);
};

// Verificar si un rol puede gestionar otro rol
export const canManageRole = (managerRole: UserRole, targetRole: UserRole): boolean => {
  const hierarchy = { super_admin: 4, admin: 3, manager: 2, employee: 1 };
  return hierarchy[managerRole] > hierarchy[targetRole];
};

// Obtener roles que un usuario puede asignar
export const getAssignableRoles = (currentRole: UserRole): UserRole[] => {
  switch (currentRole) {
    case 'super_admin':
      return ['admin', 'manager', 'employee'];
    case 'admin':
      return ['manager', 'employee'];
    case 'manager':
      return ['employee'];
    default:
      return [];
  }
};

// NUEVAS FUNCIONES PARA GESTIÓN DE ASIGNACIONES
export const canAssignAgents = (user: User): boolean => {
  return hasPermission(user, 'users', 'assignAgents');
};

export const validateAgentAssignment = (
  assigningUser: User, 
  targetUser: User, 
  agentIds: string[]
): { valid: boolean; reason?: string } => {
  // Solo super_admin puede asignar agentes
  if (!canAssignAgents(assigningUser)) {
    return { valid: false, reason: 'No tienes permisos para asignar agentes' };
  }
  
  // Verificar que todos los agentes existen
  const invalidAgents = agentIds.filter(id => !getAgentById(id));
  if (invalidAgents.length > 0) {
    return { valid: false, reason: `Agentes no válidos: ${invalidAgents.join(', ')}` };
  }
  
  // Verificar que no se asigne más del máximo permitido
  const maxAgents = 10; // Configuración por defecto, debería venir de SystemConfig
  if (agentIds.length > maxAgents) {
    return { valid: false, reason: `Máximo ${maxAgents} agentes permitidos` };
  }
  
  // Verificar que el usuario target no sea el mismo que asigna
  if (assigningUser.id === targetUser.id) {
    return { valid: false, reason: 'No puedes asignarte agentes a ti mismo' };
  }
  
  return { valid: true };
};

// Obtener descripción de tipo de asignación
export const getAssignmentTypeDescription = (type: UserAgentAssignment['assignmentType']): string => {
  switch (type) {
    case 'role_based':
      return 'Basado en rol + agentes adicionales';
    case 'custom':
      return 'Asignación personalizada (ignora rol)';
    case 'restricted':
      return 'Restricción de acceso (reduce rol)';
    default:
      return 'Tipo no definido';
  }
};

// Generar log de asignación de agentes
export const createAgentAssignmentLog = (
  assigningUser: User,
  targetUser: User,
  agentIds: string[],
  assignmentType: UserAgentAssignment['assignmentType'],
  action: 'assign_agents' | 'revoke_agents'
): Omit<ActivityLog, 'id' | 'timestamp' | 'companyId'> => {
  const agentNames = agentIds.map(id => getAgentById(id)?.name || id).join(', ');
  const actionText = action === 'assign_agents' ? 'asignó' : 'revocó';
  
  return {
    userId: assigningUser.id,
    userName: assigningUser.name,
    action,
    target: targetUser.id,
    targetName: targetUser.name,
    details: `${actionText} agentes [${agentNames}] a ${targetUser.name} (${getAssignmentTypeDescription(assignmentType)})`,
    agentIds,
    assignmentType
  };
}; 