/**
 * Tipos para el sistema de conversaciones del chat
 */

import type { Message } from './agents';

/**
 * Conversación individual
 */
export interface Conversation {
  id: string; // UUID único de la conversación
  title: string; // Título generado automáticamente o por el usuario
  createdAt: Date; // Fecha de creación
  updatedAt: Date; // Última actualización
  messages: Message[]; // Historial de mensajes
  userId: string; // ID del usuario dueño
}

/**
 * Metadata de conversación (para listar)
 */
export interface ConversationMetadata {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  preview?: string; // Último mensaje como preview
}
