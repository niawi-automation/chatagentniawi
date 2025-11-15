import React, { useMemo, useCallback } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAgent } from '@/hooks/useAgent';

const AgentSelector: React.FC = () => {
  const { 
    selectedAgent, 
    setSelectedAgent, 
    currentUser, 
    getAvailableAgents 
  } = useAgent();

  const availableAgents = useMemo(() => getAvailableAgents(), [getAvailableAgents]);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-green-500 text-white text-xs">NUEVO</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-500 text-white text-xs">MANTTO</Badge>;
      default:
        return null;
    }
  }, []);

  const handleAgentSelect = useCallback((agent: any) => {
    setSelectedAgent(agent);
  }, [setSelectedAgent]);

  // If no agent is selected, show loading state
  if (!selectedAgent) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full justify-between h-auto p-4 border-border bg-card"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
          <div className="text-left">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1"></div>
            <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-auto p-4 border-border bg-card hover:bg-accent transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <Avatar className={`w-10 h-10 ${selectedAgent.bgColor}`}>
              <AvatarFallback className={`${selectedAgent.color} ${selectedAgent.bgColor} border-0`}>
                <selectedAgent.icon className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{selectedAgent.name}</span>
                {getStatusBadge(selectedAgent.status)}
              </div>
              <p className="text-xs text-muted-foreground">{selectedAgent.department}</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 bg-card border-border">
        <DropdownMenuLabel className="flex items-center gap-2 text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          Seleccionar Agente Especializado
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />

                 {availableAgents.map((agent) => (
           <DropdownMenuItem
             key={agent.id}
             onClick={() => handleAgentSelect(agent)}
             className="p-4 cursor-pointer hover:bg-accent focus:bg-accent"
           >
            <div className="flex items-start gap-3 w-full">
              <Avatar className={`w-10 h-10 ${agent.bgColor} flex-shrink-0`}>
                <AvatarFallback className={`${agent.color} ${agent.bgColor} border-0`}>
                  <agent.icon className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground text-sm">{agent.name}</span>
                  {getStatusBadge(agent.status)}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{agent.description}</p>
                
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 3).map((capability) => (
                    <Badge
                      key={capability}
                      variant="outline"
                      className="text-xs px-2 py-0.5 border-border/50 text-muted-foreground"
                    >
                      {capability}
                    </Badge>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 border-border/50 text-muted-foreground"
                    >
                      +{agent.capabilities.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}


        {currentUser?.role !== 'admin' && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <div className="px-4 py-2 text-xs text-muted-foreground">
              💡 Contacta al administrador para acceder a más agentes
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default React.memo(AgentSelector); 