# Configuración del API del Chat

Este documento explica cómo configurar la URL del API del chat usando variables de entorno.

---

## 📋 Variable de Entorno Requerida

### `VITE_CHAT_API_URL`

**Descripción:** URL del endpoint donde se procesarán los mensajes del chat.

**Formato:** `https://tu-dominio.com/webhook/tu-id`

**Ejemplo:** `https://flow.e3stores.cloud/webhook/b2b03ef1-d0de-4dde-8bd5-ac1c5f856ab5`

---

## 🚀 Configuración en Vercel

### Pasos para configurar en Vercel:

1. Ve a tu proyecto en Vercel
2. Navega a **Settings** → **Environment Variables**
3. Haz clic en **Add New**
4. Configura la variable:
   - **Name:** `VITE_CHAT_API_URL`
   - **Value:** Tu URL del webhook (ej: `https://flow.e3stores.cloud/webhook/...`)
   - **Environment:** Selecciona los ambientes donde aplicará:
     - ✅ Production
     - ✅ Preview
     - ✅ Development (opcional)
5. Haz clic en **Save**
6. **Re-deploy** tu aplicación para que tome la nueva variable

### Screenshot de referencia:
```
┌─────────────────────────────────────────┐
│ Environment Variables                    │
├─────────────────────────────────────────┤
│ Name:  VITE_CHAT_API_URL                │
│ Value: https://flow.e3stores.cloud/...  │
│ Environments: ☑ Production              │
│               ☑ Preview                  │
│               ☐ Development              │
└─────────────────────────────────────────┘
```

---

## 💻 Configuración en Desarrollo Local

### Opción 1: Crear archivo `.env.local`

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` y agrega tu URL:
   ```env
   VITE_CHAT_API_URL=https://flow.e3stores.cloud/webhook/tu-webhook-id
   ```

3. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Opción 2: Usar archivo `.env`

Si prefieres usar `.env` en lugar de `.env.local`:

```env
VITE_CHAT_API_URL=https://flow.e3stores.cloud/webhook/tu-webhook-id
```

⚠️ **Nota:** `.env.local` tiene prioridad sobre `.env` y NO se sube a Git.

---

## 🔄 Cómo Funciona

El chat usa la variable de entorno de la siguiente manera:

```typescript
// En src/pages/Chat.tsx
const apiUrl = import.meta.env.VITE_CHAT_API_URL || getAgentEndpoint(selectedAgent.id);
```

**Prioridad:**
1. **Primero:** Variable de entorno `VITE_CHAT_API_URL` (si existe)
2. **Fallback:** Endpoint configurado en el agente (si VITE_CHAT_API_URL no existe)

---

## 📡 Estructura del Request

Cuando un usuario envía un mensaje, se hace un `POST` a la URL configurada con el siguiente body:

```json
{
  "mensaje": "¿Qué facturación logramos hoy?",
  "agente": "operations",
  "contexto": "Operaciones",
  "usuario": "user-id-123",
  "attachments": []
}
```

### Respuesta Esperada

El endpoint debe responder con uno de estos formatos:

**Formato 1: Objeto directo**
```json
{
  "output": "La facturación de hoy es de $125,000 USD..."
}
```

**Formato 2: Array con un elemento**
```json
[
  {
    "output": "La facturación de hoy es de $125,000 USD..."
  }
]
```

---

## 🧪 Testing

### Verificar que la variable está configurada:

1. **En desarrollo local:**
   ```bash
   # En la consola del navegador (F12)
   console.log(import.meta.env.VITE_CHAT_API_URL)
   ```

2. **En producción (Vercel):**
   - Abre la consola del navegador
   - Envía un mensaje en el chat
   - Verás un log: `📡 Enviando mensaje a: https://...`

### Test de conexión:

Puedes probar tu endpoint con `curl`:

```bash
curl -X POST https://flow.e3stores.cloud/webhook/tu-id \
  -H "Content-Type: application/json" \
  -d '{
    "mensaje": "Test",
    "agente": "operations",
    "contexto": "Operaciones",
    "usuario": "test-user"
  }'
```

---

## 🔐 Seguridad

### Buenas Prácticas:

1. ✅ **Nunca** commits el archivo `.env.local` a Git
2. ✅ Usa diferentes URLs para diferentes ambientes:
   - Development: Webhook de pruebas
   - Staging: Webhook de staging
   - Production: Webhook de producción
3. ✅ Rota tus webhook IDs periódicamente si es posible
4. ✅ Implementa rate limiting en tu endpoint

### Variables por Ambiente:

En Vercel puedes configurar diferentes URLs para cada ambiente:

```
Production:  VITE_CHAT_API_URL=https://api.prod.example.com/chat
Preview:     VITE_CHAT_API_URL=https://api.staging.example.com/chat
Development: VITE_CHAT_API_URL=http://localhost:3000/api/chat
```

---

## 🐛 Troubleshooting

### Error: "Endpoint del chat no configurado"

**Causa:** La variable `VITE_CHAT_API_URL` no está configurada.

**Solución:**
1. Verifica que existe el archivo `.env.local` con la variable
2. Reinicia el servidor de desarrollo: `npm run dev`
3. En Vercel, verifica que la variable esté configurada y re-deploya

### Los mensajes no llegan al webhook

**Posibles causas:**
1. URL incorrecta en `VITE_CHAT_API_URL`
2. Webhook deshabilitado o expirado
3. Problemas de CORS en el endpoint
4. Firewall bloqueando las peticiones

**Verificación:**
```javascript
// En consola del navegador
console.log('API URL:', import.meta.env.VITE_CHAT_API_URL)
```

### Cambié la variable pero no se actualiza

**En desarrollo local:**
```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
npm run dev
```

**En Vercel:**
1. Después de cambiar la variable, debes re-deployar
2. O hacer un cambio dummy en el código para forzar un deploy

---

## 📚 Archivos Relacionados

- `.env.example` - Template con variables de ejemplo
- `.env.local` - Tu configuración local (NO en Git)
- `src/pages/Chat.tsx` - Donde se usa la variable
- `.gitignore` - Asegura que `.env.local` no se suba

---

## ✅ Checklist de Configuración

Desarrollo Local:
- [ ] Copiar `.env.example` a `.env.local`
- [ ] Configurar `VITE_CHAT_API_URL` en `.env.local`
- [ ] Reiniciar servidor de desarrollo
- [ ] Verificar en consola que la URL es correcta

Vercel (Producción):
- [ ] Ir a Settings → Environment Variables
- [ ] Agregar `VITE_CHAT_API_URL` con la URL del webhook
- [ ] Seleccionar ambientes (Production, Preview)
- [ ] Guardar y re-deployar
- [ ] Verificar en producción que funciona

---

## 🆘 Soporte

Si tienes problemas con la configuración:

1. Verifica que la variable comience con `VITE_` (requerido por Vite)
2. Reinicia siempre el servidor después de cambiar `.env.local`
3. En Vercel, siempre re-deploya después de cambiar variables
4. Revisa los logs de consola para ver la URL que se está usando

---

**Última actualización:** Octubre 2025
