import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, Bot, Zap, Settings, Menu, LogOut, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NiawiLogo from './NiawiLogo';
// import RoleSwitcher from './RoleSwitcher'; // TODO: Mover a Settings cuando se implemente sistema super_admin
import { useAuth } from '@/hooks/useAuth';
import { useAgent } from '@/hooks/useAgent';
import { hasPermission } from '@/constants/agents';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, logout, requireAuth } = useAuth();
  const { currentUser } = useAgent();
  


  // Proteger rutas - verificar autenticación
  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  // Configurar elementos del menú con control de permisos
  const getMenuItems = () => {
    const menuItems = [];

    // 1. Recomendaciones - Primera opción si puede ver analytics
    if (currentUser && hasPermission(currentUser, 'analytics', 'view')) {
      menuItems.push({
        title: 'Recomendaciones',
        path: '/dashboard/recommendations',
        icon: TrendingUp,
        badge: '3',
        badgeColor: 'bg-niawi-danger',
        subtitle: 'Insights estratégicos basados en IA',
        permission: { module: 'analytics' as const, action: 'view' }
      });
    }

    // 2. Chat IA - Siempre disponible como segunda opción
    menuItems.push({
      title: 'Chat IA',
      path: '/dashboard/chat',
      icon: Bot,
      badge: 'IA',
      badgeColor: 'bg-niawi-primary',
      subtitle: 'Conversa con agentes de IA especializados',
      permission: { module: 'chat' as const, action: 'access' }
    });

    // 3. Administrar Agentes - Solo si puede gestionar agentes
    if (currentUser && hasPermission(currentUser, 'agents', 'view')) {
      menuItems.push({
        title: 'Administrar Agentes',
        path: '/dashboard/agents',
        icon: Settings,
        badge: '4',
        badgeColor: 'bg-niawi-accent',
        subtitle: 'Gestión y analytics del ecosistema IA',
        permission: { module: 'agents' as const, action: 'view' }
      });
    }

    // 4. Integraciones - Solo para admin y super_admin
    if (currentUser && ['admin', 'super_admin'].includes(currentUser.role)) {
      menuItems.push({
        title: 'Integraciones',
        path: '/dashboard/integrations',
        icon: Zap,
        badge: '4/5',
        badgeColor: 'bg-niawi-warning',
        subtitle: 'Ecosistema empresarial conectado',
        permission: null // No necesita permiso específico, solo rol
      });
    }

    // 5. Configuración - Solo si puede ver settings
    if (currentUser && hasPermission(currentUser, 'settings', 'view')) {
      menuItems.push({
        title: 'Configuración',
        path: '/dashboard/settings',
        icon: Shield,
        badge: currentUser.role === 'super_admin' ? 'ADMIN' : undefined,
        badgeColor: 'bg-red-500',
        subtitle: 'Gestión de usuarios y configuraciones del sistema',
        permission: { module: 'settings' as const, action: 'view' }
      });
    }

    return menuItems;
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
  };

  // Mostrar loading mientras se verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-niawi-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-niawi-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada (useAuth ya redirige)
  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/dashboard/chat' && location.pathname === '/dashboard') return true;
    return location.pathname === path;
  };

  // Función para obtener las iniciales del usuario
  const getUserInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // Función para obtener el color del badge del rol
  const getRoleBadgeColor = () => {
    if (!currentUser) return 'bg-gray-500';
    switch (currentUser.role) {
      case 'super_admin': return 'bg-red-500';
      case 'admin': return 'bg-purple-500';
      case 'manager': return 'bg-blue-500';
      case 'employee': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleLabel = () => {
    if (!currentUser) return 'Usuario';
    switch (currentUser.role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrador';
      case 'manager': return 'Manager';
      case 'employee': return 'Empleado';
      default: return currentUser.role;
    }
  };

  return (
    <div className="min-h-screen max-h-screen bg-niawi-bg flex overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-80'} w-80 bg-niawi-surface border-r border-niawi-border transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex-shrink-0`}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-niawi-border flex-shrink-0">
            {sidebarCollapsed ? (
              <div className="w-8 h-8 bg-niawi-primary rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            ) : (
              <NiawiLogo size="md" />
            )}
            
            <div className="flex items-center gap-2">
              {/* Botón colapsar desktop */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex text-muted-foreground hover:text-foreground"
                title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              >
                <Menu className="w-4 h-4" />
              </Button>
              
              {/* Botón cerrar móvil */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-muted-foreground hover:text-foreground"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-track-niawi-surface scrollbar-thumb-niawi-border">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center ${sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'} rounded-xl transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-niawi-primary text-white shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-niawi-border/50'
                  }`}
                  title={sidebarCollapsed ? item.title : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{item.title}</span>
                          {item.badge && (
                            <Badge className={`${item.badgeColor} text-white text-xs flex-shrink-0 ml-2`}>
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-current opacity-70 truncate">{item.subtitle}</p>
                      </div>
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-6 border-t border-niawi-border flex-shrink-0">
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="Usuario" />
                    <AvatarFallback className="bg-niawi-primary text-white">
                      {currentUser ? getUserInitials(currentUser.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getRoleBadgeColor()} rounded-full border-2 border-niawi-surface`}></div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-niawi-danger"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-niawi-border/30">
                <div className="relative flex-shrink-0">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="Usuario" />
                    <AvatarFallback className="bg-niawi-primary text-white">
                      {currentUser ? getUserInitials(currentUser.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getRoleBadgeColor()} rounded-full border-2 border-niawi-surface`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {currentUser?.name || 'Usuario'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentUser?.email || 'Sin email'}
                  </p>
                  <Badge className={`${getRoleBadgeColor()} text-white text-xs mt-1`}>
                    {getRoleLabel()}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-niawi-danger flex-shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-niawi-surface border-b border-niawi-border px-4 py-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground hover:bg-niawi-border/30 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground truncate px-4">
              {menuItems.find(item => isActive(item.path))?.title || 'Etres AI Nexus'}
            </h1>
            <div className="w-9 flex-shrink-0" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}




    </div>
  );
};

export default DashboardLayout;
