import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, Users, Briefcase, FileText, Brain, Cog, MessageSquare, 
  Database, Shield, Zap, Star, Globe, Heart 
} from 'lucide-react';
import type { AgentWithMetrics } from '@/hooks/useAgentsManager';
import type { LucideIcon } from 'lucide-react';

interface CreateEditAgentModalProps {
  agent?: AgentWithMetrics | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Omit<AgentWithMetrics, 'id'>) => void;
}

const AVAILABLE_ICONS: { name: string; icon: LucideIcon; color: string; bgColor: string }[] = [
  { name: 'Operaciones', icon: BarChart3, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { name: 'RRHH', icon: Users, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  { name: 'Ventas', icon: Briefcase, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  { name: 'Documentos', icon: FileText, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  { name: 'IA General', icon: Brain, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  { name: 'Configuración', icon: Cog, color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  { name: 'Mensajería', icon: MessageSquare, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' },
  { name: 'Base de Datos', icon: Database, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  { name: 'Seguridad', icon: Shield, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  { name: 'Automatización', icon: Zap, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  { name: 'Premium', icon: Star, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { name: 'Web', icon: Globe, color: 'text-teal-400', bgColor: 'bg-teal-500/10' },
  { name: 'Soporte', icon: Heart, color: 'text-rose-400', bgColor: 'bg-rose-500/10' }
];

const CreateEditAgentModal: React.FC<CreateEditAgentModalProps> = ({
  agent,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    description: '',
    endpoint: '',
    webhookUrl: '',
    capabilities: '',
    selectedIcon: 0,
    status: 'active' as 'active' | 'maintenance' | 'new'
  });

  useEffect(() => {
    if (agent) {
      // Encontrar el índice del ícono actual
      const iconIndex = AVAILABLE_ICONS.findIndex(item => item.icon === agent.icon);
      
      setFormData({
        name: agent.name || '',
        department: agent.department || '',
        description: agent.description || '',
        endpoint: agent.endpoint || '',
        webhookUrl: agent.webhookUrl || '',
        capabilities: agent.capabilities?.join(', ') || '',
        selectedIcon: iconIndex >= 0 ? iconIndex : 0,
        status: agent.status || 'active'
      });
    } else {
      // Resetear para nuevo agente
      setFormData({
        name: '',
        department: '',
        description: '',
        endpoint: '',
        webhookUrl: '',
        capabilities: '',
        selectedIcon: 0,
        status: 'active'
      });
    }
  }, [agent, isOpen]);

  const handleSave = () => {
    if (!formData.name.trim() || !formData.department.trim()) {
      return;
    }

    const selectedIconData = AVAILABLE_ICONS[formData.selectedIcon];
    const capabilities = formData.capabilities
      .split(',')
      .map(cap => cap.trim())
      .filter(cap => cap.length > 0);

    const agentData: Omit<AgentWithMetrics, 'id'> = {
      name: formData.name.trim(),
      department: formData.department.trim(),
      description: formData.description.trim(),
      icon: selectedIconData.icon,
      color: selectedIconData.color,
      bgColor: selectedIconData.bgColor,
      endpoint: formData.endpoint.trim() || `/${formData.name.toLowerCase().replace(/\s+/g, '-')}`,
      webhookUrl: formData.webhookUrl.trim(),
      capabilities,
      status: formData.status
    };

    onSave(agentData);
    onClose();
  };

  const selectedIconData = AVAILABLE_ICONS[formData.selectedIcon];
  const SelectedIcon = selectedIconData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {agent ? 'Editar Agente' : 'Crear Nuevo Agente'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vista previa del agente */}
          <Card className="bg-background border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className={`w-12 h-12 ${selectedIconData.bgColor}`}>
                  <AvatarFallback className={`${selectedIconData.color} ${selectedIconData.bgColor} border-0`}>
                    <SelectedIcon className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {formData.name || 'Nombre del Agente'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formData.department || 'Departamento'}
                  </p>
                </div>
                <Badge className={formData.status === 'active' ? 'bg-green-500' : 'bg-orange-500'}>
                  {formData.status === 'active' ? 'ACTIVO' : formData.status.toUpperCase()}
                </Badge>
              </div>
              {formData.description && (
                <p className="text-sm text-muted-foreground mt-2">{formData.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Agente *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Agente de Marketing"
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Departamento *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Ej: Marketing Digital"
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe las funciones y especialidades de este agente..."
              className="bg-background border-border resize-none"
              rows={3}
            />
          </div>

          {/* Configuración técnica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                value={formData.endpoint}
                onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder="/marketing"
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">
                Ruta del endpoint (se genera automáticamente si se deja vacío)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="new">Nuevo</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook">URL del Webhook</Label>
            <Input
              id="webhook"
              value={formData.webhookUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
              placeholder="https://tu-n8n-instance.com/webhook/marketing"
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">
              URL donde se enviarán las consultas y se recibirán las respuestas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capabilities">Capacidades</Label>
            <Input
              id="capabilities"
              value={formData.capabilities}
              onChange={(e) => setFormData(prev => ({ ...prev, capabilities: e.target.value }))}
              placeholder="Análisis, Campañas, SEO, Redes Sociales"
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">
              Separar con comas las capacidades del agente
            </p>
          </div>

          {/* Selección de ícono */}
          <div className="space-y-2">
            <Label>Ícono del Agente</Label>
            <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto border border-border rounded p-2">
              {AVAILABLE_ICONS.map((iconData, index) => {
                const IconComponent = iconData.icon;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, selectedIcon: index }))}
                    className={`p-2 rounded-lg transition-colors ${
                      formData.selectedIcon === index
                        ? 'ring-2 ring-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded ${iconData.bgColor} flex items-center justify-center`}>
                      <IconComponent className={`w-4 h-4 ${iconData.color}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90"
            disabled={!formData.name.trim() || !formData.department.trim()}
          >
            {agent ? 'Actualizar' : 'Crear'} Agente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditAgentModal; 