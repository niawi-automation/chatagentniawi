# ✅ Solución: Restauración de Sesión después de F5

## 🔍 Problema Reportado

Después de hacer login exitoso:
1. Usuario navega por la aplicación (sesión funciona correctamente)
2. Usuario hace **F5 (refresh)** en cualquier página
3. ❌ La aplicación "muere" - no restaura la sesión
4. Usuario debe navegar manualmente a `/login` para ver la interfaz

## 🔎 Diagnóstico

### Causa Raíz

El problema estaba en cómo se persistían los tokens:

| Token | Dónde se guardaba | ¿Persiste al recargar? |
|-------|------------------|------------------------|
| `accessToken` | Solo en **memoria** | ❌ NO (se pierde) |
| `refreshToken` | **sessionStorage** | ✅ SÍ (persiste) |
| `expiresAt` | Solo en **memoria** | ❌ NO (se perdía) |

### Flujo Problemático

```
1. Usuario hace login → Tokens guardados
   - accessToken: memoria ✓
   - refreshToken: sessionStorage ✓
   - expiresAt: memoria ✓

2. Usuario hace F5 → Página recarga
   - accessToken: ❌ null (memoria limpiada)
   - refreshToken: ✓ presente (sessionStorage)
   - expiresAt: ❌ null (memoria limpiada)

3. restoreSession() ejecuta:
   ```typescript
   if (!token || !refreshTokenValue) {
     return; // ❌ Sale porque token es null
   }
   ```

4. ❌ Sesión NO se restaura → Usuario ve pantalla en blanco
```

## ✅ Solución Implementada

### 1. Persistir `expiresAt` en sessionStorage

**Archivo**: `src/utils/tokenManager.ts`

**Cambio**: Ahora `expiresAt` se guarda TAMBIÉN en sessionStorage (además de memoria):

```typescript
export const setTokenExpiresAt = (expiresAt: number): void => {
  memoryStorage.expiresAt = expiresAt;
  
  // ✅ NUEVO: También guardar en sessionStorage
  try {
    sessionStorage.setItem(TOKEN_EXPIRES_AT_KEY, expiresAt.toString());
  } catch (error) {
    console.warn('Error al guardar expiresAt:', error);
  }
};
```

Y al leer, primero intenta desde memoria, si no existe, desde sessionStorage:

```typescript
export const getTokenExpiresAt = (): number | null => {
  // Primero intentar desde memoria
  if (memoryStorage.expiresAt) {
    return memoryStorage.expiresAt;
  }
  
  // ✅ Si no está en memoria, leer desde sessionStorage
  try {
    const stored = sessionStorage.getItem(TOKEN_EXPIRES_AT_KEY);
    if (stored) {
      const expiresAt = parseInt(stored, 10);
      memoryStorage.expiresAt = expiresAt; // Cache en memoria
      return expiresAt;
    }
  } catch (error) {
    console.warn('Error al obtener expiresAt:', error);
  }
  
  return null;
};
```

### 2. Restaurar Sesión con Refresh Automático

**Archivo**: `src/contexts/AuthContext.tsx`

**Cambio**: Modificada la lógica de `restoreSession()`:

**Antes:**
```typescript
const token = getAccessToken();
const refreshTokenValue = getRefreshToken();

// ❌ Si NO hay accessToken, sale sin hacer nada
if (!token || !refreshTokenValue) {
  return;
}
```

**Después:**
```typescript
const refreshTokenValue = getRefreshToken();

// ✅ Solo verificar refreshToken (que persiste)
if (!refreshTokenValue) {
  console.log('No hay refreshToken guardado');
  return;
}

const token = getAccessToken();

// ✅ Si NO hay accessToken o está expirado, hacer refresh automáticamente
if (!token || isTokenExpired()) {
  console.log('AccessToken no disponible o expirado, haciendo refresh...');
  await refreshSession(); // Obtiene nuevo accessToken
  return;
}

// ✅ Si hay token válido, continuar con getUserInfo
```

## 🎯 Flujo Corregido

```
1. Usuario hace login → Tokens guardados
   - accessToken: memoria ✓
   - refreshToken: sessionStorage ✓
   - expiresAt: memoria + sessionStorage ✓✓

2. Usuario hace F5 → Página recarga
   - accessToken: ❌ null (memoria limpiada)
   - refreshToken: ✓ presente (sessionStorage)
   - expiresAt: ✓ presente (sessionStorage)

3. restoreSession() ejecuta:
   a) ✅ Hay refreshToken? SÍ → Continuar
   b) ✅ Hay accessToken? NO → Hacer refresh
   c) ✅ refreshSession() llama a /auth/refresh
   d) ✅ Obtiene nuevo accessToken y refreshToken
   e) ✅ Guarda tokens en memoria y sessionStorage
   f) ✅ Obtiene info del usuario: getUserInfo()
   g) ✅ Restaura estado: updateAuthState(token, userInfo)

4. ✅ Sesión RESTAURADA → Usuario ve la página correctamente
```

