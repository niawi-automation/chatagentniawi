# Checklist de Pruebas de Autenticación

Este documento contiene el checklist completo para validar la integración del backend de autenticación con el frontend.

## Configuración Inicial

Antes de comenzar las pruebas, asegúrate de tener:

- [ ] Variables de entorno configuradas:
  - `VITE_AUTH_BASE_URL=https://aiauth.e3stores.cloud`
  - `VITE_AUTH_CLIENT_ID=019986ed-5fea-7886-a2b6-e35968f8ef17`
- [ ] Servidor de desarrollo ejecutándose (`npm run dev`)
- [ ] Conexión a internet estable
- [ ] Credenciales de prueba válidas

## 1. Autenticación Básica

### 1.1 Login Exitoso
- [ ] **Objetivo**: Verificar login con credenciales válidas
- [ ] **Pasos**:
  1. Navegar a `/login`
  2. Ingresar email válido: `test@e3ecommerce.com.ar`
  3. Ingresar contraseña válida: `123Awd@dm1n`
  4. Hacer clic en "Iniciar Sesión"
- [ ] **Resultado esperado**:
  - Redirección automática a `/dashboard`
  - Sidebar muestra información del usuario autenticado
  - No hay errores en consola

### 1.2 Login Fallido
- [ ] **Objetivo**: Verificar manejo de credenciales inválidas
- [ ] **Pasos**:
  1. Navegar a `/login`
  2. Ingresar email inválido o incorrecto
  3. Ingresar contraseña incorrecta
  4. Hacer clic en "Iniciar Sesión"
- [ ] **Resultado esperado**:
  - Mensaje de error específico: "Credenciales incorrectas"
  - Usuario permanece en página de login
  - No hay redirección

### 1.3 Validación de Campos
- [ ] **Objetivo**: Verificar validaciones de formulario
- [ ] **Pasos**:
  1. Intentar enviar formulario vacío
  2. Ingresar email con formato inválido
  3. Ingresar contraseña muy corta
- [ ] **Resultado esperado**:
  - Mensajes de error específicos para cada campo
  - Formulario no se envía hasta validar

## 2. Gestión de Sesión

### 2.1 Restauración de Sesión
- [ ] **Objetivo**: Verificar que la sesión se restaura al recargar
- [ ] **Pasos**:
  1. Hacer login exitoso
  2. Recargar la página (F5)
  3. Verificar que sigue autenticado
- [ ] **Resultado esperado**:
  - Página muestra "Restaurando sesión..." brevemente
  - Usuario permanece logueado
  - Redirección automática a dashboard

### 2.2 Refresh Automático de Token
- [ ] **Objetivo**: Verificar refresh proactivo de tokens
- [ ] **Pasos**:
  1. Hacer login exitoso
  2. Esperar 3540 segundos (59 minutos)
  3. Verificar en Network tab que se hace refresh automático
- [ ] **Resultado esperado**:
  - Request a `/auth/refresh` se ejecuta automáticamente
  - Usuario no es deslogueado
  - Nueva expiración programada

### 2.3 Logout
- [ ] **Objetivo**: Verificar limpieza completa de sesión
- [ ] **Pasos**:
  1. Hacer login exitoso
  2. Hacer clic en botón de logout en sidebar
  3. Verificar limpieza de tokens
- [ ] **Resultado esperado**:
  - Redirección a `/login`
  - Tokens eliminados de memoria y sessionStorage
  - No se puede acceder a rutas protegidas

## 3. Rutas Protegidas

### 3.1 Acceso sin Autenticación
- [ ] **Objetivo**: Verificar que rutas protegidas redirigen a login
- [ ] **Pasos**:
  1. Sin estar logueado, navegar directamente a `/dashboard`
  2. Intentar acceder a `/dashboard/agents`
  3. Intentar acceder a `/dashboard/settings`
- [ ] **Resultado esperado**:
  - Redirección automática a `/login`
  - Mensaje "Restaurando sesión..." antes de redirigir
  - Return URL guardada para volver tras login

### 3.2 Acceso con Autenticación
- [ ] **Objetivo**: Verificar acceso normal a rutas protegidas
- [ ] **Pasos**:
  1. Hacer login exitoso
  2. Navegar entre diferentes secciones del dashboard
  3. Verificar que todas las rutas son accesibles
- [ ] **Resultado esperado**:
  - Acceso libre a todas las rutas del dashboard
  - Sidebar funciona correctamente
  - Navegación fluida entre secciones

## 4. Registro de Usuarios

### 4.1 Registro Exitoso
- [ ] **Objetivo**: Verificar registro de nuevo usuario
- [ ] **Pasos**:
  1. Navegar a `/register`
  2. Ingresar email válido y disponible
  3. Ingresar contraseña que cumpla requisitos
  4. Confirmar contraseña
  5. Hacer clic en "Crear Cuenta"
