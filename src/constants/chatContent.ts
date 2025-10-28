/**
 * Chat Content - Data model para contenidos dinámicos del chat consultor
 *
 * Este archivo define todos los contenidos dinámicos del chat:
 * - Encabezados y saludos según franja horaria
 * - Preguntas sugeridas con gating por integraciones
 * - Loading tips accionables
 * - Configuración de variantes de español (tuteo/voseo)
 */

export interface ChatQuestion {
  id: string;
  text: string;
  requires: string[]; // Integraciones requeridas (vacío = siempre disponible)
  category?: 'alertas' | 'rentabilidad' | 'geografia' | 'marketing' | 'operaciones' | 'riesgo' | 'navegacion';
}

export interface LoadingTip {
  id: string;
  text: string;
  requires: string[]; // Integraciones requeridas
  category?: 'conversion' | 'analytics' | 'inventario' | 'cx';
}

export interface ChatContentConfig {
  meta: {
    agentBrand: string;
    spanishVariant: 'tuteo' | 'voseo';
    daypartRules: {
      morning: string[];
      afternoon: string[];
      evening: string[];
    };
  };
  headers: Record<string, string>;
  subheaders: string[];
  questions: ChatQuestion[];
  loadingTips: LoadingTip[];
}

/**
 * Configuración principal del contenido del chat
 */
