import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Plus, 
  Shield, 
  Settings as SettingsIcon, 
  Activity, 
  Edit, 
  Trash2,
  Eye,
  Database,
  Bell,
  Lock,
  Globe,
  Calendar,
  Download,
  UserPlus,
  Minus,
  AlertTriangle,
  Info,
  FileText,
  Bot,
  UserCheck,
  Clock,
  Target,
  ArrowRight,
  Save
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useUsersManager } from '@/hooks/useUsersManager';
import { useAgent } from '@/hooks/useAgent';
import { useAgentsManager } from '@/hooks/useAgentsManager';
import { hasPermission, getAssignableRoles, getAssignmentTypeDescription, getAgentById } from '@/constants/agents';
import type { User, UserRole, ActivityLog, UserAgentAssignment } from '@/types/agents';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { currentUser } = useAgent();
  const {
    users,
    company,
    activityLogs,
    createUser,
    updateUser,
    changeUserRole,
    toggleUserStatus,
    getActiveUsers,
    getRecentLogs,
    getUserStats,
    resetData,
    assignAgentsToUser,
    revokeAgentsFromUser,
    getUserAssignedAgents,
    getUsersWithCustomAssignments,
    getAgentAssignmentLogs
  } = useUsersManager();
  const { agents: allAgents } = useAgentsManager();

  const userStats = getUserStats();
  const recentLogs = getRecentLogs(10);
  const activeUsers = getActiveUsers();

  // Verificar permisos para diferentes acciones
  const canManageUsers = currentUser && hasPermission(currentUser, 'users', 'view');
  const canCreateUsers = currentUser && hasPermission(currentUser, 'users', 'create');
  const canEditUsers = currentUser && hasPermission(currentUser, 'users', 'edit');
  const canManageSettings = currentUser && hasPermission(currentUser, 'settings', 'edit');
  const canViewAnalytics = currentUser && hasPermission(currentUser, 'analytics', 'view');
  const canAssignAgents = currentUser && hasPermission(currentUser, 'users', 'assignAgents');
  const isAdvancedUser = currentUser && hasPermission(currentUser, 'settings', 'advanced');

  // Generar fecha actual automáticamente
  const getCurrentDate = () => {
    const now = new Date();
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  const handleCreateUser = (userData: {
    name: string;
    email: string;
    role: UserRole;
  }) => {
    if (!currentUser || !canCreateUsers) return;

    createUser(
      {
        ...userData,
        companyId: currentUser.companyId,
        permissions: userData.role as any, // Se asignará automáticamente en el hook
        isActive: true
      },
      currentUser.id,
      currentUser.name
    );
    setIsCreateUserOpen(false);
  };

  const handleEditUser = (userId: string, updates: Partial<User>) => {
    if (!currentUser || !canEditUsers) return;
    
    updateUser(userId, updates, currentUser.id, currentUser.name);
    setIsEditUserOpen(false);
    setSelectedUser(null);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!currentUser) return;
    
    changeUserRole(userId, newRole, currentUser.id, currentUser.name, currentUser.role);
  };

  const handleToggleStatus = (userId: string) => {
    if (!currentUser || !canEditUsers) return;
    
    toggleUserStatus(userId, currentUser.id, currentUser.name);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500';
      case 'admin': return 'bg-purple-500';
      case 'manager': return 'bg-blue-500';
      case 'employee': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrador';
      case 'manager': return 'Manager';
      case 'employee': return 'Empleado';
      default: return role;
    }
  };

  // NUEVOS ESTADOS: Gestión de asignación de agentes
  const [showAgentAssignmentModal, setShowAgentAssignmentModal] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<User | null>(null);
  const [agentAssignmentData, setAgentAssignmentData] = useState({
    selectedAgents: [] as string[],
    assignmentType: 'custom' as UserAgentAssignment['assignmentType'],
    notes: ''
  });
  const [showAgentAssignments, setShowAgentAssignments] = useState(false);

  // Datos dinámicos
  const agentAssignmentLogs = getAgentAssignmentLogs(10);
  const usersWithCustomAssignments = getUsersWithCustomAssignments();

  // Obtener agentes asignados a un usuario con información completa
  const getUserAgentsWithInfo = (userId: string) => {
    const assignedAgentIds = getUserAssignedAgents(userId);
    return assignedAgentIds.map(agentId => {
      const agent = getAgentById(agentId);
      return {
        id: agentId,
        name: agent?.name || agentId,
        department: agent?.department || 'Desconocido'
      };
    });
  };

  // Función para abrir modal de asignación
  const openAgentAssignmentModal = (user: User) => {
    setSelectedUserForAssignment(user);
    
    // Pre-llenar con asignaciones actuales si las tiene
    if (user.agentAssignments && user.useCustomAgentAccess) {
      setAgentAssignmentData({
        selectedAgents: user.agentAssignments.assignedAgents,
        assignmentType: user.agentAssignments.assignmentType,
        notes: user.agentAssignments.notes || ''
      });
    } else {
      resetAgentAssignmentForm();
    }
    
    setShowAgentAssignmentModal(true);
  };

  // Resetear formulario de asignación de agentes
  const resetAgentAssignmentForm = () => {
    setAgentAssignmentData({
      selectedAgents: [],
      assignmentType: 'custom',
      notes: ''
    });
  };

  // Manejar asignación de agentes
  const handleAssignAgents = () => {
    if (!currentUser || !selectedUserForAssignment || !canAssignAgents) return;

    const success = assignAgentsToUser(
      selectedUserForAssignment.id,
      agentAssignmentData.selectedAgents,
      agentAssignmentData.assignmentType,
      currentUser.id,
      currentUser.name,
      agentAssignmentData.notes || undefined
    );

    if (success) {
      resetAgentAssignmentForm();
      setShowAgentAssignmentModal(false);
      setSelectedUserForAssignment(null);
    }
  };

  // Manejar revocación de agentes
  const handleRevokeAgents = (userId: string) => {
    if (!currentUser || !canAssignAgents) return;

    const success = revokeAgentsFromUser(userId, currentUser.id, currentUser.name);
    if (success) {
      // Actualizar vista si es necesario
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Cargando configuraciones...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Configuración del Sistema</h2>
          <p className="text-muted-foreground">
            Gestiona usuarios, permisos y configuraciones de Copiloto Niawi
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            General
          </TabsTrigger>
          {canManageUsers && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
          )}
          {canAssignAgents && (
            <TabsTrigger value="agent-assignments" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Asignaciones
            </TabsTrigger>
          )}
          {canViewAnalytics && (
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Actividad
            </TabsTrigger>
          )}
          {canManageSettings && (
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Seguridad
            </TabsTrigger>
          )}
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Acerca de
          </TabsTrigger>
        </TabsList>

        {/* Tab General */}
        <TabsContent value="general" className="space-y-6">
          {/* Notifications */}
          <Card className="bg-niawi-surface border-niawi-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>Configura cómo quieres recibir las notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="text-foreground">Notificaciones por email</Label>
                <Switch id="email-notifications" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications" className="text-foreground">Notificaciones push</Label>
                <Switch id="push-notifications" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="insights-alerts" className="text-foreground">Alertas de insights críticos</Label>
                <Switch id="insights-alerts" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* AI Preferences */}
          <Card className="bg-niawi-surface border-niawi-border">
            <CardHeader>
              <CardTitle className="text-foreground">Preferencias de IA</CardTitle>
              <CardDescription>Personaliza el comportamiento del asistente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="proactive-suggestions" className="text-foreground">Sugerencias proactivas</Label>
                <Switch id="proactive-suggestions" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="detailed-analysis" className="text-foreground">Análisis detallado</Label>
                <Switch id="detailed-analysis" />
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card className="bg-niawi-surface border-niawi-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Database className="w-5 h-5" />
                Datos y Privacidad
              </CardTitle>
              <CardDescription>Controla cómo se manejan tus datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="data-analytics" className="text-foreground">Analytics de uso</Label>
                <Switch id="data-analytics" defaultChecked />
              </div>
              <Button variant="outline" className="border-niawi-border hover:bg-niawi-surface">
                <Download className="w-4 h-4 mr-2" />
                Exportar datos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Usuarios */}
        {canManageUsers && (
          <TabsContent value="users" className="space-y-6">
            {/* Estadísticas de usuarios */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-niawi-surface border-niawi-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-niawi-primary">{userStats.total}</div>
                  <p className="text-sm text-muted-foreground">Total Usuarios</p>
                </CardContent>
              </Card>
              <Card className="bg-niawi-surface border-niawi-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-500">{userStats.active}</div>
                  <p className="text-sm text-muted-foreground">Usuarios Activos</p>
                </CardContent>
              </Card>
              <Card className="bg-niawi-surface border-niawi-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-500">{userStats.byRole.admin || 0}</div>
                  <p className="text-sm text-muted-foreground">Administradores</p>
                </CardContent>
              </Card>
              <Card className="bg-niawi-surface border-niawi-border">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-500">{company.maxUsers - company.currentUsers}</div>
                  <p className="text-sm text-muted-foreground">Espacios Disponibles</p>
                </CardContent>
              </Card>
            </div>

            {/* Gestión de usuarios */}
            <Card className="bg-niawi-surface border-niawi-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-foreground">Gestión de Usuarios</CardTitle>
                    <CardDescription>Administra los usuarios de tu organización</CardDescription>
                  </div>
                  {canCreateUsers && (
                    <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-niawi-primary hover:bg-niawi-accent">
                          <Plus className="w-4 h-4 mr-2" />
                          Crear Usuario
                        </Button>
                      </DialogTrigger>
                      <CreateUserDialog 
                        onCreateUser={handleCreateUser}
                        currentUserRole={currentUser?.role || 'employee'}
                      />
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último acceso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={`${getRoleBadgeColor(user.role)} text-white`}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Nunca'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canEditUsers && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsEditUserOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {canEditUsers && user.id !== currentUser?.id && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleToggleStatus(user.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab Actividad */}
        {canViewAnalytics && (
          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-niawi-surface border-niawi-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Logs de Actividad Reciente
                </CardTitle>
                <CardDescription>Últimas 10 actividades del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-niawi-border/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">{log.details}</p>
                        <p className="text-xs text-muted-foreground">
                          por {log.userName} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{log.action}</Badge>
                    </div>
                  ))}
                  {recentLogs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No hay actividad reciente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab Seguridad */}
        {canManageSettings && (
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-niawi-surface border-niawi-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Configuraciones de Seguridad
                </CardTitle>
                <CardDescription>Gestiona la seguridad del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="2fa" className="text-foreground">Autenticación de dos factores</Label>
                  <Switch id="2fa" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="session-timeout" className="text-foreground">Timeout de sesión automático</Label>
                  <Switch id="session-timeout" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-attempts" className="text-foreground">Máximo intentos de login</Label>
                  <Input id="max-attempts" type="number" defaultValue="3" className="w-20" />
                </div>
              </CardContent>
            </Card>

            {/* Resetear datos (solo en desarrollo) */}
            {currentUser?.role === 'super_admin' && (
              <Card className="bg-red-500/10 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-red-400">Zona de Peligro</CardTitle>
                  <CardDescription>Acciones irreversibles - solo para desarrollo</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="destructive" 
                    onClick={resetData}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Resetear Todos los Datos
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Tab Acerca de */}
        <TabsContent value="about">
          <Card className="bg-niawi-surface border-niawi-border">
            <CardHeader>
              <CardTitle className="text-foreground">Acerca de Copiloto Niawi</CardTitle>
              <CardDescription>Información del sistema y la empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Versión:</span>
                  <span className="ml-2 text-foreground font-medium">2.0.0</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Desarrollado por:</span>
                  <span className="ml-2 text-foreground font-medium">Niawi Tech</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sitio web:</span>
                  <a href="http://niawi.tech/" target="_blank" rel="noopener noreferrer" 
                     className="ml-2 text-niawi-primary hover:text-niawi-accent transition-colors">
                    niawi.tech
                  </a>
                </div>
                <div>
                  <span className="text-muted-foreground">Última actualización:</span>
                  <span className="ml-2 text-foreground font-medium">{getCurrentDate()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="ml-2 text-foreground font-medium capitalize">{company.plan}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge className={company.status === 'active' ? 'bg-green-500' : 'bg-orange-500'}>
                    {company.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NUEVA SECCIÓN: Asignaciones de Agentes */}
        {canAssignAgents && (
          <TabsContent value="agent-assignments" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Gestión de Asignaciones de Agentes</h2>
              <p className="text-gray-600 mb-6">
                Asigna agentes específicos a usuarios individuales. Solo usuarios con rol super_admin pueden gestionar estas asignaciones.
              </p>
            </div>

            {/* Estadísticas de asignaciones */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Usuarios con Asignaciones</p>
                      <p className="text-2xl font-bold">{usersWithCustomAssignments.length}</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Agentes</p>
                      <p className="text-2xl font-bold">{allAgents.length}</p>
                    </div>
                    <Bot className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Asignaciones Recientes</p>
                      <p className="text-2xl font-bold">{agentAssignmentLogs.length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Usuarios</p>
                      <p className="text-2xl font-bold">{userStats.total}</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de usuarios para asignación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Usuarios y Sus Asignaciones de Agentes
                </CardTitle>
                <CardDescription>
                  Gestiona qué agentes puede ver cada usuario. Hacer clic en "Asignar Agentes" para configurar acceso específico.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Tipo de Asignación</TableHead>
                      <TableHead>Agentes Asignados</TableHead>
                      <TableHead>Última Modificación</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter(user => user.isActive).map((user) => {
                      const userAgents = getUserAgentsWithInfo(user.id);
                      const hasCustomAssignments = user.useCustomAgentAccess && user.agentAssignments;
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              user.role === 'super_admin' ? 'destructive' :
                              user.role === 'admin' ? 'default' :
                              user.role === 'manager' ? 'secondary' : 'outline'
                            }>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {hasCustomAssignments ? (
                              <div>
                                <Badge variant="default">
                                  {getAssignmentTypeDescription(user.agentAssignments!.assignmentType)}
                                </Badge>
                                {user.agentAssignments!.notes && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {user.agentAssignments!.notes}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline">Basado en rol</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {userAgents.map((agent) => (
                                <Badge key={agent.id} variant="secondary" className="text-xs">
                                  {agent.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {hasCustomAssignments ? (
                              <div className="text-sm text-gray-500">
                                {new Date(user.agentAssignments!.assignedAt).toLocaleDateString()}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">—</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAgentAssignmentModal(user)}
                                disabled={user.id === currentUser.id}
                              >
                                <Bot className="w-4 h-4 mr-1" />
                                {hasCustomAssignments ? 'Editar' : 'Asignar'}
                              </Button>
                              {hasCustomAssignments && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRevokeAgents(user.id)}
                                  disabled={user.id === currentUser.id}
                                >
                                  <Minus className="w-4 h-4 mr-1" />
                                  Revocar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Logs de asignaciones recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Historial de Asignaciones Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentAssignmentLogs.length > 0 ? (
                    agentAssignmentLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            log.action === 'assign_agents' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {log.action === 'assign_agents' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-medium">{log.details}</p>
                            <p className="text-sm text-gray-500">
                              Por {log.userName} • {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {log.assignmentType && (
                          <Badge variant="outline">
                            {getAssignmentTypeDescription(log.assignmentType)}
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No hay registros de asignaciones recientes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Modal de Asignación de Agentes */}
        <Dialog open={showAgentAssignmentModal} onOpenChange={setShowAgentAssignmentModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Asignar Agentes a {selectedUserForAssignment?.name}
              </DialogTitle>
              <DialogDescription>
                Configura qué agentes específicos puede ver este usuario. Esto override los permisos de rol.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Tipo de asignación */}
              <div>
                <Label htmlFor="assignmentType">Tipo de Asignación</Label>
                <Select
                  value={agentAssignmentData.assignmentType}
                  onValueChange={(value) => setAgentAssignmentData(prev => ({
                    ...prev,
                    assignmentType: value as UserAgentAssignment['assignmentType']
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Asignación Personalizada (ignora rol)</SelectItem>
                    <SelectItem value="role_based">Basado en Rol + Agentes Adicionales</SelectItem>
                    <SelectItem value="restricted">Restricción (reduce acceso del rol)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  {getAssignmentTypeDescription(agentAssignmentData.assignmentType)}
                </p>
              </div>

              {/* Selección de agentes */}
              <div>
                <Label>Agentes Disponibles</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {allAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={agent.id}
                        checked={agentAssignmentData.selectedAgents.includes(agent.id)}
                                                 onCheckedChange={(checked: boolean) => {
                          setAgentAssignmentData(prev => ({
                            ...prev,
                            selectedAgents: checked
                              ? [...prev.selectedAgents, agent.id]
                              : prev.selectedAgents.filter(id => id !== agent.id)
                          }));
                        }}
                      />
                      <Label htmlFor={agent.id} className="flex items-center gap-2 cursor-pointer">
                        <agent.icon className={`w-4 h-4 ${agent.color}`} />
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-xs text-gray-500">{agent.department}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={agentAssignmentData.notes}
                  onChange={(e) => setAgentAssignmentData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Razón de esta asignación específica..."
                  rows={3}
                />
              </div>

              {/* Vista previa */}
              {agentAssignmentData.selectedAgents.length > 0 && (
                <Alert>
                  <ArrowRight className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Vista previa:</strong> {selectedUserForAssignment?.name} tendrá acceso a:{' '}
                    {agentAssignmentData.selectedAgents.map(id => {
                      const agent = getAgentById(id);
                      return agent?.name || id;
                    }).join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAgentAssignmentModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAssignAgents}
                disabled={agentAssignmentData.selectedAgents.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Asignación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>

      {/* Modal de edición de usuario */}
      {selectedUser && (
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <EditUserDialog 
            user={selectedUser}
            onUpdateUser={handleEditUser}
            onChangeRole={handleRoleChange}
            currentUserRole={currentUser?.role || 'employee'}
          />
        </Dialog>
      )}
      </div>
    </div>
  );
};

// Componente para crear usuario
const CreateUserDialog: React.FC<{
  onCreateUser: (userData: { name: string; email: string; role: UserRole }) => void;
  currentUserRole: UserRole;
}> = ({ onCreateUser, currentUserRole }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('employee');

  const assignableRoles = getAssignableRoles(currentUserRole);

  const handleSubmit = () => {
    if (name && email && role) {
      onCreateUser({ name, email, role });
      setName('');
      setEmail('');
      setRole('employee');
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogDescription>
          Agrega un nuevo usuario a tu organización
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre completo</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Pérez"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@empresa.com"
          />
        </div>
        <div>
          <Label htmlFor="role">Rol</Label>
          <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent>
              {assignableRoles.map((r) => (
                <SelectItem key={r} value={r}>
                  {r === 'admin' ? 'Administrador' : 
                   r === 'manager' ? 'Manager' : 
                   r === 'employee' ? 'Empleado' : r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={!name || !email}>
          Crear Usuario
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

// Componente para editar usuario  
const EditUserDialog: React.FC<{
  user: User;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onChangeRole: (userId: string, newRole: UserRole) => void;
  currentUserRole: UserRole;
}> = ({ user, onUpdateUser, onChangeRole, currentUserRole }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);

  const assignableRoles = getAssignableRoles(currentUserRole);
  const canChangeRole = assignableRoles.includes(role);

  const handleSubmit = () => {
    const updates: Partial<User> = {};
    if (name !== user.name) updates.name = name;
    if (email !== user.email) updates.email = email;
    
    if (Object.keys(updates).length > 0) {
      onUpdateUser(user.id, updates);
    }
    
    if (role !== user.role && canChangeRole) {
      onChangeRole(user.id, role);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogDescription>
          Modifica la información del usuario
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="edit-name">Nombre completo</Label>
          <Input 
            id="edit-name" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="edit-email">Email</Label>
          <Input 
            id="edit-email" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="edit-role">Rol</Label>
          <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignableRoles.map((r) => (
                <SelectItem key={r} value={r}>
                  {r === 'admin' ? 'Administrador' : 
                   r === 'manager' ? 'Manager' : 
                   r === 'employee' ? 'Empleado' : r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit}>
          Guardar Cambios
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default Settings;
