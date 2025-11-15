import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, Plus, MoreVertical, Users, MessageSquare, TrendingUp, 
  Edit, Trash2, Globe, Activity 
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { useAgentsManager, type AgentWithMetrics } from '@/hooks/useAgentsManager';
import AgentConfigModal from '@/components/AgentConfigModal';
import CreateEditAgentModal from '@/components/CreateEditAgentModal';

const AgentsDashboard: React.FC = () => {
  const { 
    agents, 
    isLoading, 
    createAgent, 
    updateAgent, 
    deleteAgent, 
    toggleAgent,
    resetToDefaults 
  } = useAgentsManager();

  // Estados para modales
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentWithMetrics | null>(null);

  // Cálculos de estadísticas
  const activeAgents = agents.filter(agent => agent.isEnabled);
  const totalConversations = agents.reduce((sum, agent) => sum + (agent.conversations || 0), 0);
  const averageUsage = Math.round(agents.reduce((sum, agent) => sum + (agent.usage || 0), 0) / agents.length) || 0;
  const averageAccuracy = Math.round(agents.reduce((sum, agent) => sum + (agent.accuracy || 0), 0) / agents.length) || 0;

  const handleConfigureAgent = (agent: AgentWithMetrics) => {
    setSelectedAgent(agent);
    setConfigModalOpen(true);
  };

  const handleEditAgent = (agent: AgentWithMetrics) => {
    setSelectedAgent(agent);
    setCreateModalOpen(true);
  };

  const handleDeleteAgent = (agent: AgentWithMetrics) => {
    setSelectedAgent(agent);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAgent = () => {
    if (selectedAgent) {
      deleteAgent(selectedAgent.id);
      setDeleteDialogOpen(false);
      setSelectedAgent(null);
    }
  };

  const handleToggleAgent = (agent: AgentWithMetrics) => {
    toggleAgent(agent.id);
  };

  const handleCreateAgent = () => {
    setSelectedAgent(null);
    setCreateModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando agentes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container gradient-agents">
      <div className="page-content">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Administrar Agentes</h1>
            <p className="text-muted-foreground">Gestiona y configura tus agentes IA • {agents.length} agentes totales</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={resetToDefaults} className="border-border">
              Resetear
            </Button>
            <Button onClick={handleCreateAgent} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Crear Agente
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Agentes Activos</p>
                  <p className="text-2xl font-bold text-foreground">{activeAgents.length}</p>
                  <p className="text-xs text-muted-foreground">de {agents.length} totales</p>
                </div>
                <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Conversaciones</p>
                  <p className="text-2xl font-bold text-foreground">{totalConversations.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">todas las sesiones</p>
                </div>
                <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Uso Promedio</p>
                  <p className="text-2xl font-bold text-foreground">{averageUsage}%</p>
                  <p className="text-xs text-muted-foreground">eficiencia general</p>
                </div>
                <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Precisión Promedio</p>
                  <p className="text-2xl font-bold text-foreground">{averageAccuracy}%</p>
                  <p className="text-xs text-muted-foreground">calidad respuestas</p>
                </div>
                <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <Activity className="w-4 h-4 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const Icon = agent.icon;


            return (
              <Card key={agent.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className={`w-10 h-10 ${agent.bgColor} flex-shrink-0`}>
                        <AvatarFallback className={`${agent.color} ${agent.bgColor} border-0`}>
                          <Icon className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base text-foreground truncate">{agent.name}</CardTitle>
                        <p className="text-sm text-muted-foreground truncate">{agent.department}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem onClick={() => handleConfigureAgent(agent)}>
                          <Settings className="w-4 h-4 mr-2" />
                          Configurar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {agent.webhookUrl && (
                          <DropdownMenuItem onClick={() => window.open(agent.webhookUrl, '_blank')}>
                            <Globe className="w-4 h-4 mr-2" />
                            Ver Webhook
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteAgent(agent)} 
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge 
                      className={
                        agent.isEnabled
                          ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' 
                          : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                      }
                    >
                      {agent.isEnabled ? 'ACTIVO' : 'INACTIVO'}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {agent.isEnabled ? 'Desactivar' : 'Activar'}
                      </span>
                      <Switch
                        checked={agent.isEnabled}
                        onCheckedChange={() => handleToggleAgent(agent)}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground truncate-2">
                    {agent.description}
                  </p>

                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 3).map((capability, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                      {agent.capabilities.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{agent.capabilities.length - 3} más
                        </Badge>
                      )}
                    </div>
                  )}

                  <Separator className="bg-border" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usuarios:</span>
                      <span className="text-foreground font-medium">{agent.users || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Conversaciones:</span>
                      <span className="text-foreground font-medium">{agent.conversations || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Precisión:</span>
                      <span className="text-foreground font-medium">{agent.accuracy || 0}%</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-border"
                      onClick={() => handleConfigureAgent(agent)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border"
                      onClick={() => handleEditAgent(agent)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Estado vacío */}
        {agents.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No hay agentes configurados</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primer agente IA personalizado
              </p>
              <Button onClick={handleCreateAgent} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Agente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Configuración */}
      <AgentConfigModal
        agent={selectedAgent}
        isOpen={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false);
          setSelectedAgent(null);
        }}
        onSave={updateAgent}
        onToggle={toggleAgent}
      />

      {/* Modal de Crear/Editar */}
      <CreateEditAgentModal
        agent={selectedAgent}
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setSelectedAgent(null);
        }}
        onSave={createAgent}
      />

      {/* Dialog de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar agente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El agente "{selectedAgent?.name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAgent}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgentsDashboard; 