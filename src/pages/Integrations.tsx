import React from 'react';
import { Plus, BarChart, Tag, Users, Eye, Store, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Integrations = () => {
  const integrations = [
    {
      id: 1,
      name: 'Google Analytics',
      icon: BarChart,
      status: 'connected',
      description: 'Analítica web y comportamiento de usuarios',
      lastSync: '2 minutos',
      actionLabel: 'Ver datos'
    },
    {
      id: 2,
      name: 'Google Tag Manager',
      icon: Tag,
      status: 'connected',
      description: 'Gestión de etiquetas y eventos',
      lastSync: '5 minutos',
      actionLabel: 'Ver datos'
    },
    {
      id: 3,
      name: 'Woowup / CRM',
      icon: Users,
      status: 'connected',
      description: 'Gestión de clientes y automatizaciones',
      lastSync: '1 hora',
      actionLabel: 'Ver datos'
    },
    {
      id: 4,
      name: 'Monitor de competencia',
      icon: Eye,
      status: 'disconnected',
      description: 'Seguimiento de precios y productos de la competencia',
      lastSync: 'No disponible',
      actionLabel: 'Conectar'
    },
    {
      id: 5,
      name: 'Niawi API',
      icon: Store,
      status: 'connected',
      description: 'Ventas, campañas y métricas de negocio',
      lastSync: '30 segundos',
      actionLabel: 'Ver datos'
    }
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'connected') {
      return <Badge className="bg-green-500 text-white">CONECTADO</Badge>;
    }
    return <Badge className="bg-destructive text-white">DESCONECTADO</Badge>;
  };

  const getStatusDot = (status: string) => {
    if (status === 'connected') {
      return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
    }
    return <div className="w-2 h-2 bg-destructive rounded-full" />;
  };

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Integraciones</h1>
            <p className="text-muted-foreground">
              Conecta Copiloto Niawi con tu ecosistema empresarial
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Integración
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">4</p>
                  <p className="text-sm text-muted-foreground">Conectadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                  <div className="w-6 h-6 bg-destructive rounded-full" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">1</p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary rounded-full" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">5</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <Card key={integration.id} className="bg-card border-border hover-lift">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-border/50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground">{integration.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusDot(integration.status)}
                          {getStatusBadge(integration.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <CardDescription className="text-muted-foreground">
                    {integration.description}
                  </CardDescription>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Última sincronización</p>
                      <p className="text-sm font-medium text-foreground">{integration.lastSync}</p>
                    </div>
                  </div>

                  <Button
                    variant={integration.status === 'connected' ? 'outline' : 'default'}
                    className={`w-full ${
                      integration.status === 'connected'
                        ? 'border-border hover:bg-card'
                        : 'bg-primary hover:bg-primary/90 text-white'
                    }`}
                  >
                    {integration.actionLabel}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Integrations;
