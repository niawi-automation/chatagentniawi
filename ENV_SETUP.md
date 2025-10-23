# Configuración de Variables de Entorno

## Variables Requeridas

Para que la aplicación funcione correctamente con el backend de autenticación, debes configurar las siguientes variables de entorno.

### Cómo Configurar

Crea un archivo `.env` o `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Backend de Autenticación (IMPORTANTE: Debe usar HTTPS en producción)
VITE_AUTH_BASE_URL=https://aiauth.e3stores.cloud

# Client ID para autenticación multi-cliente
VITE_AUTH_CLIENT_ID=019986ed-5fea-7886-a2b6-e35968f8ef17

# APIs de Webhooks para Automatizaciones
VITE_CHAT_API_URL=https://automation.wtsusa.us/webhook/153ed783-a4e4-49be-8e89-16ae2d01ec1c
VITE_RECOMMENDATIONS_API_URL=https://automation.wtsusa.us/webhook/2a2f2d36-9a66-4ca0-9f80-a8db6fea206b
```

### Notas Importantes

1. **VITE_AUTH_BASE_URL**: DEBE usar `https://` en producción. El backend está en `https://aiauth.e3stores.cloud`

2. **VITE_AUTH_CLIENT_ID**: Es el identificador único del cliente para autenticación multi-tenant. Valor: `019986ed-5fea-7886-a2b6-e35968f8ef17`

3. **Variables de Webhooks**: URLs de n8n para las automatizaciones de chat y recomendaciones

### Verificar Configuración

Después de crear el archivo `.env` o `.env.local`:

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre la consola del navegador (F12) y busca el mensaje:
   ```
   🔧 Configuración API:
     - Base URL: https://aiauth.e3stores.cloud
     - Client ID: 019986ed-5fea-7886-a2b6-e35968f8ef17
     - Modo: Desarrollo
   ```

3. Verifica que las URLs sean HTTPS (no HTTP)

### Para Vercel

Las mismas variables deben configurarse en Vercel Dashboard:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable con los valores mostrados arriba
4. Marca: Production, Preview, Development
5. Haz Redeploy del proyecto

Ver `INSTRUCCIONES_VERCEL.md` para más detalles.
