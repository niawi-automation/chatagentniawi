import { useState, useCallback, useEffect } from 'react';
import type { User, ActivityLog, Company, UserRole, UserPermissions, UserAgentAssignment } from '../types/agents';
import { DEFAULT_PERMISSIONS, getAssignableRoles, canManageRole, validateAgentAssignment, createAgentAssignmentLog } from '../constants/agents';

// Datos mock para desarrollo - en producción vendrían del backend
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Super Administrador',
    email: 'superadmin@niawi.tech',
    role: 'super_admin',
    companyId: 'company1',
    availableAgents: ['operations', 'hr', 'sales', 'documents'],
    permissions: DEFAULT_PERMISSIONS.super_admin,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date()
  },
  {
    id: '2',
    name: 'Juan Pérez',
    email: 'juan.perez@empresa.com',
    role: 'admin',
    companyId: 'company1',
    availableAgents: ['operations', 'hr', 'sales', 'documents'],
    permissions: DEFAULT_PERMISSIONS.admin,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date('2024-12-15'),
    createdBy: '1'
  },
  {
    id: '3',
    name: 'María García',
    email: 'maria.garcia@empresa.com',
    role: 'manager',
    companyId: 'company1',
    availableAgents: ['hr', 'sales'], // Ejemplo: Asignación específica
    permissions: DEFAULT_PERMISSIONS.manager,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    lastLogin: new Date('2024-12-14'),
    createdBy: '1',
    // Ejemplo de asignación específica
    agentAssignments: {
      userId: '3',
      assignedAgents: ['hr', 'sales'],
      assignmentType: 'custom',
      assignedBy: '1',
      assignedAt: new Date('2024-02-01'),
      notes: 'Manager de RRHH y Ventas - acceso específico requerido'
    },
    useCustomAgentAccess: true
  },
  {
    id: '4',
    name: 'Carlos López',
    email: 'carlos.lopez@empresa.com',
    role: 'employee',
    companyId: 'company1',
    availableAgents: ['hr'], // Ejemplo: Solo RRHH
    permissions: DEFAULT_PERMISSIONS.employee,
    isActive: true,
    createdAt: new Date('2024-02-15'),
    lastLogin: new Date('2024-12-13'),
    createdBy: '2',
    // Ejemplo de asignación específica
    agentAssignments: {
      userId: '4',
      assignedAgents: ['hr'],
      assignmentType: 'custom',
      assignedBy: '1',
      assignedAt: new Date('2024-02-15'),
      notes: 'Employee con acceso solo a RRHH por funciones específicas'
    },
    useCustomAgentAccess: true
  }
];

const MOCK_COMPANY: Company = {
  id: 'company1',
  name: 'Empresa Demo',
  plan: 'professional',
  status: 'active',
  maxUsers: 50,
  currentUsers: 4,
  features: ['multi_agent', 'analytics', 'webhooks', 'user_management', 'agent_assignment'],
  createdAt: new Date('2024-01-01'),
  subscription: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    autoRenew: true
  },
  agentAssignmentPolicy: 'hybrid' // Permite tanto rol como asignaciones específicas
};

