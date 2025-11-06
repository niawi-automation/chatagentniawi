# 🔧 Configuración del Sistema de Retry en n8n

## 📋 Resumen

Este documento explica cómo configurar tu agente en n8n para que maneje correctamente el sistema de retry implementado en el frontend.

---

## 🎯 Objetivo

Cuando el frontend hace un retry después de un timeout, el agente debe:
1. **Detectar** que es un retry (usando el flag `isRetryRequest`)
2. **Buscar en memoria** la respuesta ya generada
3. **Devolver la respuesta cacheada** sin regenerarla
4. **Responder rápidamente** (2-3 segundos en lugar de 60-120s)

---

## 📦 Payload que Recibirás

### Primer Intento (Normal)
```json
{
  "mensaje": "Dame un informe detallado de ventas trimestrales 2024",
  "usuario": "user-123",
  "conversationId": "uuid-abc-123",
  "attachments": []
}
```

### Retry (Después de Timeout)
```json
{
  "mensaje": "Dame un informe detallado de ventas trimestrales 2024",
  "usuario": "user-123",
  "conversationId": "uuid-abc-123",
  "attachments": [],

  "isRetryRequest": true,
  "retryAttempt": 2,
  "retrieveLastResponse": true
}
```

**Campos nuevos:**
- `isRetryRequest` (boolean): Indica que es un retry
- `retryAttempt` (number): Número de intento (1, 2, 3...)
- `retrieveLastResponse` (boolean): Instrucción para recuperar de memoria

---

## 🧠 Estructura de Memoria (LangChain)

Tu agente guarda la conversación así:

```javascript
{
  "action": "saveContext",
  "chatHistory": [
    {
      "type": "HumanMessage",
      "kwargs": {
        "content": "Dame informe trimestral 2024"
      }
    },
    {
      "type": "AIMessage",
      "kwargs": {
        "content": "[INFORME COMPLETO GENERADO]"
      }
    },
    {
      "type": "HumanMessage",
      "kwargs": {
        "content": "Sí, envíamelo"
      }
    },
    {
      "type": "AIMessage",
      "kwargs": {
        "content": "[ANÁLISIS GENERADO]"
      }
    }
  ]
}
```

---

## ⚙️ Configuración en n8n

### Paso 1: Detectar Retry en el Workflow

En tu nodo de **Webhook** o **Función** que recibe el request, agrega:

```javascript
// Obtener los datos del request
const mensaje = $input.item.json.mensaje;
const conversationId = $input.item.json.conversationId;
const isRetryRequest = $input.item.json.isRetryRequest || false;
const retrieveLastResponse = $input.item.json.retrieveLastResponse || false;

// Pasar estos valores al siguiente nodo
return {
  mensaje,
  conversationId,
  isRetryRequest,
  retrieveLastResponse
};
```

---

### Paso 2: Crear Nodo Condicional (IF)

Agrega un nodo **IF** después del webhook:

**Condición:**
```
{{ $json.isRetryRequest }} === true
```

**Dos ramas:**
- ✅ **TRUE** → Recuperar de memoria
- ❌ **FALSE** → Procesar normalmente

---

### Paso 3A: Rama TRUE - Recuperar de Memoria

Crear un nodo de **Function** llamado "Recuperar Respuesta de Memoria":

```javascript
// Obtener conversationId
const conversationId = $input.item.json.conversationId;

// Obtener chatHistory de memoria (ajusta según tu implementación)
// Ejemplo usando n8n Memory:
const chatHistory = await this.getWorkflowStaticData('node').memory[conversationId];

// Si no hay chatHistory, continuar con procesamiento normal
if (!chatHistory || !chatHistory.chatHistory) {
  return {
    json: {
      shouldProcess: true,
      mensaje: $input.item.json.mensaje,
      conversationId: conversationId
    }
  };
}

// Filtrar solo mensajes de tipo AIMessage
const aiMessages = chatHistory.chatHistory.filter(msg => {
  return msg.type === 'constructor' &&
         msg.id &&
         msg.id.includes('AIMessage');
});

// Obtener el ÚLTIMO mensaje AIMessage
const lastAIMessage = aiMessages[aiMessages.length - 1];

// Si existe, devolverlo
if (lastAIMessage && lastAIMessage.kwargs && lastAIMessage.kwargs.content) {
  console.log('✅ Respuesta encontrada en memoria caché');

  return {
    json: {
      output: lastAIMessage.kwargs.content,
      source: 'memory_cache',
      isRetry: true,
      conversationId: conversationId
    }
  };
}

// Si no se encontró, procesar normalmente
return {
  json: {
    shouldProcess: true,
    mensaje: $input.item.json.mensaje,
    conversationId: conversationId
  }
};
```

