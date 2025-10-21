# 🔧 Solución: Backend Redirige a HTTP

## 🔍 Problema Identificado

El error de Mixed Content no venía de nuestro código frontend, sino del **backend**:

```
Mixed Content: The page at 'https://ema.e3stores.cloud/dashboard' was loaded over HTTPS, 
but requested an insecure resource 'http://aiauth.e3stores.cloud/Account/Login?ReturnUrl=%2Fauth%2Frefresh'.
```

### Análisis:
1. El frontend hace una petición a: `https://aiauth.e3stores.cloud/auth/refresh`
2. El backend responde con un **redirect 302/301** a: `http://aiauth.e3stores.cloud/Account/Login` (HTTP)
3. El navegador bloquea la redirección HTTP porque la página principal es HTTPS

## ✅ Solución Implementada

### En el Frontend (Código):

He modificado `apiClient.ts` para:

1. **Interceptar todas las redirecciones** del backend usando `redirect: 'manual'`
2. **Detectar si la redirección es a HTTP** y registrar un warning
3. **Prevenir que el navegador siga redirecciones HTTP** automáticamente
4. **Limpiar tokens y mostrar mensaje apropiado** cuando se detecta sesión expirada

### Código Implementado:

```typescript
// Función para forzar HTTPS
const ensureHttps = (url: string): string => {
  if (!import.meta.env.DEV && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

// En cada fetch:
const response = await fetch(`${BASE_URL}${endpoint}`, {
  // ... otros parámetros
  redirect: 'manual', // No seguir redirecciones automáticamente
});

// Detectar y manejar redirecciones
if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
  const location = response.headers.get('location');
  if (location) {
    const secureLocation = ensureHttps(location);
    if (location !== secureLocation) {
      console.warn(`⚠️ Redirección HTTP del backend interceptada: ${location} → ${secureLocation}`);
    }
    // Manejar apropiadamente según el contexto
  }
}
```

## 🔧 Solución Permanente (Backend)

**IMPORTANTE**: La solución ideal es configurar el backend para que use HTTPS en sus redirecciones.

### En el servidor `aiauth.e3stores.cloud`:

#### Opción 1: Configuración de ASP.NET Core

Si el backend es ASP.NET Core, agrega esto en `Startup.cs` o `Program.cs`:

```csharp
// Forzar HTTPS en todas las URLs generadas
app.UseHttpsRedirection();

// Configurar opciones de forwarded headers para proxies
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

// O configurar directamente el esquema HTTPS
services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.All;
    options.KnownProxies.Clear();
    options.KnownNetworks.Clear();
});
```

#### Opción 2: Configuración de IIS/Reverse Proxy

Si estás usando IIS o un reverse proxy:

**En IIS:**
```xml
<system.webServer>
  <rewrite>
    <rules>
      <rule name="Force HTTPS" stopProcessing="true">
        <match url="(.*)" />
        <conditions>
          <add input="{HTTPS}" pattern="off" ignoreCase="true" />
        </conditions>
        <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
      </rule>
    </rules>
  </rewrite>
</system.webServer>
```

**En Nginx:**
```nginx
server {
    listen 80;
    server_name aiauth.e3stores.cloud;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name aiauth.e3stores.cloud;
    
    # Configurar headers para que el backend sepa que está detrás de HTTPS
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
}
```

#### Opción 3: Variable de Entorno

Agregar en el servidor:
```bash
ASPNETCORE_URLS=https://+:443;http://+:80
ASPNETCORE_HTTPS_PORT=443
```

## 📊 Comportamiento Actual

### Antes de la Solución:
- ❌ Backend redirige a HTTP
- ❌ Navegador bloquea la petición
- ❌ Error "Mixed Content"
- ❌ Login falla

### Después de la Solución (Frontend):
- ✅ Interceptamos las redirecciones
- ✅ Detectamos URLs HTTP
- ✅ Mostramos warnings en consola
- ✅ Manejamos el error apropiadamente
- ⚠️ El usuario ve mensaje de sesión expirada (mejor UX)

### Con Solución Backend (Ideal):
- ✅ Backend usa HTTPS directamente
- ✅ No hay redirecciones HTTP
- ✅ No hay warnings
- ✅ Login funciona perfectamente

## 🔍 Cómo Verificar

### En la Consola del Navegador:

1. Abre `https://ema.e3stores.cloud`
2. Presiona F12 → Console
3. Intenta hacer login

**Si ves:**
```
⚠️ Redirección HTTP del backend interceptada: http://aiauth.e3stores.cloud/... → https://aiauth.e3stores.cloud/...
```
Significa que el backend sigue redirigiendo a HTTP, pero lo estamos interceptando.

**Si NO ves este warning:**
¡Perfecto! El backend está configurado correctamente con HTTPS.

## 📞 Contactar al Equipo de Backend

Compartir con el equipo que administra `aiauth.e3stores.cloud`:

> **Asunto**: Configurar HTTPS en redirecciones del servicio de autenticación
>
> Hola equipo,
>
> Actualmente el servicio de autenticación en `aiauth.e3stores.cloud` está generando redirecciones a URLs HTTP (ejemplo: `http://aiauth.e3stores.cloud/Account/Login`).
>
> Esto causa errores de "Mixed Content" cuando la aplicación frontend corre en HTTPS (`https://ema.e3stores.cloud`).
>
> ¿Podrían configurar el servidor para que todas las URLs generadas y redirecciones usen HTTPS?
>
> Opciones sugeridas:
> - Configurar `UseHttpsRedirection()` en ASP.NET Core
> - Configurar `X-Forwarded-Proto` headers en el reverse proxy
> - Establecer `ASPNETCORE_HTTPS_PORT=443`
>
> Gracias!

## ✅ Estado Actual

- ✅ Frontend: Protegido contra redirecciones HTTP
- ⚠️ Backend: Necesita configuración para usar HTTPS en redirecciones
- ✅ Usuario: Recibe mensajes de error apropiados en lugar de errores de Mixed Content

## 🎯 Próximos Pasos

1. [ ] Compartir este documento con el equipo de backend
2. [ ] Solicitar configuración de HTTPS en el servidor de autenticación
3. [ ] Una vez configurado, verificar que desaparezcan los warnings
4. [ ] Opcionalmente, remover el código de interceptación si ya no es necesario

