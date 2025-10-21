# 🔍 Debugging de Autenticación

## 📊 Logs de Diagnóstico Implementados

He agregado logs detallados en el proceso de autenticación para ayudarte a identificar el problema.

### Cómo Ver los Logs:

1. Abre tu aplicación en `https://ema.e3stores.cloud`
2. Presiona **F12** para abrir las Developer Tools
3. Ve a la pestaña **Console**
4. Intenta hacer login

### Logs que Deberías Ver:

#### 1. Al Cargar la Página:
```
🔧 Configuración API:
  - Base URL: https://aiauth.e3stores.cloud
  - Client ID: 019986ed-5fea-7886-a2b6-e35968f8ef17
  - Modo: Producción
```

**Verifica:**
- ✅ Base URL debe ser `https://aiauth.e3stores.cloud` (con HTTPS)
- ✅ Client ID debe ser `019986ed-5fea-7886-a2b6-e35968f8ef17`
- ✅ Modo debe ser `Producción` en Vercel

#### 2. Al Hacer Login:
```
🔐 Login Request:
  url: "https://aiauth.e3stores.cloud/auth/login?useCookies=true&useSessionCookies=true"
  clientId: "019986ed-5fea-7886-a2b6-e35968f8ef17"
  data: {email: "tu@email.com", password: "***"}
```

**Verifica:**
- ✅ URL debe incluir `/auth/login?useCookies=true&useSessionCookies=true`
- ✅ Client ID correcto
- ✅ Email está siendo enviado

#### 3. Respuesta del Servidor:
```
📥 Login Response:
  status: 200
  statusText: "OK"
  ok: true
  url: "https://aiauth.e3stores.cloud/auth/login?useCookies=true&useSessionCookies=true"
  type: "basic"
```

**Casos:**

**✅ Login Exitoso (status 200):**
```
status: 200
ok: true
```

**❌ Credenciales Inválidas (status 401):**
```
status: 401
ok: false
❌ Login failed: 401 Unauthorized
```

**⚠️ Redirección (status 302/301):**
```
status: 302
url: "http://aiauth.e3stores.cloud/Account/Login..."  ← Si empieza con http://
⚠️ El backend redirigió a HTTP: http://...
```

---

## 🔍 Posibles Problemas y Soluciones

### Problema 1: Base URL Incorrecta

**Síntoma:**
```
Base URL: http://aiauth.e3stores.cloud
```

**Solución:**
1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Verifica que `VITE_AUTH_BASE_URL` = `https://aiauth.e3stores.cloud`
3. Redeploy el proyecto

---

### Problema 2: Client ID Incorrecto

**Síntoma:**
```
Client ID: undefined
```
o
```
status: 401
```

**Solución:**
1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Agrega/verifica `VITE_AUTH_CLIENT_ID` = `019986ed-5fea-7886-a2b6-e35968f8ef17`
3. Redeploy el proyecto

---

### Problema 3: Backend Redirige a HTTP

**Síntoma:**
```
⚠️ El backend redirigió a HTTP: http://aiauth.e3stores.cloud/Account/Login
```

**Causa:**
El backend no está configurado correctamente y está generando URLs HTTP en sus redirecciones.

**Soluciones:**

#### Opción A: Contactar al Backend
Enviar este mensaje al equipo que administra `aiauth.e3stores.cloud`:

> El servicio está redirigiendo a URLs HTTP en lugar de HTTPS. Por favor configuren:
> - `UseHttpsRedirection()` en ASP.NET Core
> - Headers `X-Forwarded-Proto` en el proxy/load balancer

#### Opción B: Verificar con Postman
Si funciona en Postman pero no en la web:
1. Compara los headers enviados en Postman vs navegador
2. Verifica si Postman está enviando algún header adicional
3. Asegúrate de que Postman use HTTPS (no HTTP)

---

### Problema 4: CORS o Headers Faltantes

**Síntoma:**
```
Access to fetch has been blocked by CORS policy
```

**Solución:**
El backend necesita incluir estos headers en sus respuestas:
```
Access-Control-Allow-Origin: https://ema.e3stores.cloud
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: ClientId, Client-Id, Authorization, Content-Type
```

---

### Problema 5: Cookies No Se Guardan

**Síntoma:**
Login parece exitoso (status 200) pero luego falla al refrescar.

**Solución:**
Verificar que el backend envíe cookies con estos atributos:
```
Set-Cookie: .AspNetCore.Identity.Application=...; 
    SameSite=None; 
    Secure; 
    Path=/; 
    Domain=.e3stores.cloud
```

---

## 🧪 Pruebas con Postman

### Configuración Correcta en Postman:

1. **URL:** `https://aiauth.e3stores.cloud/auth/login?useCookies=true&useSessionCookies=true`
2. **Método:** POST
3. **Headers:**
   ```
   Content-Type: application/json
   ClientId: 019986ed-5fea-7886-a2b6-e35968f8ef17
   Client-Id: 019986ed-5fea-7886-a2b6-e35968f8ef17
   ```
4. **Body (JSON):**
   ```json
   {
     "email": "tu@email.com",
     "password": "tucontraseña"
   }
   ```

### Comparar con el Navegador:

Copia exactamente los headers que estás viendo en los logs del navegador:
```
🔐 Login Request:
  url: "..."
  clientId: "..."
```

Y compáralos con los de Postman.

---

## 📋 Checklist de Verificación

- [ ] `Base URL` en logs muestra `https://aiauth.e3stores.cloud`
- [ ] `Client ID` en logs muestra `019986ed-5fea-7886-a2b6-e35968f8ef17`
- [ ] No hay warnings de "redirigió a HTTP"
- [ ] Login Request URL incluye `?useCookies=true&useSessionCookies=true`
- [ ] Response status es 200 (no 401, 302, etc.)
- [ ] No hay errores de CORS en la consola
- [ ] Variables de entorno configuradas en Vercel
- [ ] Redeploy realizado después de cambiar variables

---

## 🆘 Información para Compartir

Si necesitas ayuda adicional, comparte esta información:

1. **Screenshot de los logs en consola** (especialmente los 3 logs principales)
2. **Variables de entorno en Vercel** (screenshot de Environment Variables)
3. **Request/Response de Postman** (si funciona allí)
4. **¿En qué paso falla?**
   - ¿Al hacer login?
   - ¿Al refrescar sesión?
   - ¿Al obtener info de usuario?

---

## 🎯 Próximo Paso

Después de desplegar estos cambios:

1. Abre la consola
2. Copia **todos los logs** que aparecen
3. Compártelos para poder ayudarte a identificar exactamente dónde está el problema