---

### Paso 3B: Rama FALSE - Procesamiento Normal

Continúa con tu flujo normal de procesamiento del agente IA.

---

### Paso 4: Agregar al System Prompt del Agente

En tu nodo de **Agent** o **ChatOpenAI/ChatAnthropic**, agrega esto al **System Prompt**:

```markdown
# SISTEMA DE RETRY - INSTRUCCIONES CRÍTICAS

## Contexto
El frontend tiene un timeout de 60 segundos, pero tú puedes tomar hasta 120 segundos procesando.
Cuando el frontend hace timeout, TÚ sigues trabajando en background y guardas la respuesta en memoria.
Luego el frontend reintenta automáticamente enviando el mismo mensaje.

## Comportamiento en Retry

Cuando el workflow detecte `isRetryRequest: true`:
- La respuesta ya debería estar en tu memoria (chatHistory)
- El nodo de "Recuperar Respuesta de Memoria" la buscará
- Si la encuentra, se devolverá inmediatamente SIN llamarte
- Si NO la encuentra (aún procesando), se te llamará normalmente

## Tu Responsabilidad

1. **SIEMPRE guarda tus respuestas en memoria** usando saveContext
2. **Procesa cada mensaje solo UNA VEZ** (aunque lo recibas múltiples veces)
3. **Usa el conversationId** para mantener contexto

## Ejemplo de Flujo

### Primera Llamada (T=0s)
```
Usuario: "Dame informe trimestral 2024"
→ Procesas durante 80 segundos
→ Guardas en memoria:
  chatHistory: [
    {type: "HumanMessage", content: "Dame informe..."},
    {type: "AIMessage", content: "[INFORME COMPLETO]"}
  ]
→ Webhook timeout a los 60s (pero tú terminas a los 80s)
```

### Retry (T=61s)
```
Usuario: "Dame informe trimestral 2024" (mismo mensaje)
isRetryRequest: true
→ Workflow busca en memoria
→ Encuentra chatHistory con tu respuesta
→ Devuelve "[INFORME COMPLETO]" instantáneamente
→ TÚ NO ERES LLAMADO (se usa caché)
```

### Nueva Pregunta (T=90s)
```
Usuario: "Ahora analiza 2023"
isRetryRequest: false
→ Es un mensaje nuevo
→ TÚ ERES LLAMADO para procesar
→ Usas el contexto previo (informe 2024)
→ Generas análisis 2023
→ Guardas en memoria:
  chatHistory: [
    ...anterior,
    {type: "HumanMessage", content: "Ahora analiza 2023"},
    {type: "AIMessage", content: "[ANÁLISIS 2023]"}
  ]
```

## Importante

- ✅ Cada respuesta se guarda en memoria automáticamente
- ✅ El retry recupera la ÚLTIMA respuesta (por posición en el array)
- ✅ No necesitas lógica especial de retry en tu prompt
- ✅ Solo asegúrate de que saveContext funcione correctamente
```

---

## 🔍 Implementación Alternativa Simplificada

Si tu configuración de memoria es más simple, puedes usar este enfoque:

### Código JavaScript en n8n

```javascript
// En un nodo Function ANTES del agente

const isRetryRequest = $input.item.json.isRetryRequest || false;
const conversationId = $input.item.json.conversationId;
const mensaje = $input.item.json.mensaje;

if (isRetryRequest) {
  // Agregar instrucción especial al mensaje
  const enhancedMessage = `[RETRY_REQUEST] ${mensaje}

  INSTRUCCIÓN: Este es un reintento debido a timeout.
  Busca en tu memoria (conversationId: ${conversationId}) si ya generaste
  una respuesta para este mensaje. Si existe, devuélvela inmediatamente.
  Si aún no está completa, continúa procesando.`;

  return {
    json: {
      mensaje: enhancedMessage,
      conversationId: conversationId,
      isRetry: true
    }
  };
} else {
  // Primera vez, pasar normal
  return {
    json: {
      mensaje: mensaje,
      conversationId: conversationId,
      isRetry: false
    }
  };
}
```

**Ventaja:** No requiere lógica compleja de búsqueda en memoria
**Desventaja:** El mensaje se modifica ligeramente

---

## 📊 Logs Recomendados

Agrega logs en tu workflow para debugging:

