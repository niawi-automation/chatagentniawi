import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import type { Agent } from '@/types/agents';
import { AGENTS as DEFAULT_AGENTS } from '@/constants/agents';

const STORAGE_KEY = 'niawi-agents-config';

interface AgentWithMetrics extends Agent {
  users?: number;
  conversations?: number;
  usage?: number;
  accuracy?: number;
  isEnabled?: boolean;
  webhookUrl?: string;
  lastActivity?: string;
}

interface AgentsConfig {
  agents: AgentWithMetrics[];
  lastUpdated: string;
}

export const useAgentsManager = () => {
  const [agents, setAgents] = useState<AgentWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar configuración desde localStorage
  const loadAgentsConfig = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const config: AgentsConfig = JSON.parse(saved);
        // Restaurar iconos desde DEFAULT_AGENTS ya que JSON no puede serializarlos
        return config.agents.map(savedAgent => {
          const defaultAgent = DEFAULT_AGENTS.find(da => da.id === savedAgent.id);
          return {
            ...savedAgent,
            icon: defaultAgent?.icon || savedAgent.icon
          };
        });
      }
      
      // Si no hay configuración guardada, usar valores por defecto con métricas mock
      return DEFAULT_AGENTS.map(agent => {
        // Configurar webhooks específicos para los agentes prioritarios
        let webhookUrl = `https://api.niawi.tech${agent.endpoint}`;
        
        if (agent.id === 'operations') {
          // Agente de Operaciones - URL desde variables de entorno
          webhookUrl = import.meta.env.VITE_WEBHOOK_AGENT_OPERATIONS || webhookUrl;
        } else if (agent.id === 'documents') {
          // Agente WTS - URL desde variables de entorno
          webhookUrl = import.meta.env.VITE_WEBHOOK_AGENT_DOCUMENTS || webhookUrl;
        }
        
        return {
          ...agent,
          users: Math.floor(Math.random() * 50) + 10,
          conversations: Math.floor(Math.random() * 300) + 50,
          usage: Math.floor(Math.random() * 40) + 50,
          accuracy: Math.floor(Math.random() * 15) + 85,
          // Solo Operaciones (operations) y WTS (documents) activos por defecto
          isEnabled: agent.id === 'operations' || agent.id === 'documents',
          webhookUrl,
          lastActivity: new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error loading agents config:', error);
      return DEFAULT_AGENTS.map(agent => {
        // Configurar webhooks específicos también en caso de error
        let webhookUrl = `https://api.niawi.tech${agent.endpoint}`;
        
        if (agent.id === 'operations') {
          webhookUrl = import.meta.env.VITE_WEBHOOK_AGENT_OPERATIONS || webhookUrl;
        } else if (agent.id === 'documents') {
          webhookUrl = import.meta.env.VITE_WEBHOOK_AGENT_DOCUMENTS || webhookUrl;
        }
        
        return {
          ...agent,
          // Solo Operaciones (operations) y WTS (documents) activos por defecto
          isEnabled: agent.id === 'operations' || agent.id === 'documents',
          webhookUrl
        };
      });
    }
  }, []);

  // Guardar configuración en localStorage
  const saveAgentsConfig = useCallback((agentsToSave: AgentWithMetrics[]) => {
    try {
      const config: AgentsConfig = {
        agents: agentsToSave,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving agents config:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    }
  }, []);

  // Inicializar agentes
  useEffect(() => {
    setIsLoading(true);
    const loadedAgents = loadAgentsConfig();
    setAgents(loadedAgents);
    setIsLoading(false);
  }, [loadAgentsConfig]);

  // Crear nuevo agente
  const createAgent = useCallback((newAgent: Omit<AgentWithMetrics, 'id'>) => {
    const id = `agent-${Date.now()}`;
    const agent: AgentWithMetrics = {
      ...newAgent,
      id,
      users: 0,
      conversations: 0,
      usage: 0,
      accuracy: 0,
      isEnabled: true,
      lastActivity: new Date().toISOString()
    };

    const updatedAgents = [...agents, agent];
    setAgents(updatedAgents);
    saveAgentsConfig(updatedAgents);
    
    toast({
      title: "Agente creado",
      description: `${agent.name} ha sido creado exitosamente`
    });
  }, [agents, saveAgentsConfig]);

  // Actualizar agente
  const updateAgent = useCallback((agentId: string, updates: Partial<AgentWithMetrics>) => {
    const updatedAgents = agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, ...updates, lastActivity: new Date().toISOString() }
        : agent
    );
    
    setAgents(updatedAgents);
    saveAgentsConfig(updatedAgents);
    
    toast({
      title: "Agente actualizado",
      description: "Los cambios han sido guardados exitosamente"
    });
  }, [agents, saveAgentsConfig]);

  // Eliminar agente
  const deleteAgent = useCallback((agentId: string) => {
    const updatedAgents = agents.filter(agent => agent.id !== agentId);
    setAgents(updatedAgents);
    saveAgentsConfig(updatedAgents);
    
    toast({
      title: "Agente eliminado",
      description: "El agente ha sido eliminado exitosamente"
    });
  }, [agents, saveAgentsConfig]);

  // Toggle activar/desactivar agente
  const toggleAgent = useCallback((agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const newStatus = !agent.isEnabled;
    updateAgent(agentId, { 
      isEnabled: newStatus,
      status: newStatus ? 'active' : 'maintenance'
    });
    
    toast({
      title: newStatus ? "Agente activado" : "Agente desactivado",
      description: `${agent.name} está ahora ${newStatus ? 'activo' : 'desactivado'}`
    });
  }, [agents, updateAgent]);

  // Actualizar endpoint/webhook
  const updateWebhook = useCallback((agentId: string, webhookUrl: string) => {
    updateAgent(agentId, { webhookUrl });
  }, [updateAgent]);

  // Obtener agente por ID
  const getAgent = useCallback((agentId: string) => {
    return agents.find(agent => agent.id === agentId);
  }, [agents]);

  // Obtener agentes activos
  const getActiveAgents = useCallback(() => {
    return agents.filter(agent => agent.isEnabled);
  }, [agents]);

  // Resetear a configuración por defecto
  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    const defaultAgents = loadAgentsConfig();
    setAgents(defaultAgents);
    
    toast({
      title: "Configuración restablecida",
      description: "Se ha restaurado la configuración por defecto"
    });
  }, [loadAgentsConfig]);

  return {
    agents,
    isLoading,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgent,
    updateWebhook,
    getAgent,
    getActiveAgents,
    resetToDefaults
  };
};

// Exportar tipo para uso en otros componentes
export type { AgentWithMetrics }; 