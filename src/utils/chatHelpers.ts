/**
 * Chat Helpers - Utilidades para selección dinámica de contenidos
 *
 * Incluye:
 * - Gating por integraciones disponibles
 * - Seeding para selección determinista
 * - Cooldown para evitar repeticiones
 * - Detección de franja horaria
 * - Reemplazo de placeholders
 */

import type { ChatQuestion, LoadingTip } from '@/constants/chatContent';

/**
 * Tipo de integración disponible en el sistema
 */
export type Integration =
  | 'ga'
  | 'ventas'
  | 'crm'
  | 'erp'
  | 'contable'
  | 'inventario'
  | 'wms'
  | 'ops'
  | 'ecom'
  | 'helpdesk';

/**
 * Franja horaria del día
 */
export type Daypart = 'morning' | 'afternoon' | 'evening';

/**
 * Configuración de integraciones del usuario
 */
export interface UserIntegrations {
  available: Integration[];
}

/**
 * Historia de elementos mostrados al usuario (para cooldown)
 */
export interface UserHistory {
  lastQuestions: string[]; // IDs de últimas preguntas vistas
  lastTips: string[]; // IDs de últimos tips vistos
  lastUpdate: string; // Fecha de última actualización
}

/**
 * Simple hash de string a número (para seeding)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Genera un seed determinista basado en userId + fecha
 */
export function generateSeed(userId: string, date: Date = new Date()): number {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return hashString(`${userId}-${dateStr}`);
}

/**
 * Selección seeded (determinista) de un elemento de un array
 */
export function seededPick<T>(items: T[], seed: number): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  const index = seed % items.length;
  return items[index];
}

/**
 * Selección seeded de N elementos únicos de un array
 */
export function seededPickMultiple<T>(items: T[], count: number, seed: number): T[] {
  if (items.length === 0) return [];
  if (count >= items.length) return [...items];

  const results: T[] = [];
  const available = [...items];

  for (let i = 0; i < count && available.length > 0; i++) {
    const localSeed = seed + i;
    const index = localSeed % available.length;
    results.push(available[index]);
    available.splice(index, 1);
  }

  return results;
}

/**
 * Selección verdaderamente aleatoria de N elementos únicos de un array
 * Usa Math.random() en lugar de seeding para rotación real
 */
export function randomPickMultiple<T>(items: T[], count: number): T[] {
  if (items.length === 0) return [];
  if (count >= items.length) return [...items];

  const results: T[] = [];
  const available = [...items];

  for (let i = 0; i < count && available.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    results.push(available[randomIndex]);
    available.splice(randomIndex, 1);
  }

  return results;
}

/**
 * Verifica si un item cumple con los requisitos de integración
 *
 * Formato de requires:
 * - [] = siempre disponible
 * - ["ga"] = requiere GA
 * - ["ga", "ventas"] = requiere GA O ventas (operador OR implícito)
 *
 * @param requires Array de integraciones requeridas
 * @param available Integraciones disponibles del usuario
 */
export function requiresOK(requires: string[], available: Integration[]): boolean {
  // Si no requiere nada, siempre está disponible
  if (requires.length === 0) return true;

  // Si requiere algo pero no hay integraciones disponibles, no está disponible
  if (available.length === 0) return false;

  // Operador OR: al menos una de las requeridas debe estar disponible
  return requires.some(req => available.includes(req as Integration));
}

/**
 * Filtra items aplicando gating por integraciones
 */
export function applyGating<T extends { requires: string[] }>(
  items: T[],
  integrations: UserIntegrations
): T[] {
  return items.filter(item => requiresOK(item.requires, integrations.available));
}

/**
 * Aplica cooldown: elimina items que fueron vistos recientemente
 *
 * @param items Items a filtrar
 * @param history IDs de items vistos recientemente
 * @param maxHistory Número de items recientes a recordar
 */
export function applyCooldown<T extends { id: string }>(
  items: T[],
  history: string[],
  maxHistory: number = 5
): T[] {
  const recentIds = new Set(history.slice(-maxHistory));
  return items.filter(item => !recentIds.has(item.id));
}

/**
 * Determina la franja horaria según la hora local del usuario
 */
export function getDaypart(date: Date = new Date(), timezone?: string): Daypart {
  let hour: number;

  if (timezone) {
    try {
      // Usar timezone específico si se proporciona
      const dateStr = date.toLocaleString('en-US', { timeZone: timezone, hour12: false });
      const match = dateStr.match(/(\d{1,2}):(\d{2}):(\d{2})/);
      hour = match ? parseInt(match[1], 10) : date.getHours();
    } catch {
      // Fallback a hora local si timezone no es válido
      hour = date.getHours();
    }
  } else {
    hour = date.getHours();
  }

  if (hour >= 5 && hour < 12) return 'morning';    // 5:00 - 11:59
  if (hour >= 12 && hour < 19) return 'afternoon'; // 12:00 - 18:59
  return 'evening';                                 // 19:00 - 4:59
}

/**
 * Reemplaza placeholders en un string con valores reales
 *
 * Placeholders soportados:
 * - {agentBrand} → nombre del agente
 * - {daypart_es} → franja horaria en español
 * - {v_os_e} → variación de voseo (e/és)
 */
