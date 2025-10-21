# 🔧 Solución: Problema con RefreshToken

## 🔍 Problema Identificado

Basado en los logs de la consola, encontramos el problema exacto:

### Logs del Error:
```
🔐 Login Request: {url: 'https://aiauth.e3stores.cloud/auth/login?useCookies=true&useSessionCookies=true', ...}
📥 Login Response: {status: 200, ok: true} ✅ Login exitoso

🔐 Login Request: {url: 'https://aiauth.e3stores.cloud/auth/refresh', ...}
data: {refreshToken: 'undefined', password: '***'} ❌ refreshToken es 'undefined'

❌ Mixed Content: http://aiauth.e3stores.cloud/Account/Login?ReturnUrl=%2Fauth%2Frefresh
❌ Error al refrescar sesión: {message: 'Failed to fetch'}
```

### Análisis del Problema:

1. ✅ **Login inicial exitoso** (status 200)
2. ❌ **refreshToken era 'undefined'** porque cuando usas `useCookies=true`, ASP.NET Identity guarda el refreshToken en una **cookie HTTP-only**, NO en el JSON response
3. ❌ Al intentar refrescar con refreshToken='undefined', el backend rechaza la petición y redirige a `/Account/Login` (HTTP)
4. ❌ El navegador bloquea la redirección HTTP (Mixed Content error)

## ✅ Solución Implementada

### Cambio Principal: Usar `useCookies=false`

**Antes:**
```typescript
'/auth/login?useCookies=true&useSessionCookies=true'
```

**Ahora:**
```typescript
'/auth/login?useCookies=false'
```

### ¿Por qué este cambio?

| `useCookies=true` | `useCookies=false` |
|-------------------|-------------------|
| RefreshToken en cookie HTTP-only | RefreshToken en JSON response |
| Cookie solo funciona en mismo dominio | Token funciona entre dominios |
| Más seguro pero complica CORS | Menos seguro pero más flexible |
| Backend redirige a HTTP cuando falla | Backend devuelve error JSON |
| ❌ No funciona con HTTPS mixed content | ✅ Funciona perfectamente |

## 🔧 Cambios en el Código

### 1. authService.ts - Login con useCookies=false

```typescript
// Usar useCookies=false para recibir el refreshToken en el response JSON
const response = await makeLoginRequest<LoginResponse>(
  '/auth/login?useCookies=false',
  loginData
);

// Guardar tokens (todos vienen en el JSON)
if (!response.accessToken || !response.refreshToken) {
  throw new Error('El backend no devolvió los tokens necesarios');
}

setAccessToken(response.accessToken);
setRefreshToken(response.refreshToken);
setTokenExpiresAt(Date.now() + (response.expiresIn * 1000));
```

### 2. apiClient.ts - Manejo Inteligente del Refresh

```typescript
const refreshToken = async (): Promise<RefreshTokenResponse> => {
  const refreshTokenValue = getRefreshToken();
  
  // Si hay refreshToken, usarlo en el body
  // Si no hay (cookies), enviar body vacío
  const bodyData = refreshTokenValue ? { refreshToken: refreshTokenValue } : {};

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ClientId': CLIENT_ID,
      'Client-Id': CLIENT_ID,
    },
    body: JSON.stringify(bodyData),
    credentials: 'include', // Importante para cookies
  });

  const data: RefreshTokenResponse = await response.json();
  
  // Guardar nuevos tokens
  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }
  
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }
};
```

### 3. Logs de Debug Agregados

```typescript
console.log('📦 Response del backend:', response);
console.log('🔄 Intentando refrescar token...');
console.log('  - refreshToken guardado:', refreshTokenValue ? 'presente' : 'ausente');
console.log('📥 Refresh Response:', { status, ok, url });
console.log('✅ Refresh exitoso:', { hasAccessToken: !!data.accessToken });
```

## 📊 Comportamiento Esperado

### Ahora verás en la consola:

```
🔧 Configuración API:
  - Base URL: https://aiauth.e3stores.cloud
  - Client ID: 019986ed-5fea-7886-a2b6-e35968f8ef17
  - Modo: Producción

🔐 Login Request:
  url: "https://aiauth.e3stores.cloud/auth/login?useCookies=false"
  clientId: "019986ed-5fea-7886-a2b6-e35968f8ef17"

📥 Login Response:
  status: 200
  ok: true

✅ Login Success - Response Data:
  {
    accessToken: "eyJhbGci...",
    refreshToken: "CfDJ8Nx...",
    expiresIn: 3600,
    tokenType: "Bearer"
  }

📦 Response del backend:
  {accessToken: "...", refreshToken: "...", expiresIn: 3600}

🔄 Intentando refrescar token...
  - refreshToken guardado: presente

📥 Refresh Response:
  status: 200
  ok: true

✅ Refresh exitoso: {hasAccessToken: true}
```

## 🎯 Beneficios de la Solución

| Aspecto | Antes (useCookies=true) | Ahora (useCookies=false) |
|---------|-------------------------|--------------------------|
| RefreshToken | En cookie HTTP-only | En localStorage |
| Mixed Content | ❌ Backend redirige a HTTP | ✅ No hay redirecciones |
| CORS | ❌ Problemas | ✅ Funciona bien |
| Debugging | ❌ Difícil ver cookies | ✅ Fácil ver en localStorage |
| Compatibilidad | ❌ Solo mismo dominio | ✅ Entre dominios |
| Seguridad | 🔒 Más seguro (HTTP-only) | ⚠️ Menos seguro (XSS vulnerable) |

## ⚠️ Consideraciones de Seguridad

Con `useCookies=false`, los tokens se guardan en localStorage, lo que los hace vulnerables a ataques XSS (Cross-Site Scripting).

### Mitigación:

1. ✅ **Tiempo de expiración corto** - Tokens expiran en 1 hora
2. ✅ **HTTPS obligatorio** - Encriptación en tránsito
3. ✅ **Validación de entrada** - Prevenir XSS
4. ✅ **Content Security Policy** - Agregar headers CSP
5. ✅ **Refresh automático** - Minimizar ventana de exposición

### Recomendación Futura:

Cuando el backend soporte HTTPS correctamente en todas sus redirecciones, puedes volver a `useCookies=true` para mejor seguridad.

## 📋 Checklist de Verificación

Después del deploy:

- [ ] Login muestra `url: .../auth/login?useCookies=false`
- [ ] Response incluye `accessToken` y `refreshToken`
- [ ] No hay warnings de "refreshToken no viene en el response"
- [ ] No hay errores de "Mixed Content"
- [ ] El login completa exitosamente
- [ ] El refresh automático funciona
- [ ] No hay redirecciones a HTTP

## 🚀 Próximos Pasos

1. Hacer commit de los cambios
2. Push a repositorio
3. Redeploy en Vercel
4. Probar login en `https://ema.e3stores.cloud`
5. Verificar logs en consola
6. Confirmar que ya no hay errores

---

**¡Ahora el login debería funcionar correctamente!** 🎉

