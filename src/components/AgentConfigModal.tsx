import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, TestTube, Globe, Activity } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { AgentWithMetrics } from '@/hooks/useAgentsManager';

interface AgentConfigModalProps {
  agent: AgentWithMetrics | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agentId: string, updates: Partial<AgentWithMetrics>) => void;
  onToggle: (agentId: string) => void;
}

const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  agent,
  isOpen,
  onClose,
  onSave,
  onToggle
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    webhookUrl: '',
    isEnabled: true
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        description: agent.description || '',
        webhookUrl: agent.webhookUrl || '',
        isEnabled: agent.isEnabled ?? true
      });
    }
  }, [agent]);

  const handleSave = () => {
    if (!agent) return;
    
    onSave(agent.id, {
      name: formData.name,
      description: formData.description,
      webhookUrl: formData.webhookUrl,
      isEnabled: formData.isEnabled
    });
    onClose();
  };

  const handleTestWebhook = async () => {
    if (!formData.webhookUrl) {
      toast({
        title: "Error",
        description: "Por favor ingresa una URL válida",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(formData.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje: "Test de conexión",
          agente: agent?.id,
          test: true
        })
      });

      if (response.ok) {
        setTestResult('success');
        toast({
          title: "Test exitoso",
          description: "El webhook responde correctamente"
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setTestResult('error');
      toast({
        title: "Test fallido",
        description: "No se pudo conectar al webhook",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(formData.webhookUrl);
    toast({
      title: "Copiado",
      description: "URL copiada al portapapeles"
    });
  };

  if (!agent) return null;

  const Icon = agent.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <Avatar className={`w-10 h-10 ${agent.bgColor}`}>
              <AvatarFallback className={`${agent.color} ${agent.bgColor} border-0`}>
                <Icon className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            Configurar {agent.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="webhook">Webhook/API</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="status">Estado del Agente</Label>
                  <p className="text-sm text-muted-foreground">
                    Activar/desactivar el agente para todos los usuarios
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={formData.isEnabled ? 'bg-green-500' : 'bg-red-500'}
                  >
                    {formData.isEnabled ? 'ACTIVO' : 'INACTIVO'}
                  </Badge>
                  <Switch
                    id="status"
                    checked={formData.isEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Agente</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-background border-border resize-none"
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="webhook" className="space-y-4">
            <Card className="bg-background border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Configuración de Webhook/API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook">URL del Webhook</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhook"
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://tu-n8n-instance.com/webhook/agent"
                      className="bg-card border-border"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyWebhookUrl}
                      className="border-border"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    URL donde se enviarán las consultas del usuario y se recibirán las respuestas
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestWebhook}
                    disabled={isTesting || !formData.webhookUrl}
                    className="border-border"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {isTesting ? 'Probando...' : 'Probar Webhook'}
                  </Button>
                  
                  {testResult === 'success' && (
                    <Badge className="bg-green-500 text-white">
                      <Check className="w-3 h-3 mr-1" />
                      Conectado
                    </Badge>
                  )}
                  
                  {testResult === 'error' && (
                    <Badge className="bg-red-500 text-white">
                      Error de conexión
                    </Badge>
                  )}
                </div>

                <div className="bg-muted/20 p-3 rounded text-xs">
                  <p className="font-medium mb-1">Formato de petición:</p>
                  <pre className="text-muted-foreground">
{`{
  "mensaje": "Consulta del usuario",
  "agente": "${agent.id}",
  "contexto": "${agent.department}",
  "usuario": "user_id"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-background border-border">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{agent.users || 0}</div>
                  <div className="text-xs text-muted-foreground">Usuarios Activos</div>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{agent.conversations || 0}</div>
                  <div className="text-xs text-muted-foreground">Conversaciones</div>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{agent.usage || 0}%</div>
                  <div className="text-xs text-muted-foreground">Uso Promedio</div>
                </CardContent>
              </Card>

              <Card className="bg-background border-border">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{agent.accuracy || 0}%</div>
                  <div className="text-xs text-muted-foreground">Precisión</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-background border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Última Actividad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {agent.lastActivity ? new Date(agent.lastActivity).toLocaleString() : 'Sin actividad reciente'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentConfigModal; 