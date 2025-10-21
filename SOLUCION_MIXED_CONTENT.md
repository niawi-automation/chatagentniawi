# 🔒 Solución al Error Mixed Content

## ❌ Error Actual
```
Mixed Content: The page at 'https://ema.e3stores.cloud/login' was loaded over HTTPS, 
but requested an insecure resource 'http://aiauth.e3stores.cloud/Account/Login?ReturnUrl=%2Fmanage%2Finfo'. 
This request has been blocked; the content must be served over HTTPS.
```

## 🔍 Causa del Problema
El error ocurre porque la variable de entorno `VITE_AUTH_BASE_URL` en Vercel está configurada con **HTTP** en lugar de **HTTPS**.

## ✅ Solución - Actualizar Variables de Entorno en Vercel

### Paso 1: Acceder a Vercel Dashboard
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona el proyecto **ema** (o como se llame tu proyecto)
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Verificar/Actualizar Variables
Busca la variable `VITE_AUTH_BASE_URL` y asegúrate que tenga el valor correcto:

#### ❌ Valor Incorrecto (causando el error):
```
VITE_AUTH_BASE_URL = http://aiauth.e3stores.cloud
```

#### ✅ Valor Correcto:
```
VITE_AUTH_BASE_URL = https://aiauth.e3stores.cloud
```

### Paso 3: Configurar TODAS las Variables de Entorno

Asegúrate de tener configuradas estas variables en Vercel:

| Variable | Valor Correcto |
|----------|----------------|
| `VITE_AUTH_BASE_URL` | `https://aiauth.e3stores.cloud` |
| `VITE_AUTH_CLIENT_ID` | `019986ed-5fea-7886-a2b6-e35968f8ef17` |
| `VITE_CHAT_API_URL` | `https://automation.wtsusa.us/webhook/153ed783-a4e4-49be-8e89-16ae2d01ec1c` |
| `VITE_RECOMMENDATIONS_API_URL` | `https://automation.wtsusa.us/webhook/2a2f2d36-9a66-4ca0-9f80-a8db6fea206b` |

### Paso 4: Aplicar para Todos los Entornos
Al configurar cada variable, asegúrate de marcar:
- ✅ Production
- ✅ Preview
- ✅ Development

### Paso 5: Redeploy
**IMPORTANTE**: Después de actualizar las variables de entorno, debes hacer **Redeploy**:
1. Ve a la pestaña **Deployments**
2. Encuentra el último deployment
3. Haz click en los tres puntos (•••)
4. Selecciona **Redeploy**

## 🛡️ Protección en el Código

El código ahora incluye una función de protección que automáticamente convierte HTTP a HTTPS:

```typescript
const getBaseUrl = () => {
  const url = import.meta.env.VITE_AUTH_BASE_URL || 
    (import.meta.env.DEV ? '/api' : 'https://aiauth.e3stores.cloud');
  
  // Si no es desarrollo y la URL comienza con http://, forzar https://
  if (!import.meta.env.DEV && url.startsWith('http://')) {
    console.warn(`⚠️ Convirtiendo HTTP a HTTPS: ${url} → ${url.replace('http://', 'https://')}`);
    return url.replace('http://', 'https://');
  }
  
  return url;
};
```

## 🔍 Verificar la Solución

Después del redeploy, abre la consola del navegador (F12) en `https://ema.e3stores.cloud` y verifica:

1. **Si ves el warning** `⚠️ Convirtiendo HTTP a HTTPS`:
   - Significa que la variable de entorno sigue en HTTP
   - Pero el código la está corrigiendo automáticamente
   - **Recomendación**: Actualiza la variable en Vercel a HTTPS

2. **Si NO ves el warning**:
   - ✅ La configuración está correcta
   - Las peticiones se están haciendo directamente a HTTPS

## 📋 Checklist de Verificación

- [ ] Variable `VITE_AUTH_BASE_URL` configurada en Vercel con `https://`
- [ ] Variable aplicada a Production, Preview y Development
- [ ] Redeploy realizado después de actualizar variables
- [ ] No aparecen errores de "Mixed Content" en la consola
- [ ] La aplicación funciona correctamente

## 🆘 Si el Problema Persiste

Si después de seguir estos pasos el error persiste:

1. Verifica en la consola del navegador qué URL se está usando
2. Limpia la caché del navegador (Ctrl + Shift + Delete)
3. Haz un "Hard Refresh" (Ctrl + Shift + R)
4. Verifica que el deployment más reciente esté activo en Vercel

## 📞 Contacto

Si necesitas ayuda adicional:
- Email: soporte@niawi.tech
- Revisa los logs en Vercel Dashboard → Runtime Logs