```javascript
// Al inicio del workflow
console.log(`📥 Request recibido: ${$input.item.json.isRetryRequest ? 'RETRY' : 'NUEVO'}`);
console.log(`   conversationId: ${$input.item.json.conversationId}`);
console.log(`   retryAttempt: ${$input.item.json.retryAttempt || 1}`);

// Al recuperar de memoria
console.log(`✅ Respuesta encontrada en caché para conversationId: ${conversationId}`);

// Al procesar normalmente
console.log(`🤖 Procesando nuevo mensaje para conversationId: ${conversationId}`);
```

---

## 🧪 Testing

### Caso 1: Pregunta Normal (< 60s)
```json
{
  "mensaje": "Hola",
  "conversationId": "test-1",
  "isRetryRequest": false
}
```
**Esperado:** Procesa y responde normalmente

---

### Caso 2: Pregunta Compleja (> 60s) con Retry
```json
// Primera llamada
{
  "mensaje": "Dame análisis completo de ventas 2024",
  "conversationId": "test-2",
  "isRetryRequest": false
}
// → Toma 80s, guarda en memoria

// Retry (simular después de 61s)
{
  "mensaje": "Dame análisis completo de ventas 2024",
  "conversationId": "test-2",
  "isRetryRequest": true,
  "retryAttempt": 2,
  "retrieveLastResponse": true
}
// → Responde desde memoria en 2s ✅
```

---

### Caso 3: Conversación Continua
```json
// Primera pregunta
{
  "mensaje": "Dame reporte 2024",
  "conversationId": "test-3",
  "isRetryRequest": false
}

// Segunda pregunta (después de recibir respuesta)
{
  "mensaje": "Ahora compáralo con 2023",
  "conversationId": "test-3",
  "isRetryRequest": false
}
// → Timeout a los 60s

// Retry de la segunda pregunta
{
  "mensaje": "Ahora compáralo con 2023",
  "conversationId": "test-3",
  "isRetryRequest": true,
  "retryAttempt": 2,
  "retrieveLastResponse": true
}
// → Debe devolver la comparación 2023, NO el reporte 2024 ✅
```

---

## ✅ Checklist de Implementación

- [ ] Nodo de Webhook recibe y parsea `isRetryRequest`, `retryAttempt`, `retrieveLastResponse`
- [ ] Nodo IF condicional basado en `isRetryRequest`
- [ ] Rama TRUE: Función que busca último AIMessage en memoria
- [ ] Rama FALSE: Flujo normal del agente
- [ ] System Prompt del agente actualizado con instrucciones de retry
- [ ] Logs agregados para debugging
- [ ] Testing de casos: normal, retry, conversación continua
- [ ] Verificar que `saveContext` guarde correctamente en memoria

---

## 🚨 Errores Comunes

### Error 1: "No encuentra respuesta en retry"
**Causa:** La memoria no se guardó correctamente
**Solución:** Verifica que `saveContext` se ejecute después de generar la respuesta

### Error 2: "Devuelve respuesta antigua en vez de la última"
**Causa:** No está obteniendo el ÚLTIMO AIMessage
**Solución:** Usa `.pop()` o `[array.length - 1]` para el último elemento

### Error 3: "Regenera en lugar de usar caché"
**Causa:** El nodo IF no detecta `isRetryRequest`
**Solución:** Verifica que el campo se pase correctamente desde el webhook

---

## 📚 Referencias

- **Documento de diseño:** [retrychat.md](retrychat.md)
- **Sistema de retry frontend:** [RETRY_SYSTEM.md](RETRY_SYSTEM.md)
- **Código frontend:** [src/pages/Chat.tsx](src/pages/Chat.tsx)

---

## 💡 Ejemplo Visual del Flujo en n8n

```
┌─────────────┐
│  Webhook    │
│  (Recibe    │
│   request)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Function   │
│  (Parsear   │
│   campos)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     IF      │
│ isRetry?    │
└──┬────────┬─┘
   │        │
TRUE│        │FALSE
   │        │
   ▼        ▼
┌────────┐ ┌────────┐
│Recuper │ │Process │
│Memoria │ │Agente  │
└───┬────┘ └───┬────┘
    │          │
    │          ▼
    │     ┌────────┐
    │     │ Save   │
    │     │Context │
    │     └───┬────┘
    │         │
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │Response │
    └─────────┘
```

---

**Fecha de creación:** 2025-11-05
**Versión:** 1.0.0
**Estado:** ✅ Listo para implementar
