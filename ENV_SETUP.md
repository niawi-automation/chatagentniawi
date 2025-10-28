# Configuración de Variables de Entorno

## Variables Requeridas

Para que la aplicación funcione correctamente con el backend de autenticación y los servicios externos, debes configurar las siguientes variables de entorno.

### Cómo Configurar

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Backend de Autenticación (REQUERIDO)
VITE_AUTH_BASE_URL=https://aiauth.e3stores.cloud
VITE_AUTH_CLIENT_ID=<tu-client-id>

# Webhooks de Automatizaciones (REQUERIDO)
VITE_WEBHOOK_WIP=<url-webhook-wip>
VITE_WEBHOOK_PACKING_LIST=<url-webhook-packing-list>
VITE_N8N_WEBHOOK_POBUYS=<url-webhook-pobuys>

# Webhooks de Agentes IA (REQUERIDO)
VITE_WEBHOOK_AGENT_OPERATIONS=<url-webhook-pcp>
VITE_WEBHOOK_AGENT_DOCUMENTS=<url-webhook-wts>

# APIs Externas (REQUERIDO)
VITE_CHAT_API_URL=<url-api-chat>
VITE_RECOMMENDATIONS_API_URL=https://flow.e3stores.cloud/webhook/agent
```

**IMPORTANTE:** Reemplaza los valores `<...>` con las URLs reales proporcionadas por el equipo.

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
