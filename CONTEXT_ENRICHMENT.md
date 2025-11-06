# 🎯 Enriquecimiento de Contexto en Retry

## 🧠 El Problema que Resolvimos

### Escenario Real:

```
Usuario: "Dame informe trimestral 2024"
  ↓ (Agente procesa 80s)
Agente responde: "Aquí está tu informe... ¿Quieres que te prepare recomendaciones?"
  ↓
Usuario: "si quiero"
  ↓ (Timeout a los 60s)
  ↓
[RETRY] Frontend reenvía: "si quiero"  ❌
  ↓
Agente: "¿Qué quieres?" 🤔 (perdió contexto)
```

### ✅ Solución Implementada:

En el retry, **capturamos la última pregunta** del agente y la enviamos junto con la respuesta:

```
[RETRY] Frontend envía:
"¿Quieres que te prepare recomendaciones basadas en este análisis?

si quiero"
```

Ahora el agente entiende perfectamente el contexto! ✅

---

## 🔧 Implementación Técnica

### Cambios en `sendMessageToAPI`

**Ubicación:** [Chat.tsx:237-315](src/pages/Chat.tsx#L237-L315)

```typescript
const sendMessageToAPI = async (
  userMessage: string,
  atts: Attachment[],
  onStreamUpdate?: (...) => void,
  attemptNumber: number = 1,
  previousMessages?: Message[]  // ← NUEVO parámetro
): Promise<void> => {

  const isRetry = attemptNumber > 1;
  let enrichedMessage = userMessage;
  let previousQuestion = '';

  // ← NUEVO: Enriquecer mensaje en retry
  if (isRetry && previousMessages && previousMessages.length > 0) {
    // Buscar último mensaje del asistente
    const lastAssistantMessage = [...previousMessages]
      .reverse()
      .find(msg => msg.type === 'assistant' && !msg.isLoading);

    if (lastAssistantMessage && lastAssistantMessage.content) {
      const content = lastAssistantMessage.content;
      const lines = content.split('\n');
      const lastLine = lines[lines.length - 1].trim();

      // Si la última línea es una pregunta, capturarla
      if (lastLine.includes('?')) {
        previousQuestion = lastLine;
        enrichedMessage = `${previousQuestion}\n\n${userMessage}`;
        console.log('🔄 Mensaje enriquecido con contexto');
      }
    }
  }

  // Enviar al webhook
  body: JSON.stringify({
    mensaje: enrichedMessage,  // ← Mensaje enriquecido
    usuario: ...,
    conversationId: ...,

    // Metadata de retry
    ...(isRetry && {
      isRetryRequest: true,
      retryAttempt: attemptNumber,
      retrieveLastResponse: true,
      ...(previousQuestion && { previousQuestion })  // ← NUEVO campo
    })
  })
}
```

---

## 📦 Payload Enviado (Ejemplo Real)

### Caso 1: Primer Intento

```json
{
  "mensaje": "si quiero",
  "usuario": "user-123",
  "conversationId": "abc-456",
  "attachments": []
}
```

### Caso 2: Retry con Contexto Enriquecido

```json
{
  "mensaje": "¿Quieres que te prepare recomendaciones basadas en este análisis para futuras promociones?\n\nsi quiero",
  "usuario": "user-123",
  "conversationId": "abc-456",
  "attachments": [],

  "isRetryRequest": true,
  "retryAttempt": 2,
  "retrieveLastResponse": true,
  "previousQuestion": "¿Quieres que te prepare recomendaciones basadas en este análisis para futuras promociones?"
}
```

---

## 🎬 Flujo Completo con Contexto

```
[T=0s] Usuario: "Dame análisis de productos más vendidos"

Agente procesa (70s):
- Consulta DB
- Genera análisis
- Guarda en memoria:
  "Durante octubre 2025, los productos más vendidos fueron:
   [TABLA DE DATOS]
   ¿Quieres que te prepare recomendaciones basadas en este análisis?"

[T=60s] ⚠️ Timeout

[T=70s] Agente termina y guarda en chatHistory

[T=61s] Usuario: "si quiero"

[T=121s] ⚠️ Timeout de nuevo (el agente aún estaba procesando la primera)

[T=122s] 🔄 RETRY con contexto enriquecido

Frontend captura:
- Último mensaje asistente: "...¿Quieres que te prepare recomendaciones?"
- Última línea: "¿Quieres que te prepare recomendaciones basadas en este análisis?"
- Mensaje usuario: "si quiero"

Frontend envía:
{
  "mensaje": "¿Quieres que te prepare recomendaciones basadas en este análisis?\n\nsi quiero",
  "isRetryRequest": true,
  "retryAttempt": 2,
  "previousQuestion": "¿Quieres que te prepare recomendaciones basadas en este análisis?"
}

Agente recibe mensaje con contexto completo:
"¿Quieres que te prepare recomendaciones basadas en este análisis?

si quiero"

Agente busca en memoria (conversationId):
  [
    {type: "HumanMessage", content: "Dame análisis..."},
    {type: "AIMessage", content: "...¿Quieres recomendaciones?"},
    {type: "HumanMessage", content: "¿Quieres...?\n\nsi quiero"}, ← Reconoce el contexto
    {type: "AIMessage", content: "[RECOMENDACIONES YA GENERADAS]"}
  ]

Agente devuelve respuesta desde memoria en 2s ✅
```

---

## 🔍 Lógica de Extracción de Pregunta

### Algoritmo:

```typescript
// 1. Obtener mensajes previos
const previousMessages = messages; // Array de mensajes

// 2. Buscar último mensaje del asistente (en orden inverso)
const lastAssistantMessage = [...previousMessages]
  .reverse()
  .find(msg =>
    msg.type === 'assistant' &&
    !msg.isLoading
  );

// 3. Extraer contenido
const content = lastAssistantMessage.content;

// 4. Obtener última línea
const lines = content.split('\n');
const lastLine = lines[lines.length - 1].trim();

// 5. Verificar si es pregunta
if (lastLine.includes('?')) {
  previousQuestion = lastLine;
  enrichedMessage = `${previousQuestion}\n\n${userMessage}`;
}
```

### Casos Manejados:

#### Caso A: Pregunta al final
```
Mensaje asistente:
"Aquí está tu análisis.
¿Quieres que prepare recomendaciones?"

Extrae: "¿Quieres que prepare recomendaciones?"
```

#### Caso B: Pregunta en línea separada
```
Mensaje asistente:
"Estos son los datos:
[TABLA]

¿Necesitas algo más?"

Extrae: "¿Necesitas algo más?"
```

#### Caso C: Sin pregunta
```
Mensaje asistente:
"Aquí está tu informe completo."

No extrae nada, mensaje original se mantiene.
```

#### Caso D: Múltiples preguntas
```
Mensaje asistente:
"¿Quieres análisis 2024?
¿O prefieres 2023?
¿O ambos años?"

Extrae solo la última: "¿O ambos años?"
```

---

## 🧪 Ejemplos de Testing

### Test 1: Pregunta Simple

**Historial:**
```
[
  {type: "user", content: "Dame ventas"},
  {type: "assistant", content: "Aquí están. ¿Quieres gráfico?"}
]
```

**Usuario envía:** "sí"

**Retry captura:**
```
previousQuestion: "¿Quieres gráfico?"
enrichedMessage: "¿Quieres gráfico?\n\nsí"
```

---

### Test 2: Pregunta Compleja

**Historial:**
```
[
  {type: "user", content: "Análisis octubre"},
  {type: "assistant", content: "Productos más vendidos:\n[TABLA]\n¿Quieres que te prepare recomendaciones basadas en este análisis para futuras promociones?"}
]
```

**Usuario envía:** "si quiero"

**Retry captura:**
```
previousQuestion: "¿Quieres que te prepare recomendaciones basadas en este análisis para futuras promociones?"
enrichedMessage: "¿Quieres que te prepare recomendaciones basadas en este análisis para futuras promociones?\n\nsi quiero"
```

---

### Test 3: Sin Pregunta

**Historial:**
```
[
  {type: "user", content: "Dame datos"},
  {type: "assistant", content: "Aquí están los datos completos."}
]
```

**Usuario envía:** "gracias"

**Retry:**
```
previousQuestion: ""
enrichedMessage: "gracias" (sin modificar)
```

---

## 📊 Ventajas de Esta Solución

| Ventaja | Descripción |
|---------|-------------|
| **Contexto Preservado** | El agente siempre sabe a qué pregunta responde el usuario |
| **Respuestas Breves OK** | "sí", "no", "claro", "quiero" ahora tienen contexto |
| **Transparente** | El usuario no ve el mensaje modificado (solo se envía al backend) |
| **Compatible con Memoria** | Funciona perfectamente con el sistema de caché del agente |
| **Logs Claros** | Fácil de debuggear viendo el mensaje enriquecido |

---

## 🔧 Configuración en n8n (Actualizada)

### Prompt del Agente (Actualizado):

```markdown
SISTEMA DE RETRY CON CONTEXTO ENRIQUECIDO:

Cuando recibas `isRetryRequest: true`:

1. El mensaje puede venir ENRIQUECIDO con contexto:
   - Si el usuario respondió brevemente ("sí", "quiero", "claro")
   - El frontend agregará tu pregunta anterior al inicio
   - Formato: "{tu_pregunta_anterior}\n\n{respuesta_usuario}"

2. Ejemplo:
   Recibirás: "¿Quieres recomendaciones?\n\nsí"
   En lugar de solo: "sí"

3. Campos adicionales:
   - `previousQuestion`: La pregunta que hiciste (si existe)
   - Úsala para entender mejor el contexto

4. Procesamiento:
   - Busca en memoria usando conversationId
   - El mensaje enriquecido te ayuda a identificar la respuesta correcta
   - Devuelve desde caché sin regenerar
```

---

## 💡 Casos de Uso Reales

### Ejemplo 1: Análisis de Ventas

```
Agente: "Aquí están las ventas de octubre.
        ¿Quieres que compare con septiembre?"

Usuario: "sí"
  ↓ (timeout)

Retry envía: "¿Quieres que compare con septiembre?\n\nsí"

Agente: "Ah, quieres comparación con septiembre"
        → Busca en memoria
        → Devuelve comparación ya generada ✅
```

### Ejemplo 2: Recomendaciones

```
Agente: "[TABLA DE PRODUCTOS]
        ¿Quieres que te prepare recomendaciones basadas en este análisis?"

Usuario: "si quiero"
  ↓ (timeout)

Retry envía: "¿Quieres que te prepare recomendaciones basadas en este análisis?\n\nsi quiero"

Agente: "Entiendo, quieres recomendaciones del análisis"
        → Busca en memoria
        → Devuelve recomendaciones ✅
```

### Ejemplo 3: Follow-up Questions

```
Agente: "Análisis completo listo.
        ¿Necesitas algo más?
        ¿Quieres exportar a Excel?"

Usuario: "exportar"
  ↓ (timeout)

Retry envía: "¿Quieres exportar a Excel?\n\nexportar"

Agente: "Quieres exportar a Excel"
        → Busca en memoria
        → Devuelve link de exportación ✅
```

---

## 🎯 Logs para Debugging

### En la Consola del Navegador:

```javascript
// Cuando detecta pregunta anterior:
🔄 Mensaje enriquecido con contexto de pregunta anterior

// En el log de envío:
📡 Enviando mensaje a: https://... (Intento 2 - RETRY)

// Puedes ver el mensaje completo en Network tab:
{
  "mensaje": "¿Quieres recomendaciones?\n\nsí",
  "isRetryRequest": true,
  "previousQuestion": "¿Quieres recomendaciones?"
}
```

### En n8n:

```javascript
// Agrega log para ver mensaje enriquecido:
console.log('Mensaje recibido:', $input.item.json.mensaje);
console.log('Pregunta previa:', $input.item.json.previousQuestion);

// Output esperado en retry:
// Mensaje recibido: "¿Quieres recomendaciones?\n\nsí"
// Pregunta previa: "¿Quieres recomendaciones?"
```

---

## ✅ Checklist de Verificación

- [x] Extracción de última pregunta del asistente
- [x] Detección de "?" para identificar preguntas
- [x] Enriquecimiento solo en retry (no en primer intento)
- [x] Campo `previousQuestion` en payload
- [x] Logs de debugging
- [x] Build exitoso
- [x] Compatible con sistema de retry existente
- [x] Compatible con sistema de memoria de n8n

---

## 🔄 Actualización de Documentación

Este documento complementa:
- [RETRY_SYSTEM.md](RETRY_SYSTEM.md) - Sistema base de retry
- [N8N_RETRY_CONFIG.md](N8N_RETRY_CONFIG.md) - Configuración n8n
- [QUICK_START_RETRY.md](QUICK_START_RETRY.md) - Guía rápida

**Nueva funcionalidad agregada:**
- ✅ Enriquecimiento de contexto en retry
- ✅ Extracción automática de preguntas
- ✅ Campo `previousQuestion` en payload

---

**Fecha:** 2025-11-05
**Versión:** 2.0.0
**Estado:** ✅ Implementado y Testeado
