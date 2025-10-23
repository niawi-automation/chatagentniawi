import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateCredentials, isEnvironmentConfigured } from '@/utils/authSecurity';

/**
 * @deprecated Este hook usa autenticación mock con credenciales hardcodeadas.
 * 
 * Para el sistema de autenticación real con backend, usar:
 * `useAuthContext` de @/contexts/AuthContext
 * 
 * Este archivo se mantiene temporalmente por compatibilidad con código legacy.
 * No debe usarse para nuevas implementaciones.
 */

// Definir tipos de usuarios
export interface UserAuth {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'employee' | 'automations_user';
  accessType: 'full' | 'automations_only';
}

/**
 * @deprecated Usar useAuthContext de @/contexts/AuthContext en su lugar
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserAuth | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar configuración de entorno al cargar
    const isConfigured = isEnvironmentConfigured();
    if (!isConfigured) {
      console.warn('⚠️ Variables de entorno de autenticación no configuradas. Usando valores por defecto.');
    } else {
      console.log('✅ Variables de entorno de autenticación configuradas correctamente.');
    }

    // Verificar si el usuario está autenticado
    const authData = localStorage.getItem('niawi-auth');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        if (userData.userId && userData.email) {
          setIsAuthenticated(true);
          setCurrentUser(userData);
          console.log('👤 Usuario cargado desde localStorage:', userData.email);
        } else {
          localStorage.removeItem('niawi-auth');
        }
      } catch (error) {
        console.error('❌ Error al cargar usuario desde localStorage:', error);
        localStorage.removeItem('niawi-auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string): { success: boolean; message?: string; user?: UserAuth } => {
    console.log('🔐 Iniciando proceso de login para:', email);
    
    // Validar credenciales usando el sistema seguro
    const validCredential = validateCredentials(email, password);
    
    if (validCredential) {
      console.log('✅ Usuario válido encontrado:', validCredential.user.email);
      
      const authData = {
        userId: validCredential.user.id,
        email: validCredential.user.email,
        name: validCredential.user.name,
        role: validCredential.user.role,
        accessType: validCredential.user.accessType,
        timestamp: Date.now()
      };
      
      localStorage.setItem('niawi-auth', JSON.stringify(authData));
      setIsAuthenticated(true);
      setCurrentUser(validCredential.user);
      
      console.log('✅ Autenticación exitosa, datos guardados en localStorage');
      return { success: true, user: validCredential.user };
    }
    
    console.log('❌ Credenciales inválidas para:', email);
    return { success: false, message: 'Credenciales incorrectas. Acceso denegado.' };
  };

  const logout = () => {
    console.log('👋 Cerrando sesión para:', currentUser?.email);
    localStorage.removeItem('niawi-auth');
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate('/login');
  };

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  };

  return {
    isAuthenticated,
    isLoading,
    currentUser,
    login,
    logout,
    requireAuth
  };
};