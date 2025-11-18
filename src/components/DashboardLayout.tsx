import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, Bot, Zap, Settings, Menu, LogOut, User, Shield, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EtresLogo from './EtresLogo';
import ThemeToggle from './ThemeToggle';
// import RoleSwitcher from './RoleSwitcher'; // TODO: Mover a Settings cuando se implemente sistema super_admin
import { useAuthContext } from '@/contexts/AuthContext';
import { useAgent } from '@/hooks/useAgent';
import { hasPermission } from '@/constants/agents';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, logout } = useAuthContext();
  const { currentUser } = useAgent();
  
  

  // Configurar elementos del menú con control de permisos
  const getMenuItems = () => {
    const menuItems = [];

    // Si es usuario bot, solo mostrar automatizaciones
    // Temporalmente oculto del menú
    // if (authUser && authUser.accessType === 'automations_only') {
    //   menuItems.push({
    //     title: 'Automatizaciones',
    //     path: '/dashboard/automations',
    //     icon: FileSpreadsheet,
    //     badge: '3',
    //     badgeColor: 'bg-niawi-secondary',
    //     subtitle: 'Procesamiento automático de archivos Excel',
    //     permission: null
    //   });
    //   return menuItems;
    // }

    // Menú completo para usuarios normales
    // 1. Recomendaciones - Primera opción si puede ver analytics
    if (currentUser && hasPermission(currentUser, 'analytics', 'view')) {
      menuItems.push({
        title: 'Recomendaciones',
        path: '/dashboard/recommendations',
        icon: TrendingUp,
        badge: '3',
        badgeColor: 'bg-red-500',
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
      badgeColor: 'bg-primary',
      subtitle: 'Conversa con agentes de IA especializados',
      permission: { module: 'chat' as const, action: 'access' }
    });

    // 3. Administrar Agentes - Solo si puede gestionar agentes
    // Temporalmente oculto del menú
    // if (currentUser && hasPermission(currentUser, 'agents', 'view')) {
    //   menuItems.push({
    //     title: 'Administrar Agentes',
    //     path: '/dashboard/agents',
    //     icon: Settings,
    //     badge: '4',
    //     badgeColor: 'bg-niawi-accent',
    //     subtitle: 'Gestión y analytics del ecosistema IA',
    //     permission: { module: 'agents' as const, action: 'view' }
    //   });
    // }

    // 4. Integraciones - Solo para admin y super_admin
    if (currentUser && ['admin', 'super_admin'].includes(currentUser.role)) {
      menuItems.push({
        title: 'Integraciones',
        path: '/dashboard/integrations',
        icon: Zap,
        badge: '4/5',
        badgeColor: 'bg-yellow-500',
        subtitle: 'Ecosistema empresarial conectado',
        permission: null // No necesita permiso específico, solo rol
      });
    }

    // 5. Automatizaciones - Acceso general para todos los usuarios
    // Temporalmente oculto del menú
    // menuItems.push({
    //   title: 'Automatizaciones',
    //   path: '/dashboard/automations',
    //   icon: FileSpreadsheet,
    //   badge: '3',
    //   badgeColor: 'bg-niawi-secondary',
    //   subtitle: 'Procesamiento automático de archivos Excel',
    //   permission: null // Acceso general
    // });

    // 6. Configuración - Solo si puede ver settings
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
    <div className="min-h-screen max-h-screen gradient-dashboard flex overflow-hidden">
      {/* Sidebar - Glass Effect */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-80'} w-80 bg-sidebar-background/95 backdrop-blur-md border-r border-sidebar-border transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } sidebar-transition lg:translate-x-0 lg:static lg:inset-0 flex-shrink-0 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none`}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header - User Profile */}
          <div className={`border-b border-sidebar-border flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'px-3 py-4' : 'p-6 pb-5'}`}>
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                {/* Botón expandir cuando está colapsado */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(false)}
                  className="hidden lg:flex text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
                  title="Expandir sidebar"
                >
                  <Menu className="w-4 h-4" />
                </Button>

                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="Usuario" />
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                      {currentUser ? getUserInitials(currentUser.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getRoleBadgeColor()} rounded-full border-2 border-sidebar-background ${currentUser?.role === 'super_admin' ? 'animate-pulse-slow' : ''}`}></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src="/placeholder-avatar.jpg" alt="Usuario" />
                        <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-base">
                          {currentUser ? getUserInitials(currentUser.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getRoleBadgeColor()} rounded-full border-2 border-sidebar-background ${currentUser?.role === 'super_admin' ? 'animate-pulse-slow' : ''}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-sidebar-foreground truncate">
                        {currentUser?.name || 'Usuario'}
                      </p>
                      <p className="text-sm text-sidebar-foreground/70 truncate">
                        {currentUser?.email || 'Sin email'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Botón colapsar desktop */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(true)}
                    className="hidden lg:flex text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 flex-shrink-0"
                    title="Colapsar sidebar"
                  >
                    <Menu className="w-4 h-4" />
                  </Button>

                  {/* Botón cerrar móvil */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 flex-shrink-0"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </div>
                <Badge className={`${getRoleBadgeColor()} text-white text-xs`}>
                  {getRoleLabel()}
                </Badge>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${sidebarCollapsed ? 'p-3' : 'p-6'} space-y-2 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-sidebar-border transition-all duration-300`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center ${sidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3'} rounded-xl relative ${
                    isActive(item.path)
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg hover:shadow-xl hover:shadow-sidebar-primary/40 animate-glow-pulse'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:backdrop-blur-sm hover:shadow-md'
                  }`}
                  style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', transform: 'translateZ(0)' }}
                  title={sidebarCollapsed ? item.title : undefined}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarCollapsed && item.badge && (
                      <div className={`absolute -top-1 -right-1 w-3 h-3 ${item.badgeColor} rounded-full text-xs flex items-center justify-center`}>
                        <span className="text-[8px] text-white font-bold">{item.badge}</span>
                      </div>
                    )}
                  </div>
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

          {/* Footer - Theme Toggle & Logout */}
          <div className={`${sidebarCollapsed ? 'p-3' : 'p-6'} border-t border-sidebar-border flex-shrink-0 transition-all duration-300`}>
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                <ThemeToggle className="scale-90" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-sidebar-foreground/70 hover:text-destructive transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors">
                  <span className="text-sm text-sidebar-foreground/70">Tema</span>
                  <ThemeToggle />
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full border-sidebar-border hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header - Glass */}
        <div className="lg:hidden bg-card/95 backdrop-blur-md border-b border-border px-4 py-4 flex-shrink-0 shadow-lg">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground truncate px-4">
              {menuItems.find(item => isActive(item.path))?.title || 'E.tres Agent'}
            </h1>
            <div className="w-10"></div>
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
