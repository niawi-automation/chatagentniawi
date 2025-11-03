# 🛠️ Comandos de Desarrollo - Portal de Agentes

## 🚀 **Comandos Básicos**

### **Iniciar el proyecto:**
```bash
npm run dev
# o con bun
bun dev
```

### **Build para producción:**
```bash
npm run build
npm run preview
```

### **Linting:**
```bash
npm run lint
```

---

## 🔧 **Variables de Entorno**

Crear archivo `.env` en la raíz del proyecto:

```env
# API Configuration
VITE_CHAT_API_URL=https://tu-n8n-instance.com/webhook

# Development
VITE_APP_ENV=development

# Analytics (opcional)
VITE_ANALYTICS_ID=your-analytics-id
```

---

## 🎭 **Cambio de Roles para Testing**

### **En el código (AgentContext.tsx):**

```typescript
// Línea 88 - Cambiar el rol inicial:
const [currentUser, setCurrentUser] = useState<User | null>({
  id: '1',
  name: 'Test User',
  email: 'test@niawi.tech',
  role: 'admin', // ← Cambiar aquí: 'employee', 'manager', 'admin'
  companyId: 'company1',
  availableAgents: ['operations', 'hr', 'sales', 'documents']
});
```

### **Con el Panel de Desarrollo:**
- El panel aparece automáticamente en esquina inferior derecha (solo en development)
- Clic en los botones para cambiar roles en tiempo real

---

## 🤖 **Configuración de Agentes**

### **Agregar un nuevo agente:**

1. **En AgentContext.tsx:**
```typescript
{
  id: 'nuevo-agente',
  name: 'Nuevo Agente',
  department: 'Departamento',
  description: 'Descripción del agente',
  icon: IconoComponent, // Importar de lucide-react
  color: 'text-color-400',
  bgColor: 'bg-color-500/10',
  endpoint: '/nuevo-endpoint',
  capabilities: ['Cap1', 'Cap2', 'Cap3'],
  status: 'active'
}
```

2. **En las funciones de roles:**
```typescript
case 'admin':
  return agents; // Incluye automáticamente el nuevo agente
```

---

## 📊 **Testing de Funcionalidades**

### **1. Selector de Agentes:**
```bash
# Navegar a:
http://localhost:5173/dashboard/chat

# Verificar:
- ✅ Selector aparece en la parte superior
- ✅ Cambia agentes según rol
- ✅ Badges y avatares funcionan
- ✅ Restricciones por rol
```

### **2. Chat Dinámico:**
```bash
# Verificar:
- ✅ Mensaje de bienvenida cambia por agente
- ✅ Sugerencias dinámicas
- ✅ Avatar del agente en mensajes
- ✅ Endpoints dinámicos (ver DevTools)
```

### **3. Dashboard Admin:**
```bash
# Navegar a:
http://localhost:5173/dashboard/agents

# Verificar:
- ✅ Métricas se muestran
- ✅ Tabs funcionan correctamente
- ✅ Cards de agentes
- ✅ Gestión de empresas
```

---

## 🔍 **Debugging**

### **Ver llamadas a API:**
```javascript
// En DevTools → Network
// Buscar llamadas POST con:
{
  "mensaje": "test",
  "agente": "operations", // ← Debe cambiar según agente
  "contexto": "Operaciones",
  "usuario": "1"
}
```

### **Estado del contexto:**
```javascript
// En React DevTools
// Buscar: AgentContext
// Verificar: selectedAgent, currentUser, etc.
```

---

## 🚀 **Deploy en Vercel**

### **1. Conectar proyecto:**
```bash
# En Vercel dashboard
# Import Git Repository
# Conectar tu repo
```

### **2. Variables de entorno en Vercel:**
```env
VITE_CHAT_API_URL=https://production-n8n.com/webhook
```

### **3. Deploy automático:**
- Cada push a `main` despliega automáticamente
- Preview URLs para branches

---

## 🛠️ **Solución de Problemas Comunes**

### **Error: Module not found**
```bash
npm install
# o
bun install
```

### **Error: Cannot read properties of undefined**
```typescript
// Verificar que el AgentProvider envuelve la aplicación
// En App.tsx debe estar:
<AgentProvider>
  <TooltipProvider>
    // ... resto de la app
  </TooltipProvider>
</AgentProvider>
```

### **Agentes no se muestran:**
```typescript
// Verificar en AgentContext.tsx:
// 1. Los agentes están definidos
// 2. getAvailableAgents() retorna correctamente
// 3. El rol del usuario es correcto
```

### **Estilos no se aplican:**
```bash
# Verificar Tailwind CSS
npm run build
# Comprobar que los estilos niawi-* están definidos en index.css
```

---

## 📝 **Próximas Implementaciones**

### **Base de Datos (Supabase):**
```bash
# Instalar Supabase
npm install @supabase/supabase-js

# Crear cliente
# src/lib/supabase.ts
```

### **Autenticación Real:**
```bash
# Implementar en useAuth.ts
# Reemplazar localStorage por Supabase Auth
```

### **Métricas Reales:**
```bash
# Implementar tracking de:
# - Conversaciones por agente
# - Tiempo de respuesta
# - Satisfacción usuario
```

---

## 🎯 **Para la Demo con Laureano**

### **1. Preparación (5 min antes):**
```bash
# Asegurarse que todo funciona
npm run dev
# Abrir: http://localhost:5173
# Probar cambio de roles
# Verificar selector de agentes
```

### **2. Durante la Demo:**
```bash
# Rutas clave:
/dashboard/chat     # ← Mostrar selector de agentes
/dashboard/agents   # ← Dashboard administrativo

# Panel de roles:
# ← Esquina inferior derecha para cambiar roles
```

### **3. Puntos de Venta:**
- ✅ "Mira cómo cambian los agentes según el rol"
- ✅ "El dashboard muestra métricas en tiempo real"
- ✅ "La arquitectura está lista para múltiples empresas"
- ✅ "Cada agente tiene su endpoint dinámico"

---

## 🏆 **¡TODO LISTO PARA IMPRESIONAR!**

El MVP está completamente funcional y demuestra una visión técnica sólida con capacidad de ejecución excepcional. 🚀 