export const CHAT_CONTENT: ChatContentConfig = {
  meta: {
    agentBrand: "E3Agent",
    spanishVariant: "tuteo", // Cambiar a "voseo" para AR/URU
    daypartRules: {
      morning: ["checkin_kpis", "vista_ejecutiva"],
      afternoon: ["impacto_ahora", "seguimiento", "optimicemos_tarde"],
      evening: ["cierre_fuerte", "rentabilidad_hoy"]
    }
  },

  headers: {
    impacto_ahora: "¿Dónde está el mayor impacto ahora?",
    decisiones_clave: "{agentBrand} disponible para decisiones clave.",
    seguimiento: "Seguimiento de acciones comerciales en curso.",
    foco_ahora: "¿Qué área necesita foco ahora?",
    optimicemos_tarde: "Optimicemos tu {daypart_es} con insights.",
    checkin_kpis: "¿Hacemos check-in de tus KPIs?",
    seguimos_impulsando: "Seguimos impulsando resultados.",
    vista_ejecutiva: "¿Quer{v_os_e}s una vista ejecutiva rápida?",
    rentabilidad_hoy: "¿Cómo viene la rentabilidad hoy?",
    cierre_fuerte: "Vamos por un cierre fuerte."
  },

  subheaders: [
    "Veamos alertas de negocio o desvíos.",
    "{agentBrand} para tomas de decisión rápidas.",
    "Estrategia clara para tu jornada empresarial.",
    "Seguimiento de acciones comerciales en curso."
  ],

  questions: [
    // Alertas y foco
    { id: "desv_criticas", text: "¿Hay desviaciones críticas en curso?", requires: [], category: 'alertas' },
    { id: "foco_inversion", text: "¿Dónde concentrar inversión y foco ahora?", requires: ["ga", "ventas"], category: 'alertas' },
    { id: "kpis_atencion", text: "¿Qué KPIs requieren atención inmediata?", requires: [], category: 'alertas' },
    { id: "alertas_24h", text: "¿Qué alertas superaron umbral en las últimas 24 h?", requires: ["ga", "crm", "erp"], category: 'alertas' },

    // Rentabilidad / ingresos
    { id: "margen_bruto_hoy", text: "¿Qué margen bruto logramos hoy?", requires: ["contable"], category: 'rentabilidad' },
    { id: "rentab_neta_pais", text: "¿Cuál fue la rentabilidad neta por país?", requires: ["contable"], category: 'rentabilidad' },
    { id: "margen_incremental", text: "¿Qué canal aportó mayor margen incremental esta semana?", requires: ["ga", "ventas"], category: 'rentabilidad' },
    { id: "facturacion_canal", text: "¿Qué facturación logramos hoy por canal?", requires: ["ga", "ventas"], category: 'rentabilidad' },

    // Geografía / partners
    { id: "performance_pais", text: "¿Cómo está la performance país por país?", requires: ["ventas"], category: 'geografia' },
    { id: "partner_ajustes", text: "¿Qué partner requiere ajustes urgentes?", requires: ["crm"], category: 'geografia' },

    // Marketing / GA
    { id: "pauta_eficiente", text: "¿Qué inversión en pauta fue más eficiente?", requires: ["ga"], category: 'marketing' },
    { id: "funnel", text: "¿Cómo evoluciona el funnel de conversión?", requires: ["ga"], category: 'marketing' },
    { id: "categorias_mejor", text: "¿Qué categorías están rindiendo mejor?", requires: ["ga"], category: 'marketing' },
    { id: "campana_cpa", text: "¿Qué campaña tiene mayor CPA vs objetivo?", requires: ["ga"], category: 'marketing' },
    { id: "promo_pico", text: "¿Qué promoción explicó el pico de ayer?", requires: ["ga"], category: 'marketing' },

    // Operaciones / inventario
    { id: "quiebres_stock", text: "¿Dónde tenemos quiebres de stock críticos?", requires: ["inventario"], category: 'operaciones' },
    { id: "tiempo_operativo", text: "¿Dónde se pierde más tiempo operativo?", requires: ["ops"], category: 'operaciones' },
    { id: "area_menos_eficiente", text: "¿Qué área tuvo menor eficiencia hoy?", requires: ["ops"], category: 'operaciones' },
    { id: "articulos_estrella_stock", text: "¿Qué artículos estrella perdieron disponibilidad esta semana?", requires: ["inventario"], category: 'operaciones' },

    // Riesgo / eficiencia
    { id: "riesgo_perdida", text: "¿Dónde está el mayor riesgo de pérdida hoy?", requires: ["ga", "ventas"], category: 'riesgo' },
    { id: "herr_poco_aprovech", text: "¿Qué herramientas están poco aprovechadas?", requires: [], category: 'riesgo' },
    { id: "oportunidad_clave", text: "¿Qué oportunidad comercial es clave hoy?", requires: ["crm"], category: 'riesgo' },
    { id: "alertas_reglas", text: "¿Qué alertas pueden resolverse con reglas?", requires: [], category: 'riesgo' },
    { id: "delegar_escalar", text: "¿Qué tareas deberíamos delegar o escalar?", requires: ["ops"], category: 'riesgo' },
    { id: "cohortes_churn", text: "¿Qué cohortes de clientes están en riesgo de churn?", requires: ["crm", "ga"], category: 'riesgo' },

    // Navegación rápida
    { id: "abrir_tablero", text: "Muéstrame el tablero ejecutivo de hoy.", requires: [], category: 'navegacion' }
  ],

  loadingTips: [
    // Conversión/Marketing
    { id: "conv_fuente", text: "Monitorea la tasa de conversión por fuente de tráfico", requires: ["ga"], category: 'conversion' },
    { id: "encuesta_post", text: "Utiliza encuestas post-compra para mejorar la experiencia", requires: ["ecom"], category: 'conversion' },
    { id: "testimonios_high", text: "Utiliza testimonios específicos para productos de alto valor", requires: ["ecom"], category: 'conversion' },
    { id: "alertas_metricas", text: "Configura alertas para cambios significativos en métricas clave", requires: ["ga"], category: 'conversion' },
    { id: "checkout_simple", text: "Simplifica el proceso de checkout para reducir abandonos", requires: ["ecom"], category: 'conversion' },
    { id: "envio_minimo", text: "Ofrece envío gratuito con un mínimo de compra", requires: ["ecom"], category: 'conversion' },
    { id: "chat_en_vivo", text: "Implementa chat en vivo para resolver dudas inmediatas", requires: ["helpdesk", "ecom"], category: 'cx' },
    { id: "speed_producto", text: "Optimiza la velocidad de carga de las páginas de producto", requires: ["ga", "ecom"], category: 'conversion' },
    { id: "rend_dispositivo", text: "Analiza el rendimiento por dispositivo y optimiza la experiencia", requires: ["ga"], category: 'analytics' },
    { id: "abandono_carrito", text: "Analiza el comportamiento de abandono de carrito", requires: ["ga", "ecom"], category: 'analytics' },
    { id: "microcopy_cta", text: "Prueba microcopys en CTAs con tests A/B simples", requires: ["ga", "ecom"], category: 'conversion' },

    // Analytics/Valor de cliente
    { id: "productos_rentables", text: "Identifica tus productos más rentables, no solo los más vendidos", requires: ["ecom", "erp"], category: 'analytics' },
    { id: "clv_segmento", text: "Monitorea el CLV por segmento", requires: ["crm", "ga"], category: 'analytics' },
    { id: "segmenta_valor", text: "Segmenta clientes por valor y comportamiento", requires: ["crm", "ga"], category: 'analytics' },
    { id: "predictivo_demanda", text: "Utiliza análisis predictivo para anticipar demanda", requires: ["wms", "erp", "ga"], category: 'analytics' },
    { id: "cohortes_reactivacion", text: "Construye cohortes por primera compra para detectar reactivación", requires: ["ga", "crm"], category: 'analytics' },

    // Inventario/Operaciones
    { id: "auditoria_inventario", text: "Realiza auditorías de inventario regulares", requires: ["wms", "erp"], category: 'inventario' },
    { id: "baja_rotacion", text: "Analiza productos de baja rotación para promociones", requires: ["wms", "erp", "ecom"], category: 'inventario' },
    { id: "stock_seguridad", text: "Optimiza niveles de stock de seguridad por producto", requires: ["wms", "erp"], category: 'inventario' },
    { id: "rfid", text: "Utiliza RFID para seguimiento de inventario", requires: ["wms"], category: 'inventario' },
    { id: "dropshipping_test", text: "Implementa dropshipping para productos de prueba", requires: ["ecom"], category: 'inventario' },
    { id: "lead_times_prov", text: "Ajusta lead times según cumplimiento real de proveedores", requires: ["wms", "erp"], category: 'inventario' },

    // CX/Backoffice
    { id: "gestion_quejas", text: "Implementa un sistema de gestión de quejas eficiente", requires: ["helpdesk"], category: 'cx' },
    { id: "respuestas_rapidas", text: "Activa respuestas rápidas para preguntas frecuentes en chat", requires: ["helpdesk"], category: 'cx' }
  ]
};

/**
 * Mapeo de franjas horarias a texto en español
 */
export const DAYPART_ES: Record<string, string> = {
  morning: "mañana",
  afternoon: "tarde",
  evening: "noche"
};

/**
 * Variaciones de dialectos por palabra clave
 */
export const DIALECT_VARIATIONS = {
  tuteo: {
    v_os_e: "e"  // "¿Quieres...?"
  },
  voseo: {
    v_os_e: "és"  // "¿Querés...?"
  }
};
