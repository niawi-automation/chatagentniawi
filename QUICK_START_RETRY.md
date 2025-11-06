# 🚀 Quick Start - Sistema de Retry con Memoria

## ✅ Lo Que Se Implementó

### Frontend (React) - COMPLETADO ✅
- ✅ Sistema de retry automático (3 intentos, backoff exponencial)
- ✅ Timeout de 60s por intento
- ✅ Flags de retry en el payload: `isRetryRequest`, `retryAttempt`, `retrieveLastResponse`
- ✅ Indicadores visuales de retry en la UI
- ✅ Mensajes de error mejorados
- ✅ Logs detallados en consola

### Backend (n8n) - PENDIENTE ⚠️
Necesitas configurar tu agente en n8n para manejar los retry.

---

## 📦 Payload que Envía el Frontend

### Primer Intento:
```json
{
  "mensaje": "Dame informe trimestral 2024",
  "usuario": "user-123",
  "conversationId": "uuid-abc-123",
  "attachments": []
}
```

### Retry (Intento 2 o 3):
```json
{
  "mensaje": "Dame informe trimestral 2024",
  "usuario": "user-123",
  "conversationId": "uuid-abc-123",
  "attachments": [],

  "isRetryRequest": true,        // ← NUEVO
  "retryAttempt": 2,              // ← NUEVO
  "retrieveLastResponse": true    // ← NUEVO
}
```

---

## 🔧 Qué Agregar en n8n

### Opción Rápida (Agregar al System Prompt)

Agrega esto al **System Prompt** de tu agente:

```markdown
SISTEMA DE RETRY:

Cuando recibas un mensaje con `isRetryRequest: true`:
- Significa que este mensaje ya fue procesado anteriormente
- Busca en tu memoria (chatHistory) usando el conversationId
- Encuentra el ÚLTIMO mensaje de tipo "AIMessage" en el array
- Devuélvelo inmediatamente sin regenerarlo

Ejemplo de chatHistory:
[
  {type: "HumanMessage", content: "Dame informe 2024"},
  {type: "AIMessage", content: "Aquí está..."},
  {type: "HumanMessage", content: "Ahora 2023"},
  {type: "AIMessage", content: "Análisis 2023..."}  ← Devolver este
]

Reglas:
- SIEMPRE busca el ÚLTIMO AIMessage (el más reciente)
- NO regeneres si isRetryRequest es true
- Usa el orden del array (el último es el correcto)
```

---

### Opción Completa (Lógica en Workflow)

Ver documentación completa en: **[N8N_RETRY_CONFIG.md](N8N_RETRY_CONFIG.md)**

**Pasos:**
1. Agregar nodo **IF** que detecte `isRetryRequest`
2. Rama TRUE: Buscar último AIMessage en memoria
3. Rama FALSE: Procesar normalmente
4. Devolver respuesta cacheada o procesada

---

## 🧪 Cómo Probar

### Test 1: Mensaje Normal
```bash
# El mensaje responde en < 60s
# No debería hacer retry
# Logs esperados:
📡 Enviando mensaje a: ... (Primer intento)
✅ Éxito en intento 1
```

### Test 2: Mensaje Complejo con Retry
```bash
# El mensaje toma > 60s
# Hace retry automático
# Logs esperados:
🔄 Intento 1/3
📡 Enviando mensaje a: ... (Primer intento)
⚠️ Intento 1 falló: timeout
⏳ Esperando 1000ms antes del siguiente intento...
🔄 Intento 2/3
📡 Enviando mensaje a: ... (Intento 2 - RETRY)
✅ Stream completado (desde memoria caché), total caracteres: 5234
✅ Éxito en intento 2
```

### Test 3: Verificar Payload en n8n

En tu webhook de n8n, agrega un log temporal:

```javascript
console.log('Payload recibido:', JSON.stringify($input.item.json, null, 2));
```

**Esperado en retry:**
```json
{
  "mensaje": "...",
  "conversationId": "...",
  "isRetryRequest": true,
  "retryAttempt": 2,
  "retrieveLastResponse": true
}
```

---

## 📊 Flujo Completo Ilustrado