export function replacePlaceholders(
  text: string,
  params: {
    agentBrand?: string;
    daypart?: Daypart;
    spanishVariant?: 'tuteo' | 'voseo';
  }
): string {
  let result = text;

  if (params.agentBrand) {
    result = result.replace(/\{agentBrand\}/g, params.agentBrand);
  }

  if (params.daypart) {
    const daypartMap: Record<Daypart, string> = {
      morning: 'mañana',
      afternoon: 'tarde',
      evening: 'noche'
    };
    result = result.replace(/\{daypart_es\}/g, daypartMap[params.daypart]);
  }

  if (params.spanishVariant) {
    const voseoPart = params.spanishVariant === 'voseo' ? 'és' : 'e';
    result = result.replace(/\{v_os_e\}/g, voseoPart);
  }

  return result;
}

/**
 * Cuenta cuántas preguntas mostrar según el breakpoint
 */
export function getQuestionCountByBreakpoint(): number {
  if (typeof window === 'undefined') return 3;

  const width = window.innerWidth;

  if (width < 768) return 2;        // Móvil: 2 preguntas
  if (width >= 768 && width < 1280) return 3; // Tablet/Desktop medio: 3
  return 3; // Desktop ancho: 3 (podría ser 4 si pasas gating estricto)
}

/**
 * Actualiza el historial de un usuario agregando nuevos IDs
 */
export function updateHistory(
  currentHistory: string[],
  newIds: string[],
  maxHistory: number
): string[] {
  const updated = [...currentHistory, ...newIds];
  // Mantener solo los últimos N elementos
  return updated.slice(-maxHistory);
}

/**
 * Carga el historial del usuario desde localStorage
 */
export function loadUserHistory(userId: string): UserHistory {
  const key = `chat-history-${userId}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user history:', error);
  }

  // Historial por defecto
  return {
    lastQuestions: [],
    lastTips: [],
    lastUpdate: new Date().toISOString()
  };
}

/**
 * Guarda el historial del usuario en localStorage
 */
export function saveUserHistory(userId: string, history: UserHistory): void {
  const key = `chat-history-${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify({
      ...history,
      lastUpdate: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error saving user history:', error);
  }
}

/**
 * Selecciona preguntas sugeridas aplicando gating, cooldown y seeding
 */
export function selectSuggestedQuestions(
  questions: ChatQuestion[],
  integrations: UserIntegrations,
  userHistory: UserHistory,
  userId: string,
  count?: number
): ChatQuestion[] {
  // 1. Aplicar gating
  let pool = applyGating(questions, integrations);

  // 2. Aplicar cooldown (N=5 para preguntas)
  pool = applyCooldown(pool, userHistory.lastQuestions, 5);

  // 3. Si el pool quedó vacío, usar fallbacks neutrales
  if (pool.length === 0) {
    pool = questions.filter(q => q.requires.length === 0);
  }

  // 4. Determinar cantidad a mostrar
  const visibleCount = count ?? getQuestionCountByBreakpoint();

  // 5. Selección seeded
  const seed = generateSeed(userId);
  return seededPickMultiple(pool, visibleCount, seed);
}

/**
 * Selecciona preguntas sugeridas con rotación real (aleatorio verdadero)
 * Usa Math.random() para que cambien en cada refresh
 */
export function selectSuggestedQuestionsRandom(
  questions: ChatQuestion[],
  integrations: UserIntegrations,
  userHistory: UserHistory,
  count?: number
): ChatQuestion[] {
  // 1. Aplicar gating
  let pool = applyGating(questions, integrations);

  // 2. Aplicar cooldown ligero (N=3 para permitir más variedad)
  pool = applyCooldown(pool, userHistory.lastQuestions, 3);

  // 3. Si el pool quedó vacío, usar fallbacks neutrales
  if (pool.length === 0) {
    pool = questions.filter(q => q.requires.length === 0);
  }

  // Si aún está vacío, usar todas las preguntas
  if (pool.length === 0) {
    pool = questions;
  }

  // 4. Determinar cantidad a mostrar
  const visibleCount = count ?? getQuestionCountByBreakpoint();

  // 5. Selección aleatoria verdadera
  return randomPickMultiple(pool, visibleCount);
}

/**
 * Selecciona loading tips aplicando gating, cooldown y seeding
 */
export function selectLoadingTips(
  tips: LoadingTip[],
  integrations: UserIntegrations,
  userHistory: UserHistory,
  userId: string,
  maxTips: number = 5
): LoadingTip[] {
  // 1. Aplicar gating
  let pool = applyGating(tips, integrations);

  // 2. Aplicar cooldown (N=20 para tips)
  pool = applyCooldown(pool, userHistory.lastTips, 20);

  // 3. Si el pool quedó vacío, usar todos (mejor algo que nada)
  if (pool.length === 0) {
    pool = tips;
  }

  // 4. Selección seeded limitada a maxTips
  const seed = generateSeed(userId);
  return seededPickMultiple(pool, Math.min(maxTips, pool.length), seed);
}
