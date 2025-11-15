import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Shield, Users, User } from 'lucide-react';
import { useAgent } from '@/hooks/useAgent';

const RoleSwitcher = () => {
  const { currentUser, setCurrentUser } = useAgent();

  const roles = [
    {
      role: 'employee',
      name: 'Empleado',
      icon: User,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      description: 'Solo accede al Agente de Operaciones',
      agents: ['operations']
    },
    {
      role: 'manager',
      name: 'Manager',
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      description: 'Accede a Operaciones y Documentos',
      agents: ['operations', 'documents']
    },
    {
      role: 'admin',
      name: 'Administrador',
      icon: Crown,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      description: 'Acceso completo a todos los agentes',
      agents: ['operations', 'hr', 'sales', 'documents']
    }
  ];

  const handleRoleChange = (newRole: 'employee' | 'manager' | 'admin') => {
    if (currentUser) {
      const roleConfig = roles.find(r => r.role === newRole);
      setCurrentUser({
        ...currentUser,
        role: newRole,
        availableAgents: roleConfig?.agents || ['operations']
      });
    }
  };

  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-card border-border z-50 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Cambiar Rol (Dev Mode)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs text-muted-foreground mb-3">
          Rol actual: <Badge className="bg-primary text-white text-xs">{currentUser?.role}</Badge>
        </div>

        {roles.map((roleConfig) => {
          const Icon = roleConfig.icon;
          const isActive = currentUser?.role === roleConfig.role;

          return (
            <Button
              key={roleConfig.role}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleRoleChange(roleConfig.role as any)}
              className={`w-full justify-start h-auto p-3 ${
                isActive
                  ? 'bg-primary text-white'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-1.5 rounded ${roleConfig.bgColor}`}>
                  <Icon className={`w-3 h-3 ${roleConfig.color}`} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-xs">{roleConfig.name}</div>
                  <div className="text-xs opacity-70">{roleConfig.agents.length} agente(s)</div>
                </div>
              </div>
            </Button>
          );
        })}

        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          Cambia el rol para probar diferentes niveles de acceso a los agentes
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleSwitcher; 