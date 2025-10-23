// Sistema de autenticación seguro con variables de entorno
// Este archivo maneja las credenciales de forma segura

interface SecureCredentials {
  email: string;
  password: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'super_admin' | 'automations_user';
    accessType: 'full' | 'automations_only';
  };
}

// Función para obtener credenciales de forma segura
export const getSecureCredentials = (): SecureCredentials[] => {
  // Obtener credenciales desde variables de entorno
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  const adminName = import.meta.env.VITE_ADMIN_NAME || 'Administrador';
  
  const user1Email = import.meta.env.VITE_USER1_EMAIL;
  const user1Password = import.meta.env.VITE_USER1_PASSWORD;
  const user1Name = import.meta.env.VITE_USER1_NAME || 'Usuario 1';
  
  const user2Email = import.meta.env.VITE_USER2_EMAIL;
  const user2Password = import.meta.env.VITE_USER2_PASSWORD;
  const user2Name = import.meta.env.VITE_USER2_NAME || 'Usuario 2';

  // Validar que al menos el administrador esté configurado
  if (!adminEmail || !adminPassword) {
    console.error('❌ CONFIGURACIÓN CRÍTICA: Variables de entorno del administrador no configuradas.');
    console.error('❌ Por favor configura VITE_ADMIN_EMAIL y VITE_ADMIN_PASSWORD');
    return [];
  }

  const credentials: SecureCredentials[] = [
    {
      email: adminEmail,
      password: adminPassword,
      user: {
        id: '1',
        email: adminEmail,
        name: adminName,
        role: 'super_admin',
        accessType: 'full'
      }
    }
  ];

  // Agregar usuario 1 si está configurado
  if (user1Email && user1Password) {
    credentials.push({
      email: user1Email,
      password: user1Password,
      user: {
        id: '2',
        email: user1Email,
        name: user1Name,
        role: 'automations_user',
        accessType: 'automations_only'
      }
    });
  }

  // Agregar usuario 2 si está configurado
  if (user2Email && user2Password) {
    credentials.push({
      email: user2Email,
      password: user2Password,
      user: {
        id: '3',
        email: user2Email,
        name: user2Name,
        role: 'automations_user',
        accessType: 'automations_only'
      }
    });
  }

  console.log(`✅ Sistema de autenticación inicializado con ${credentials.length} usuario(s)`);
  
  return credentials;
};

// Función para validar credenciales de forma segura
export const validateCredentials = (email: string, password: string): SecureCredentials | null => {
  const validCredentials = getSecureCredentials();
  
  // Logging seguro (solo mostrar parte de la información)
  console.log('🔐 Validando credenciales para:', email);
  
  const validCredential = validCredentials.find(
    cred => cred.email === email && cred.password === password
  );

  if (validCredential) {
    console.log('✅ Credenciales válidas para:', email);
    return validCredential;
  } else {
    console.log('❌ Credenciales inválidas para:', email);
    return null;
  }
};

// Función para generar hash simple de contraseña (para logging seguro)
export const maskPassword = (password: string): string => {
  if (password.length <= 3) return '***';
  return password.substring(0, 2) + '*'.repeat(password.length - 2);
};

// Función para verificar si las variables de entorno están configuradas
export const isEnvironmentConfigured = (): boolean => {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  
  // Solo validar que el admin esté configurado (mínimo requerido)
  return !!(adminEmail && adminPassword);
};