export const useUsersManager = () => {
  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem('niawi-users');
    return stored ? JSON.parse(stored) : MOCK_USERS;
  });

  const [company, setCompany] = useState<Company>(() => {
    const stored = localStorage.getItem('niawi-company');
    return stored ? JSON.parse(stored) : MOCK_COMPANY;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const stored = localStorage.getItem('niawi-activity-logs');
    return stored ? JSON.parse(stored) : [];
  });

  // Persistir datos en localStorage
  useEffect(() => {
    localStorage.setItem('niawi-users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('niawi-company', JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem('niawi-activity-logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Función para crear log de actividad
  const createActivityLog = useCallback((
    userId: string,
    userName: string,
    action: ActivityLog['action'],
    details: string,
    target?: string,
    targetName?: string,
    agentIds?: string[],
    assignmentType?: UserAgentAssignment['assignmentType']
  ) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId,
      userName,
      action,
      target,
      targetName,
      details,
      timestamp: new Date(),
      companyId: 'company1',
      ipAddress: '192.168.1.100', // Mock IP
      agentIds,
      assignmentType
    };
    
    setActivityLogs(prev => [newLog, ...prev].slice(0, 1000)); // Mantener solo los últimos 1000 logs
  }, []);

  // Crear nuevo usuario
  const createUser = useCallback((userData: Omit<User, 'id' | 'createdAt' | 'availableAgents'>, createdByUserId: string, createdByUserName: string) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
      availableAgents: DEFAULT_PERMISSIONS[userData.role].chat.access,
      createdBy: createdByUserId
    };

    setUsers(prev => [...prev, newUser]);
    setCompany(prev => ({ ...prev, currentUsers: prev.currentUsers + 1 }));
    
    createActivityLog(
      createdByUserId,
      createdByUserName,
      'create_user',
      `Creó usuario ${userData.name} con rol ${userData.role}`,
      newUser.id,
      userData.name
    );

    return newUser;
  }, [createActivityLog]);

  // Actualizar usuario
  const updateUser = useCallback((userId: string, updates: Partial<User>, updatedByUserId: string, updatedByUserName: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    ));

    const user = users.find(u => u.id === userId);
    createActivityLog(
      updatedByUserId,
      updatedByUserName,
      'edit_user',
      `Actualizó usuario ${user?.name}`,
      userId,
      user?.name
    );
  }, [users, createActivityLog]);

  // Cambiar rol de usuario
  const changeUserRole = useCallback((
    userId: string, 
    newRole: UserRole, 
    changedByUserId: string, 
    changedByUserName: string,
    changedByRole: UserRole
  ) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return false;

    // Verificar permisos
    if (!canManageRole(changedByRole, targetUser.role) || !canManageRole(changedByRole, newRole)) {
      return false;
    }

    const newPermissions = DEFAULT_PERMISSIONS[newRole];
    const updates: Partial<User> = {
      role: newRole,
      permissions: newPermissions,
      availableAgents: newPermissions.chat.access
    };

    // Si cambia el rol, resetear asignaciones específicas (opcional)
    if (targetUser.role !== newRole) {
      updates.agentAssignments = undefined;
      updates.useCustomAgentAccess = false;
    }

    updateUser(userId, updates, changedByUserId, changedByUserName);
    
    createActivityLog(
      changedByUserId,
      changedByUserName,
      'role_change',
      `Cambió rol de ${targetUser.name} de ${targetUser.role} a ${newRole}`,
      userId,
      targetUser.name
    );

    return true;
  }, [users, updateUser, createActivityLog]);

  // NUEVA FUNCIONALIDAD: Asignar agentes específicos a usuario
  const assignAgentsToUser = useCallback((
    userId: string,
    agentIds: string[],
    assignmentType: UserAgentAssignment['assignmentType'],
    assignedByUserId: string,
    assignedByUserName: string,
    notes?: string
  ) => {
    const targetUser = users.find(u => u.id === userId);
    const assigningUser = users.find(u => u.id === assignedByUserId);
    
    if (!targetUser || !assigningUser) return false;

    // Validar asignación
    const validation = validateAgentAssignment(assigningUser, targetUser, agentIds);
    if (!validation.valid) {
      console.warn('Validación de asignación falló:', validation.reason);
      return false;
    }

    // Crear asignación
    const newAssignment: UserAgentAssignment = {
      userId,
      assignedAgents: agentIds,
      assignmentType,
      assignedBy: assignedByUserId,
      assignedAt: new Date(),
      notes
    };

    // Actualizar usuario
    const updates: Partial<User> = {
      agentAssignments: newAssignment,
      useCustomAgentAccess: true,
      availableAgents: agentIds // Se actualizará dinámicamente en el contexto
    };

    updateUser(userId, updates, assignedByUserId, assignedByUserName);

    // Crear log específico
    const logData = createAgentAssignmentLog(
      assigningUser,
      targetUser,
      agentIds,
      assignmentType,
      'assign_agents'
    );

    createActivityLog(
      logData.userId,
      logData.userName,
      logData.action,
      logData.details,
      logData.target,
      logData.targetName,
      logData.agentIds,
      logData.assignmentType
    );

    return true;
  }, [users, updateUser, createActivityLog]);

  // NUEVA FUNCIONALIDAD: Revocar asignaciones de agentes
  const revokeAgentsFromUser = useCallback((
    userId: string,
    revokedByUserId: string,
    revokedByUserName: string,
    specificAgentIds?: string[]
  ) => {
    const targetUser = users.find(u => u.id === userId);
    const revokingUser = users.find(u => u.id === revokedByUserId);
    
    if (!targetUser || !revokingUser) return false;

    // Verificar permisos
    const validation = validateAgentAssignment(revokingUser, targetUser, []);
    if (!validation.valid) {
      console.warn('Sin permisos para revocar agentes');
      return false;
    }

    let updates: Partial<User>;
    let revokedAgents: string[] = [];

    if (specificAgentIds && specificAgentIds.length > 0) {
      // Revocar agentes específicos
      const currentAssignments = targetUser.agentAssignments?.assignedAgents || [];
      const remainingAgents = currentAssignments.filter(id => !specificAgentIds.includes(id));
      
      if (remainingAgents.length > 0) {
        // Actualizar asignación con agentes restantes
        updates = {
          agentAssignments: {
            ...targetUser.agentAssignments!,
            assignedAgents: remainingAgents,
            assignedAt: new Date()
          },
          availableAgents: remainingAgents
        };
      } else {
        // No quedan agentes, volver a rol base
        updates = {
          agentAssignments: undefined,
          useCustomAgentAccess: false,
          availableAgents: DEFAULT_PERMISSIONS[targetUser.role].chat.access
        };
      }
      revokedAgents = specificAgentIds;
    } else {
      // Revocar todas las asignaciones
      revokedAgents = targetUser.agentAssignments?.assignedAgents || [];
      updates = {
        agentAssignments: undefined,
        useCustomAgentAccess: false,
        availableAgents: DEFAULT_PERMISSIONS[targetUser.role].chat.access
      };
    }

    updateUser(userId, updates, revokedByUserId, revokedByUserName);

    // Crear log
    if (targetUser.agentAssignments) {
      const logData = createAgentAssignmentLog(
        revokingUser,
        targetUser,
        revokedAgents,
        targetUser.agentAssignments.assignmentType,
        'revoke_agents'
      );

      createActivityLog(
        logData.userId,
        logData.userName,
        logData.action,
        logData.details,
        logData.target,
        logData.targetName,
        logData.agentIds,
        logData.assignmentType
      );
    }

    return true;
  }, [users, updateUser, createActivityLog]);

  // Desactivar/activar usuario
  const toggleUserStatus = useCallback((userId: string, changedByUserId: string, changedByUserName: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    const newStatus = !user.isActive;
    updateUser(userId, { isActive: newStatus }, changedByUserId, changedByUserName);
    
    createActivityLog(
      changedByUserId,
      changedByUserName,
      newStatus ? 'edit_user' : 'edit_user',
      `${newStatus ? 'Activó' : 'Desactivó'} usuario ${user.name}`,
      userId,
      user.name
    );

    return true;
  }, [users, updateUser, createActivityLog]);

  // Obtener usuarios filtrados
  const getActiveUsers = useCallback(() => {
    return users.filter(user => user.isActive);
  }, [users]);

  const getUsersByRole = useCallback((role: UserRole) => {
    return users.filter(user => user.role === role && user.isActive);
  }, [users]);

  // NUEVA FUNCIONALIDAD: Obtener usuarios con asignaciones específicas
  const getUsersWithCustomAssignments = useCallback(() => {
    return users.filter(user => user.useCustomAgentAccess && user.agentAssignments);
  }, [users]);

  // NUEVA FUNCIONALIDAD: Obtener agentes asignados a un usuario específico
  const getUserAssignedAgents = useCallback((userId: string): string[] => {
    const user = users.find(u => u.id === userId);
    if (!user) return [];
    
    if (user.useCustomAgentAccess && user.agentAssignments) {
      return user.agentAssignments.assignedAgents;
    }
    
    return DEFAULT_PERMISSIONS[user.role].chat.access;
  }, [users]);

  // Obtener logs filtrados
  const getRecentLogs = useCallback((limit: number = 50) => {
    return activityLogs.slice(0, limit);
  }, [activityLogs]);

  const getLogsByUser = useCallback((userId: string, limit: number = 20) => {
    return activityLogs.filter(log => log.userId === userId).slice(0, limit);
  }, [activityLogs]);

  const getLogsByAction = useCallback((action: ActivityLog['action'], limit: number = 20) => {
    return activityLogs.filter(log => log.action === action).slice(0, limit);
  }, [activityLogs]);

  // NUEVA FUNCIONALIDAD: Obtener logs de asignación de agentes
  const getAgentAssignmentLogs = useCallback((limit: number = 20) => {
    return activityLogs.filter(log => 
      log.action === 'assign_agents' || log.action === 'revoke_agents'
    ).slice(0, limit);
  }, [activityLogs]);

  // Estadísticas
  const getUserStats = useCallback(() => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const withCustomAssignments = users.filter(u => u.useCustomAgentAccess).length;
    const byRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>);

    return { total, active, byRole, withCustomAssignments };
  }, [users]);

  // Resetear datos (solo para desarrollo)
  const resetData = useCallback(() => {
    setUsers(MOCK_USERS);
    setCompany(MOCK_COMPANY);
    setActivityLogs([]);
    localStorage.removeItem('niawi-users');
    localStorage.removeItem('niawi-company');
    localStorage.removeItem('niawi-activity-logs');
  }, []);

  return {
    // Estado
    users,
    company,
    activityLogs,
    
    // Funciones CRUD usuarios
    createUser,
    updateUser,
    changeUserRole,
    toggleUserStatus,
    
    // NUEVAS FUNCIONES: Asignación de agentes
    assignAgentsToUser,
    revokeAgentsFromUser,
    getUserAssignedAgents,
    getUsersWithCustomAssignments,
    
    // Funciones de consulta
    getActiveUsers,
    getUsersByRole,
    getRecentLogs,
    getLogsByUser,
    getLogsByAction,
    getAgentAssignmentLogs,
    getUserStats,
    
    // Utilidades
    createActivityLog,
    resetData
  };
}; 