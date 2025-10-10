# 🤖 Copiloto Niawi

**Copiloto inteligente para análisis de datos y recomendaciones estratégicas empresariales**

[![Powered by Niawi Tech](https://img.shields.io/badge/Powered%20by-Niawi%20Tech-blue)](http://niawi.tech/)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.11-blue)](https://tailwindcss.com/)

## 🚀 Descripción

Copiloto Niawi es una aplicación web moderna que funciona como asistente ejecutivo inteligente, proporcionando análisis de datos en tiempo real, recomendaciones estratégicas basadas en IA y un panel de control integral para la gestión empresarial.

### ✨ Características principales

- **🔍 Recomendaciones Inteligentes**: Sistema de análisis dinámico que obtiene insights desde APIs externas
- **💬 Chat con IA**: Asistente ejecutivo conversacional para consultas estratégicas
- **🔗 Integraciones**: Conexiones con herramientas empresariales (Google Analytics, CRM, etc.)
- **⚙️ Configuración Avanzada**: Personalización completa de la experiencia del usuario
- **📱 Diseño Responsivo**: Interfaz optimizada para desktop, tablet y móvil
- **🎨 Tema Oscuro**: Diseño moderno con paleta de colores profesional

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Icons**: Lucide React
- **State Management**: React Hooks

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/niawitech/copiloto-niawi.git
cd copiloto-niawi

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 🚀 Scripts disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## 🏗️ Estructura del proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes de UI (Shadcn)
│   ├── NiawiLogo.tsx   # Logo de la aplicación
│   └── DashboardLayout.tsx
├── pages/              # Páginas principales
│   ├── Login.tsx       # Página de autenticación
│   ├── Recommendations.tsx # Módulo de recomendaciones
│   ├── Chat.tsx        # Chat con IA
│   ├── Integrations.tsx # Gestión de integraciones
│   └── Settings.tsx    # Configuración
├── hooks/              # Custom hooks
├── lib/                # Utilidades y configuraciones
└── App.tsx             # Componente principal
```

## 🔧 Configuración

### Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_BASE_URL=https://automation.wtsusa.us/webhook/
VITE_APP_NAME=Copiloto Niawi
VITE_COMPANY_URL=http://niawi.tech/
```

### Personalización de colores

Los colores se pueden personalizar en `tailwind.config.ts`:

```typescript
niawi: {
  bg: '#0A0B0D',
  surface: '#161A1F',
  border: '#252A31',
  primary: '#2563EB',
  secondary: '#06B6D4',
  accent: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
}
```

## 📊 Módulos principales

### 1. Recomendaciones
- Obtención de datos dinámicos desde API externa
- Visualización en cards responsivas
- Sistema de filtrado por estado y categoría
- Modal de detalle expandible con animaciones

### 2. Chat con IA
- Interfaz conversacional moderna
- Sugerencias rápidas predefinidas
- Historial de mensajes
- Indicadores de estado en tiempo real

### 3. Integraciones
- Panel de gestión de conexiones
- Estados visuales de conectividad
- Métricas de sincronización
- Botones de acción contextuales

### 4. Configuración
- Preferencias de notificaciones
- Configuración de IA
- Gestión de datos y privacidad
- Información de la aplicación

## 🎨 Design System

Copiloto Niawi utiliza un design system moderno con:

- **Paleta de colores**: Tonos oscuros profesionales con acentos azules y verdes
- **Tipografía**: Inter font family para máxima legibilidad
- **Componentes**: Basados en Shadcn/ui con personalizaciones
- **Animaciones**: Transiciones suaves y efectos hover
- **Responsive**: Grid system flexible con breakpoints estándar

## 🚀 Deployment

```bash
# Build de producción
npm run build

# Los archivos se generan en la carpeta dist/
# Subir a tu servidor web preferido
```

### Plataformas recomendadas
- Vercel
- Netlify
- AWS S3 + CloudFront
- DigitalOcean App Platform

## 📝 Roadmap

- [ ] Autenticación con JWT
- [ ] Dashboard de analytics avanzado
- [ ] Notificaciones push
- [ ] Exportación de reportes
- [ ] Integración con más APIs
- [ ] Modo offline
- [ ] PWA support

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🏢 Niawi Tech

Desarrollado con ❤️ por **Niawi Tech**

- 🌐 Website: [niawi.tech](http://niawi.tech/)
- 📧 Email: contact@niawi.tech
- 💼 LinkedIn: [Niawi Tech](https://linkedin.com/company/niawi-tech)

---

**Copiloto Niawi** - *Potenciando decisiones empresariales con inteligencia artificial*