- [ ] **Resultado esperado**:
  - Mensaje de éxito
  - Redirección a login con mensaje informativo
  - Email de confirmación enviado (verificar bandeja)

### 4.2 Validación de Contraseña
- [ ] **Objetivo**: Verificar validaciones de contraseña fuerte
- [ ] **Pasos**:
  1. Intentar contraseña sin mayúscula
  2. Intentar contraseña sin número
  3. Intentar contraseña sin carácter especial
  4. Intentar contraseña muy corta
- [ ] **Resultado esperado**:
  - Mensajes específicos para cada requisito
  - Formulario no se envía hasta cumplir todos los requisitos

### 4.3 Confirmación de Email
- [ ] **Objetivo**: Verificar proceso de confirmación
- [ ] **Pasos**:
  1. Registrarse con email válido
  2. Revisar email recibido
  3. Hacer clic en enlace de confirmación
  4. Verificar redirección y mensaje
- [ ] **Resultado esperado**:
  - Email recibido con enlace válido
  - Página de confirmación muestra éxito
  - Usuario puede hacer login después

## 5. Recuperación de Contraseña

### 5.1 Solicitud de Reset
- [ ] **Objetivo**: Verificar solicitud de reset de contraseña
- [ ] **Pasos**:
  1. Navegar a `/forgot-password`
  2. Ingresar email registrado
  3. Hacer clic en "Enviar enlace de recuperación"
- [ ] **Resultado esperado**:
  - Mensaje de confirmación (aunque email no exista)
  - Página de éxito con instrucciones
  - Email con código de reset (si existe)

### 5.2 Reset de Contraseña
- [ ] **Objetivo**: Verificar reset con código
- [ ] **Pasos**:
  1. Obtener código de reset del email
  2. Navegar a `/reset-password?code=CODIGO`
  3. Ingresar email y nueva contraseña
  4. Confirmar contraseña
  5. Hacer clic en "Restablecer Contraseña"
- [ ] **Resultado esperado**:
  - Reset exitoso
  - Redirección a login con mensaje de éxito
  - Usuario puede login con nueva contraseña

## 6. Autenticación de Dos Factores (2FA)

### 6.1 Login con 2FA Requerido
- [ ] **Objetivo**: Verificar flujo de 2FA en login
- [ ] **Pasos**:
  1. Configurar 2FA en cuenta (desde Settings)
  2. Intentar login con credenciales válidas
  3. Verificar que se pide código 2FA
  4. Ingresar código correcto
- [ ] **Resultado esperado**:
  - Después de login, se muestra paso 2FA
  - Input para código de 6 dígitos
  - Login exitoso con código correcto

### 6.2 Login con Código 2FA Incorrecto
- [ ] **Objetivo**: Verificar manejo de código 2FA incorrecto
- [ ] **Pasos**:
  1. Llegar al paso 2FA
  2. Ingresar código incorrecto
  3. Intentar continuar
- [ ] **Resultado esperado**:
  - Mensaje de error específico
  - Usuario puede reintentar
  - No se hace logout automático

## 7. Manejo de Errores

### 7.1 Lockout por Intentos Fallidos
- [ ] **Objetivo**: Verificar bloqueo tras múltiples intentos
- [ ] **Pasos**:
  1. Intentar login con contraseña incorrecta 5 veces seguidas
  2. Verificar mensaje de bloqueo
  3. Esperar 5 minutos
  4. Intentar login nuevamente
- [ ] **Resultado esperado**:
  - Mensaje "Cuenta bloqueada por 5 minutos"
  - No se pueden hacer más intentos
  - Después de 5 min, funciona normalmente

### 7.2 Errores de Red
- [ ] **Objetivo**: Verificar manejo de errores de conexión
- [ ] **Pasos**:
  1. Desconectar internet
  2. Intentar login
  3. Reconectar internet
  4. Intentar login nuevamente
- [ ] **Resultado esperado**:
  - Mensaje de error de conexión
  - Retry automático al reconectar
  - Login funciona tras reconectar

### 7.3 Token Expirado
- [ ] **Objetivo**: Verificar manejo de token expirado
- [ ] **Pasos**:
  1. Hacer login exitoso
  2. Esperar expiración del token (1 hora)
  3. Intentar hacer alguna acción
- [ ] **Resultado esperado**:
  - Refresh automático del token
  - Si falla refresh, logout automático
  - Redirección a login con mensaje apropiado

## 8. Integración con Sistema de Roles

