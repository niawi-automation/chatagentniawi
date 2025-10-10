import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Agent, User, AgentContextType } from '../types/agents';
import { resolveUserAgentAccess, getUserEffectiveAgents, validateAgentAssignment, createAgentAssignmentLog } from '../constants/agents';
import { useAgentsManager, type AgentWithMetrics } from '../hooks/useAgentsManager';
import { useUsersManager } from '../hooks/useUsersManager';

// Create context with proper typing
const AgentContext = createContext<AgentContextType | undefined>(undefined);

// Export context for the hook
export { AgentContext };

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Usar el hook de gestión de agentes dinámico
  const { agents: managedAgents, getActiveAgents } = useAgentsManager();
  
  // Usar el hook de gestión de usuarios para acceder a funciones de asignación
  const { 
    assignAgentsToUser: assignAgentsHook, 
    revokeAgentsFromUser: revokeAgentsHook,
    getUserAssignedAgents,
    createActivityLog
  } = useUsersManager();

  // Estado inicial del agente seleccionado (convertir AgentWithMetrics a Agent)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  // Usuario actual con nuevo sistema de permisos
  // TODO: Sistema de Roles - En producción esto vendrá de autenticación JWT
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: '1',
    name: 'Super Administrador',
    email: 'superadmin@niawi.tech',
    role: 'super_admin', // Cambiar para probar: 'super_admin', 'admin', 'manager', 'employee'
    companyId: 'company1',
    availableAgents: [],
    permissions: {
      agents: { view: true, create: true, edit: true, delete: true, configure: true, assign: true },
      users: { view: true, create: true, edit: true, delete: true, assignRoles: true, assignAgents: true },
      analytics: { view: true, export: true },
      settings: { view: true, edit: true, advanced: true },
      chat: { access: ['operations', 'hr', 'sales', 'documents'], export: true, history: true }
    },
    isActive: true,
    createdAt: new Date(),
    lastLogin: new Date()
  });

  // Convertir AgentWithMetrics a Agent (compatible con el tipo original)
  const convertToAgent = useCallback((agentWithMetrics: AgentWithMetrics): Agent => {
    return {
      id: agentWithMetrics.id,
      name: agentWithMetrics.name,
      department: agentWithMetrics.department,
      description: agentWithMetrics.description,
      icon: agentWithMetrics.icon,
      color: agentWithMetrics.color,
      bgColor: agentWithMetrics.bgColor,
      capabilities: agentWithMetrics.capabilities || [],
      endpoint: agentWithMetrics.endpoint,
      status: agentWithMetrics.status
    };
  }, []);

  // Función optimizada para obtener agentes disponibles según nueva lógica de resolución
  const getAvailableAgents = useCallback((): Agent[] => {
    if (!currentUser) return [];
    
    // Obtener solo agentes activos y habilitados
    const activeAgents = getActiveAgents();
    
    // Usar nueva lógica de resolución de acceso
    const effectiveAgentIds = getUserEffectiveAgents(currentUser);
    
    // Filtrar agentes activos según los efectivos del usuario
    const allowedAgents = activeAgents.filter(agent => 
      effectiveAgentIds.includes(agent.id)
    );
    
    return allowedAgents.map(convertToAgent);
  }, [currentUser, getActiveAgents, convertToAgent]);

  // Función para obtener el endpoint completo del agente
  const getAgentEndpoint = useCallback((agentId: string): string => {
    const agent = managedAgents.find(a => a.id === agentId);
    
    if (agent && agent.webhookUrl) {
      // Si el agente tiene webhook configurado, usarlo
      return agent.webhookUrl;
    }
    
    // Fallback al endpoint por defecto
    const baseUrl = import.meta.env.VITE_CHAT_API_URL || 'https://api.niawi.tech';
    return agent ? `${baseUrl}${agent.endpoint}` : baseUrl;
  }, [managedAgents]);

  // Función para actualizar permisos de usuario (solo para super_admin/admin)
  const updateUserPermissions = useCallback((userId: string, newPermissions: Partial<User['permissions']>) => {
    if (!currentUser || !['super_admin', 'admin'].includes(currentUser.role)) {
      console.warn('Sin permisos para actualizar permisos de usuario');
      return false;
    }
    
    // TODO: En producción, esto haría una llamada al backend
    console.log(`Actualizando permisos para usuario ${userId}:`, newPermissions);
    return true;
  }, [currentUser]);

  // Función para cambiar rol de usuario (solo super_admin puede cambiar todos los roles)
  const changeUserRole = useCallback((userId: string, newRole: User['role']) => {
    if (!currentUser || currentUser.role !== 'super_admin') {
      console.warn('Solo super_admin puede cambiar roles');
      return false;
    }
    
    // TODO: En producción, actualizar en backend y refrescar contexto
    console.log(`Cambiando rol de usuario ${userId} a ${newRole}`);
    return true;
  }, [currentUser]);

  // NUEVA FUNCIONALIDAD: Asignar agentes específicos a usuario
  const assignAgentsToUser = useCallback((
    userId: string, 
    agentIds: string[], 
    assignmentType: 'role_based' | 'custom' | 'restricted',
    notes?: string
  ): boolean => {
    if (!currentUser) return false;

    return assignAgentsHook(
      userId,
      agentIds,
      assignmentType,
      currentUser.id,
      currentUser.name,
      notes
    );
  }, [currentUser, assignAgentsHook]);

  // NUEVA FUNCIONALIDAD: Revocar agentes de usuario
  const revokeAgentsFromUser = useCallback((userId: string, agentIds?: string[]): boolean => {
    if (!currentUser) return false;

    return revokeAgentsHook(
      userId,
      currentUser.id,
      currentUser.name,
      agentIds
    );
  }, [currentUser, revokeAgentsHook]);

  // NUEVA FUNCIONALIDAD: Obtener agentes asignados a usuario específico
  const getUserAssignedAgentsContext = useCallback((userId: string): string[] => {
    return getUserAssignedAgents(userId);
  }, [getUserAssignedAgents]);

  // NUEVA FUNCIONALIDAD: Obtener todos los agentes disponibles para asignación (solo super_admin)
  const getAvailableAgentsForAssignment = useCallback((): Agent[] => {
    if (!currentUser || currentUser.role !== 'super_admin') {
      return [];
    }
    
    // Todos los agentes activos están disponibles para asignación
    const activeAgents = getActiveAgents();
    return activeAgents.map(convertToAgent);
  }, [currentUser, getActiveAgents, convertToAgent]);

  // Agentes disponibles memoizados para performance
  const availableAgents = useMemo(() => getAvailableAgents(), [getAvailableAgents]);

  // Efecto para inicializar el agente seleccionado
  useEffect(() => {
    if (availableAgents.length > 0) {
      if (!selectedAgent || !availableAgents.find(a => a.id === selectedAgent.id)) {
        setSelectedAgent(availableAgents[0]);
      }
    } else {
      setSelectedAgent(null);
    }
  }, [availableAgents]); // Removemos selectedAgent de las dependencias para evitar loops

  // Efecto para actualizar los agentes disponibles del usuario
  useEffect(() => {
    if (currentUser) {
      const agentIds = availableAgents.map(agent => agent.id);
      const currentAgentIds = currentUser.availableAgents || [];
      
      // Solo actualizar si realmente cambió para evitar loops
      if (JSON.stringify(agentIds.sort()) !== JSON.stringify(currentAgentIds.sort())) {
        setCurrentUser(prev => prev ? { 
          ...prev, 
          availableAgents: agentIds,
          lastLogin: new Date() // Actualizar última actividad
        } : null);
      }
    }
  }, [availableAgents]); // Solo dependemos de availableAgents

  // Memoizar la conversión de agentes para evitar recalculos innecesarios
  const convertedAgents = useMemo(() => 
    managedAgents.map(convertToAgent), 
    [managedAgents, convertToAgent]
  );

  const value: AgentContextType = useMemo(() => ({
    agents: convertedAgents, // Todos los agentes para compatibilidad
    selectedAgent: selectedAgent || (availableAgents.length > 0 ? availableAgents[0] : null),
    setSelectedAgent,
    currentUser,
    setCurrentUser,
    getAvailableAgents,
    getAgentEndpoint,
    // Funciones existentes de gestión de permisos
    updateUserPermissions,
    changeUserRole,
    // NUEVAS funciones para asignación granular de agentes
    assignAgentsToUser,
    revokeAgentsFromUser,
    getUserAssignedAgents: getUserAssignedAgentsContext,
    getAvailableAgentsForAssignment
  }), [
    convertedAgents, 
    selectedAgent, 
    availableAgents, 
    currentUser, 
    getAvailableAgents, 
    getAgentEndpoint, 
    updateUserPermissions, 
    changeUserRole,
    assignAgentsToUser,
    revokeAgentsFromUser,
    getUserAssignedAgentsContext,
    getAvailableAgentsForAssignment
  ]);

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}; 