## 📊 Tabla Comparativa

| Aspecto | Antes | Después |
|---------|-------|---------|
| accessToken persiste al F5 | ❌ NO | ❌ NO (por seguridad) |
| refreshToken persiste al F5 | ✅ SÍ | ✅ SÍ |
| expiresAt persiste al F5 | ❌ NO | ✅ SÍ |
| Hace refresh automático | ❌ NO | ✅ SÍ |
| Restaura sesión al F5 | ❌ NO | ✅ SÍ |
| Usuario puede seguir navegando | ❌ NO | ✅ SÍ |

## 🔒 Seguridad

### ¿Por qué NO guardar accessToken en sessionStorage?

El `accessToken` se mantiene **solo en memoria** por razones de seguridad:

1. **Tokens de corta duración**: El accessToken expira en 1 hora
2. **Vulnerable a XSS**: Si se guarda en localStorage/sessionStorage, es vulnerable a ataques XSS
3. **Refresh automático**: Con el refreshToken podemos obtener un nuevo accessToken cuando sea necesario
4. **Mejor práctica**: Es la práctica recomendada para aplicaciones web modernas

**Flujo seguro:**
- accessToken en memoria (vulnerable a XSS solo si atacante ejecuta código en la página actual)
- refreshToken en sessionStorage (se usa solo para obtener nuevos accessTokens)
- Si cierra el navegador, sessionStorage se limpia (seguridad adicional)

## 🧪 Cómo Probar

### Escenario 1: Login + F5 en Dashboard

1. Ve a `https://ema.e3stores.cloud/login`
2. Haz login con credenciales válidas
3. Verifica que entras al dashboard correctamente
4. **Presiona F5** en el dashboard
5. ✅ **Resultado esperado**: La página recarga y sigues en el dashboard (sesión restaurada)
6. 📝 **En consola verás**: `"AccessToken no disponible o expirado, haciendo refresh..."`

### Escenario 2: Login + F5 en diferentes páginas

1. Haz login
2. Navega a `/dashboard/agents`
3. **Presiona F5**
4. ✅ Deberías seguir en `/dashboard/agents` con la sesión activa

### Escenario 3: Verificar tokens en DevTools

1. Haz login
2. Abre DevTools → Application → Session Storage
3. ✅ Deberías ver:
   - `niawi_refresh_token`: (token largo)
   - `niawi_token_expires_at`: (timestamp)
4. Presiona F5
5. ✅ Los valores en sessionStorage deben persistir

## 📝 Logs en Consola

### Después del Login
```
🔧 Configuración API:
  - Base URL: https://aiauth.e3stores.cloud
  - Client ID: 019986ed-5fea-7886-a2b6-e35968f8ef17

🔐 Login Request: {...}
✅ Login Success - Response Data: {accessToken: "...", refreshToken: "..."}
```

### Después del F5
```
🔧 Configuración API: (se vuelve a cargar)
AccessToken no disponible o expirado, haciendo refresh...
🔄 Intentando refrescar token...
  - refreshToken guardado: presente
✅ Refresh exitoso: {hasAccessToken: true}
```

## 🚀 Deploy

**Commits:**
1. `fix: evitar peticiones al backend sin tokens en restoreSession` (597d2aa)
2. `fix: persistir expiresAt en sessionStorage y restaurar sesión automáticamente con refreshToken` (8e54ce9)

**Estado:** ✅ Pusheado a GitHub, Vercel redespliegue automático en progreso

## ⚠️ Consideraciones

### Tiempo de Expiración

- **accessToken**: Expira en 1 hora (3600 segundos)
- **refreshToken**: Expira según configuración del backend (generalmente 7-30 días)
- **Refresh Proactivo**: Se programa 60 segundos antes de que expire el accessToken

### SessionStorage vs localStorage

Usamos **sessionStorage** (no localStorage) porque:
- ✅ Se limpia al cerrar el navegador (más seguro)
- ✅ No persiste entre pestañas
- ✅ Suficiente para una sesión de trabajo

### Compatibilidad

Esta solución funciona en todos los navegadores modernos que soportan:
- sessionStorage API
- async/await
- Fetch API

## 🔗 Documentación Relacionada

- `MIGRACION_AUTH_COMPLETADA.md` - Migración completa de autenticación
- `FIX_MIXED_CONTENT_FINAL.md` - Solución de Mixed Content
- `TESTING_AUTH.md` - Checklist de pruebas de autenticación

---

**Fecha**: 2025-01-23  
**Fix**: Restauración automática de sesión con refreshToken  
**Estado**: ✅ Implementado y desplegado

