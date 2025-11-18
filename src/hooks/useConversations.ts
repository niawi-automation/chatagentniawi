/**
 * useConversations - Hook para gestionar conversaciones del chat
 *
 * Características:
 * - Crear nuevas conversaciones con IDs únicos
 * - Listar conversaciones del usuario
 * - Cargar/guardar mensajes por conversación
 * - Eliminar conversaciones
 * - Generar títulos automáticos basados en el primer mensaje
 * - Aislamiento de conversaciones por usuario (localStorage)
 * - Detección y limpieza al cambiar de usuario
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Conversation, ConversationMetadata } from '@/types/conversation';
import type { Message } from '@/types/agents';

const CONVERSATIONS_STORAGE_KEY = 'chat-conversations';

/**
 * Genera un UUID v4 simple
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Genera un título automático basado en el primer mensaje del usuario
 */
function generateTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.type === 'user');
  if (!firstUserMessage) return 'Nueva conversación';

  // Tomar las primeras 50 caracteres del mensaje
  const preview = firstUserMessage.content.trim().slice(0, 50);
  return preview.length < firstUserMessage.content.trim().length
    ? `${preview}...`
    : preview;
}

/**
 * Limpia conversaciones del usuario hardcodeado anterior
 * Se ejecuta una sola vez al iniciar la aplicación
 */
function cleanupOldConversations(): void {
  try {
    // IDs de usuarios hardcodeados que deben limpiarse
    const oldUserIds = ['1', 'anonymous'];

    oldUserIds.forEach(oldId => {
      const key = `${CONVERSATIONS_STORAGE_KEY}-${oldId}`;
      const exists = localStorage.getItem(key);

      if (exists) {
        localStorage.removeItem(key);
        console.log(`🧹 Conversaciones antiguas eliminadas para usuario: ${oldId}`);
      }
    });
  } catch (error) {
    console.error('Error al limpiar conversaciones antiguas:', error);
  }
}

/**
 * Hook principal de conversaciones
 */
export function useConversations(userId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Referencia para trackear el userId anterior
  const previousUserIdRef = useRef<string | null>(null);

  // Referencia para ejecutar cleanup solo una vez
  const cleanupExecutedRef = useRef(false);

  // Limpiar conversaciones antiguas del usuario hardcodeado (solo una vez)
  useEffect(() => {
    if (!cleanupExecutedRef.current) {
      cleanupOldConversations();
      cleanupExecutedRef.current = true;
    }
  }, []);

  // Detectar cambio de usuario y resetear estado
  useEffect(() => {
    const previousUserId = previousUserIdRef.current;

    // Si cambió el userId (y no es la primera carga)
    if (previousUserId !== null && previousUserId !== userId) {
      console.log(`🔄 Cambio de usuario detectado: ${previousUserId} → ${userId}`);

      // Resetear estado de conversaciones
      setConversations([]);
      setCurrentConversationId(null);

      console.log('✨ Estado de conversaciones reseteado');
    }

    // Actualizar referencia del userId anterior
    previousUserIdRef.current = userId;
  }, [userId]);

  // Cargar conversaciones del localStorage al montar o cambiar usuario
  useEffect(() => {
    loadConversations();
  }, [userId]);

  /**
   * Cargar todas las conversaciones del usuario desde localStorage
   */
  const loadConversations = useCallback(() => {
    try {
      const key = `${CONVERSATIONS_STORAGE_KEY}-${userId}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        // Convertir strings de fechas a objetos Date
        const conversationsWithDates = parsed.map(conv => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(conversationsWithDates);

        // Si no hay conversación actual, crear una nueva
        if (!currentConversationId && conversationsWithDates.length === 0) {
          createNewConversation();
        } else if (!currentConversationId && conversationsWithDates.length > 0) {
          // Seleccionar la más reciente
          const mostRecent = conversationsWithDates.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
          )[0];
          setCurrentConversationId(mostRecent.id);
        }
      } else {
        // Primera vez, crear conversación inicial
        createNewConversation();
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      createNewConversation();
    }
  }, [userId, currentConversationId]);

  /**
   * Guardar conversaciones en localStorage
   */
  const saveConversations = useCallback((convs: Conversation[]) => {
    try {
      const key = `${CONVERSATIONS_STORAGE_KEY}-${userId}`;
      localStorage.setItem(key, JSON.stringify(convs));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }, [userId]);

  /**
   * Crear una nueva conversación
   */
  const createNewConversation = useCallback((): string => {
    const newId = generateUUID();
    const newConversation: Conversation = {
      id: newId,
      title: 'Nueva conversación',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      userId
    };

    setConversations(prev => {
      const updated = [...prev, newConversation];
      saveConversations(updated);
      return updated;
    });

    setCurrentConversationId(newId);
    return newId;
  }, [userId, saveConversations]);

  /**
   * Eliminar una conversación
   */
  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== conversationId);
      saveConversations(updated);

      // Si eliminamos la conversación actual, cambiar a otra o crear nueva
      if (conversationId === currentConversationId) {
        if (updated.length > 0) {
          const mostRecent = updated.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
          )[0];
          setCurrentConversationId(mostRecent.id);
        } else {
          // No hay más conversaciones, crear una nueva
          setTimeout(() => createNewConversation(), 0);
        }
      }

      return updated;
    });
  }, [currentConversationId, saveConversations, createNewConversation]);

  /**
   * Actualizar mensajes de una conversación
   */
  const updateConversationMessages = useCallback((conversationId: string, messages: Message[]) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages,
            updatedAt: new Date(),
            // Actualizar título si es la primera vez que se agregan mensajes
            title: conv.messages.length === 0 && messages.length > 0
              ? generateTitle(messages)
              : conv.title
          };
        }
        return conv;
      });
      saveConversations(updated);
      return updated;
    });
  }, [saveConversations]);

  /**
   * Cambiar de conversación
   */
  const switchConversation = useCallback((conversationId: string) => {
    const exists = conversations.find(c => c.id === conversationId);
    if (exists) {
      setCurrentConversationId(conversationId);
    }
  }, [conversations]);

  /**
   * Obtener la conversación actual
   */
  const getCurrentConversation = useCallback((): Conversation | null => {
    if (!currentConversationId) return null;
    return conversations.find(c => c.id === currentConversationId) || null;
  }, [currentConversationId, conversations]);

  /**
   * Obtener metadata de todas las conversaciones (para listar)
   */
  const getConversationsMetadata = useCallback((): ConversationMetadata[] => {
    return conversations
      .map(conv => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messages.length,
        preview: conv.messages.length > 0
          ? conv.messages[conv.messages.length - 1].content.slice(0, 60)
          : undefined
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()); // Más recientes primero
  }, [conversations]);

  /**
   * Renombrar una conversación
   */
  const renameConversation = useCallback((conversationId: string, newTitle: string) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, title: newTitle, updatedAt: new Date() };
        }
        return conv;
      });
      saveConversations(updated);
      return updated;
    });
  }, [saveConversations]);

  return {
    // Estado
    conversations,
    currentConversationId,

    // Acciones
    createNewConversation,
    deleteConversation,
    switchConversation,
    updateConversationMessages,
    renameConversation,

    // Getters
    getCurrentConversation,
    getConversationsMetadata
  };
}