### 8.1 Mapeo a Super Admin
- [ ] **Objetivo**: Verificar que usuario autenticado tiene rol super_admin
- [ ] **Pasos**:
  1. Hacer login exitoso
  2. Verificar en sidebar que muestra rol "Super Admin"
  3. Verificar acceso a todas las secciones
  4. Verificar permisos completos
- [ ] **Resultado esperado**:
  - Badge de rol correcto en sidebar
  - Acceso a todas las funcionalidades
  - Permisos de super_admin activos

### 8.2 Información de Usuario
- [ ] **Objetivo**: Verificar que se muestra información correcta del usuario
- [ ] **Pasos**:
  1. Hacer login exitoso
  2. Verificar avatar y nombre en sidebar
  3. Verificar email mostrado
  4. Verificar iniciales en avatar
- [ ] **Resultado esperado**:
  - Nombre correcto del backend
  - Email correcto del backend
  - Iniciales calculadas correctamente

## 9. Pruebas de Seguridad

### 9.1 Tokens en Memoria
- [ ] **Objetivo**: Verificar que accessToken no se guarda en localStorage
- [ ] **Pasos**:
  1. Hacer login exitoso
  2. Abrir DevTools > Application > Local Storage
  3. Verificar que no hay tokens en localStorage
  4. Verificar que refreshToken está en sessionStorage
- [ ] **Resultado esperado**:
  - No hay accessToken en localStorage
  - refreshToken solo en sessionStorage
  - accessToken solo en memoria

### 9.2 Headers de Cliente
- [ ] **Objetivo**: Verificar que se envían headers correctos
- [ ] **Pasos**:
  1. Hacer login exitoso
  2. Abrir DevTools > Network
  3. Hacer alguna acción que genere request
  4. Verificar headers en requests
- [ ] **Resultado esperado**:
  - Header `ClientId` presente
  - Header `Client-Id` presente
  - Header `Authorization: Bearer` en requests autenticados

## 10. Pruebas de UX

### 10.1 Estados de Carga
- [ ] **Objetivo**: Verificar que se muestran estados de carga apropiados
- [ ] **Pasos**:
  1. Hacer login (verificar spinner)
  2. Recargar página (verificar "Restaurando sesión...")
  3. Hacer logout (verificar transición)
- [ ] **Resultado esperado**:
  - Spinners durante operaciones
  - Mensajes informativos
  - Transiciones suaves

### 10.2 Mensajes de Error
- [ ] **Objetivo**: Verificar que mensajes de error son claros
- [ ] **Pasos**:
  1. Probar diferentes tipos de errores
  2. Verificar que mensajes son específicos
  3. Verificar que no hay mensajes técnicos
- [ ] **Resultado esperado**:
  - Mensajes en español
  - Mensajes específicos y útiles
  - No hay información técnica expuesta

## 11. Pruebas de Compatibilidad

### 11.1 Diferentes Navegadores
- [ ] **Objetivo**: Verificar compatibilidad cross-browser
- [ ] **Pasos**:
  1. Probar en Chrome
  2. Probar en Firefox
  3. Probar en Safari (si disponible)
  4. Probar en Edge
- [ ] **Resultado esperado**:
  - Funcionalidad idéntica en todos los navegadores
  - Estilos consistentes
  - No hay errores de JavaScript

### 11.2 Responsive Design
- [ ] **Objetivo**: Verificar que funciona en móviles
- [ ] **Pasos**:
  1. Probar en tamaño de pantalla móvil
  2. Verificar que formularios son usables
  3. Verificar que sidebar funciona en móvil
- [ ] **Resultado esperado**:
  - Formularios adaptados a pantalla pequeña
  - Sidebar colapsable en móvil
  - Navegación táctil funcional

## Criterios de Aprobación

Para considerar la integración exitosa, se deben cumplir:

- [ ] **Todas las pruebas básicas pasan** (secciones 1-3)
- [ ] **Registro y confirmación funcionan** (sección 4)
- [ ] **Recuperación de contraseña funciona** (sección 5)
- [ ] **2FA funciona correctamente** (sección 6)
- [ ] **Manejo de errores es robusto** (sección 7)
- [ ] **Integración con roles funciona** (sección 8)
- [ ] **Seguridad es adecuada** (sección 9)
- [ ] **UX es satisfactoria** (sección 10)
- [ ] **Compatibilidad es buena** (sección 11)

## Notas Adicionales

- **Tiempo estimado**: 2-3 horas para completar todas las pruebas
- **Pruebas críticas**: Secciones 1, 2, 3, 7, 9 (deben pasar obligatoriamente)
- **Pruebas opcionales**: Secciones 6, 10, 11 (mejoras de calidad)
- **Documentación**: Documentar cualquier comportamiento inesperado
- **Bugs encontrados**: Registrar en issues con pasos para reproducir
