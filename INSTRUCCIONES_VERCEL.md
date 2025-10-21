# 🚀 Instrucciones para Configurar Variables de Entorno en Vercel

## 🎯 Objetivo
Configurar correctamente las variables de entorno en Vercel para que la aplicación en `https://ema.e3stores.cloud` use HTTPS y evite errores de "Mixed Content".

---

## 📝 Pasos a Seguir

### 1️⃣ Acceder a Vercel Dashboard

1. Ve a: https://vercel.com/dashboard
2. Inicia sesión si es necesario
3. Busca y selecciona tu proyecto (el que está desplegado en `ema.e3stores.cloud`)

### 2️⃣ Ir a Configuración de Variables de Entorno

1. En el menú lateral, haz clic en **Settings** (Configuración)
2. En el menú de Settings, haz clic en **Environment Variables** (Variables de Entorno)

### 3️⃣ Agregar/Actualizar Variables

Necesitas configurar las siguientes variables. Para cada una:

1. Haz clic en **"Add New"** o edita la existente
2. Ingresa el **Name** (nombre) exactamente como se muestra
3. Ingresa el **Value** (valor) exactamente como se muestra
4. Selecciona los **Environments**: ✅ Production, ✅ Preview, ✅ Development
5. Haz clic en **Save**

#### Variables Requeridas:

| Name (Nombre) | Value (Valor) |
|---------------|---------------|
| `VITE_AUTH_BASE_URL` | `https://aiauth.e3stores.cloud` |
| `VITE_AUTH_CLIENT_ID` | `019986ed-5fea-7886-a2b6-e35968f8ef17` |
| `VITE_CHAT_API_URL` | `https://automation.wtsusa.us/webhook/153ed783-a4e4-49be-8e89-16ae2d01ec1c` |
| `VITE_RECOMMENDATIONS_API_URL` | `https://automation.wtsusa.us/webhook/2a2f2d36-9a66-4ca0-9f80-a8db6fea206b` |

#### ⚠️ MUY IMPORTANTE:

**`VITE_AUTH_BASE_URL` DEBE usar `https://` (NO `http://`)**

- ✅ Correcto: `https://aiauth.e3stores.cloud`
- ❌ Incorrecto: `http://aiauth.e3stores.cloud`

### 4️⃣ Hacer Redeploy

**CRÍTICO**: Las variables de entorno solo se aplican después de hacer redeploy.

1. Ve a la pestaña **Deployments** (Despliegues)
2. Busca el deployment más reciente
3. Haz clic en los **tres puntos (•••)** a la derecha
4. Selecciona **"Redeploy"**
5. En el modal, haz clic en **"Redeploy"** de nuevo para confirmar
6. Espera a que termine el deployment (generalmente 1-2 minutos)

### 5️⃣ Verificar

1. Espera a que el deployment esté completo (verás un ✓ verde)
2. Abre tu sitio: `https://ema.e3stores.cloud`
3. Abre la consola del navegador (presiona F12)
4. Verifica que NO aparezcan errores de "Mixed Content"

---

## 🔍 Cómo Verificar que Funcionó

### En la Consola del Navegador (F12):

✅ **Si todo está bien:**
- No hay errores de "Mixed Content"
- No aparece el warning "⚠️ Convirtiendo HTTP a HTTPS"
- Las peticiones se hacen a URLs HTTPS

❌ **Si todavía hay problemas:**
- Ves errores de "Mixed Content"
- Ves el warning "⚠️ Convirtiendo HTTP a HTTPS" (significa que la variable aún está en HTTP pero el código la está corrigiendo)

### Verificación Visual en Vercel:

1. Ve a **Settings** → **Environment Variables**
2. Verifica que `VITE_AUTH_BASE_URL` tenga el valor: `https://aiauth.e3stores.cloud`
3. Verifica que esté marcado para **Production**

---

## 🛠️ Herramienta de Diagnóstico (Opcional)

Si necesitas verificar qué variables están llegando a la aplicación, puedes usar el componente de diagnóstico:

### En desarrollo local:

1. Abre el archivo `src/pages/Login.tsx`
2. Agrega al inicio (después de los otros imports):
   ```typescript
   import EnvDiagnostic from '@/components/EnvDiagnostic';
   ```
3. Agrega en el JSX (antes del return principal):
   ```tsx
   {!import.meta.env.PROD && <EnvDiagnostic />}
   ```
4. Guarda y verás un panel flotante con todas las variables de entorno

---

## ❓ Preguntas Frecuentes

### ¿Por qué necesito hacer redeploy?

Las variables de entorno se inyectan durante el build. Cambiarlas en Vercel no actualiza deployments existentes.

### ¿Puedo usar HTTP en desarrollo?

Sí, el código automáticamente usa rutas relativas (`/api`) en desarrollo para permitir el proxy de Vite.

### ¿Qué pasa si olvido el prefijo VITE_?

Las variables sin `VITE_` no estarán disponibles en el código frontend. Vite solo expone variables con ese prefijo.

### ¿Cuánto tarda el redeploy?

Generalmente entre 1-3 minutos, dependiendo del tamaño del proyecto.

---

## 📞 Soporte

Si después de seguir estos pasos el problema persiste:

1. Verifica los **Runtime Logs** en Vercel Dashboard
2. Verifica la **consola del navegador** para mensajes de error específicos
3. Intenta limpiar el caché del navegador (Ctrl + Shift + Delete)
4. Haz un "Hard Refresh" (Ctrl + Shift + R)

---

## ✅ Checklist Final

- [ ] He accedido a Vercel Dashboard
- [ ] He navegado a Settings → Environment Variables
- [ ] He configurado `VITE_AUTH_BASE_URL` con `https://` (no `http://`)
- [ ] He configurado todas las demás variables requeridas
- [ ] He seleccionado Production, Preview y Development para cada variable
- [ ] He hecho clic en "Save" para cada variable
- [ ] He hecho "Redeploy" desde la pestaña Deployments
- [ ] He esperado a que el deployment termine completamente
- [ ] He verificado que no hay errores en la consola del navegador
- [ ] La aplicación funciona correctamente en `https://ema.e3stores.cloud`

---

**¡Listo! Tu aplicación ahora debería funcionar correctamente con HTTPS. 🎉**