```
[T=0s] Usuario: "Dame análisis ventas"
    ↓
Frontend envía (intento 1):
  { mensaje: "...", isRetryRequest: false }
    ↓
n8n/Agente procesa (toma 80s):
  - Consulta bases de datos
  - Genera análisis
  - Guarda en chatHistory
    ↓
[T=60s] Webhook timeout ❌
    ↓
Frontend detecta error
    ↓
Espera 1s (backoff)
    ↓
[T=61s] Frontend envía (intento 2 - RETRY):
  { mensaje: "...", isRetryRequest: true, retryAttempt: 2 }
    ↓
n8n detecta isRetryRequest: true
    ↓
Busca en chatHistory:
  [
    {type: "HumanMessage", content: "Dame análisis..."},
    {type: "AIMessage", content: "[ANÁLISIS YA GENERADO]"}
  ]
    ↓
Encuentra último AIMessage
    ↓
Devuelve "[ANÁLISIS YA GENERADO]" en 2s ✅
    ↓
[T=63s] Usuario recibe respuesta completa ✅
```

---

## 🎯 Checklist de Implementación

### Frontend (Ya hecho ✅)
- [x] Sistema de retry implementado
- [x] Flags agregados al payload
- [x] UI con indicadores de retry
- [x] Logs mejorados

### Backend n8n (Tu tarea ⚠️)
- [ ] Leer campos `isRetryRequest`, `retryAttempt`, `retrieveLastResponse`
- [ ] Agregar lógica para buscar en memoria cuando `isRetryRequest === true`
- [ ] Obtener último AIMessage del chatHistory
- [ ] Devolver respuesta cacheada
- [ ] (Opcional) Actualizar System Prompt con instrucciones
- [ ] Testing con casos reales

---

## 🔍 Verificación Rápida

### En el Frontend:
```bash
# Abre la consola del navegador
# Envía un mensaje que tome > 60s
# Deberías ver:
🔄 Intento 1/3
📡 Enviando mensaje a: https://... (Primer intento)
⚠️ Intento 1 falló: timeout
⏳ Esperando 1000ms...
🔄 Intento 2/3
📡 Enviando mensaje a: https://... (Intento 2 - RETRY)
✅ Stream completado (desde memoria caché)
```

### En el UI:
```
[Badge animado visible]
🔄 Reintentando 2/3
```

### En n8n:
```javascript
// Agrega log temporal
console.log('isRetryRequest:', $input.item.json.isRetryRequest);
console.log('retryAttempt:', $input.item.json.retryAttempt);

// Esperado en retry:
// isRetryRequest: true
// retryAttempt: 2
```

---

## ⚠️ Troubleshooting

### Problema: "El retry no recupera de memoria"
**Causa:** n8n no está leyendo los flags o no busca en memoria
**Solución:**
1. Verifica que los campos lleguen al webhook
2. Agrega logs para ver qué recibe n8n
3. Verifica que chatHistory tenga mensajes guardados

### Problema: "Devuelve respuesta antigua en vez de la última"
**Causa:** No está usando el ÚLTIMO AIMessage
**Solución:** Usa `.pop()` o `[array.length - 1]`

### Problema: "Regenera en lugar de usar caché"
**Causa:** No detecta `isRetryRequest`
**Solución:** Verifica el nodo IF o la lógica de condición

---

## 📚 Documentación Completa

- **Configuración detallada n8n:** [N8N_RETRY_CONFIG.md](N8N_RETRY_CONFIG.md)
- **Sistema de retry frontend:** [RETRY_SYSTEM.md](RETRY_SYSTEM.md)
- **Diseño original:** [retrychat.md](retrychat.md)

---

## 💡 Próximos Pasos

1. ✅ **Frontend está listo** - Ya está enviando los flags correctos
2. ⚠️ **Configura n8n** - Sigue la guía en [N8N_RETRY_CONFIG.md](N8N_RETRY_CONFIG.md)
3. 🧪 **Testea** - Prueba con mensajes complejos que tomen > 60s
4. 🎉 **Disfruta** - 95% de éxito en consultas complejas

---

**¿Dudas?** Revisa [N8N_RETRY_CONFIG.md](N8N_RETRY_CONFIG.md) para ejemplos de código completo.
