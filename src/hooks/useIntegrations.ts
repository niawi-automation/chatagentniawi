/**
 * useIntegrations - Hook para gestionar integraciones disponibles del usuario
 *
 * Este hook maneja:
 * - Estado de integraciones conectadas
 * - Persistencia en localStorage
 * - Detección automática de integraciones (futuro)
 */

import { useState, useEffect, useCallback } from 'react';
import type { Integration, UserIntegrations } from '@/utils/chatHelpers';

const INTEGRATIONS_STORAGE_KEY = 'user-integrations';

/**
 * Hook para gestionar integraciones del usuario
 */
export function useIntegrations(userId?: string) {
  const [integrations, setIntegrations] = useState<UserIntegrations>({
    available: []
  });

  // Cargar integraciones del localStorage al montar
  useEffect(() => {
    if (!userId) return;

    try {
      const key = `${INTEGRATIONS_STORAGE_KEY}-${userId}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        const parsed = JSON.parse(stored) as UserIntegrations;
        setIntegrations(parsed);
      } else {
        // Valores por defecto - todas las integraciones disponibles para pruebas
        // En producción, esto vendría del backend
        const defaultIntegrations: UserIntegrations = {
          available: ['ga', 'ventas', 'crm', 'erp', 'ecom']
        };
        setIntegrations(defaultIntegrations);
        localStorage.setItem(key, JSON.stringify(defaultIntegrations));
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    }
  }, [userId]);

  // Agregar una integración
  const addIntegration = useCallback((integration: Integration) => {
    setIntegrations(prev => {
      if (prev.available.includes(integration)) {
        return prev; // Ya existe
      }

      const updated: UserIntegrations = {
        available: [...prev.available, integration]
      };

      // Persistir
      if (userId) {
        const key = `${INTEGRATIONS_STORAGE_KEY}-${userId}`;
        localStorage.setItem(key, JSON.stringify(updated));
      }

      return updated;
    });
  }, [userId]);

  // Remover una integración
  const removeIntegration = useCallback((integration: Integration) => {
    setIntegrations(prev => {
      const updated: UserIntegrations = {
        available: prev.available.filter(i => i !== integration)
      };

      // Persistir
      if (userId) {
        const key = `${INTEGRATIONS_STORAGE_KEY}-${userId}`;
        localStorage.setItem(key, JSON.stringify(updated));
      }

      return updated;
    });
  }, [userId]);

  // Toggle integración
  const toggleIntegration = useCallback((integration: Integration) => {
    setIntegrations(prev => {
      const exists = prev.available.includes(integration);
      const updated: UserIntegrations = {
        available: exists
          ? prev.available.filter(i => i !== integration)
          : [...prev.available, integration]
      };

      // Persistir
      if (userId) {
        const key = `${INTEGRATIONS_STORAGE_KEY}-${userId}`;
        localStorage.setItem(key, JSON.stringify(updated));
      }

      return updated;
    });
  }, [userId]);

  // Setear todas las integraciones
  const setAllIntegrations = useCallback((newIntegrations: Integration[]) => {
    const updated: UserIntegrations = {
      available: newIntegrations
    };

    setIntegrations(updated);

    // Persistir
    if (userId) {
      const key = `${INTEGRATIONS_STORAGE_KEY}-${userId}`;
      localStorage.setItem(key, JSON.stringify(updated));
    }
  }, [userId]);

  // Verificar si una integración está disponible
  const hasIntegration = useCallback((integration: Integration): boolean => {
    return integrations.available.includes(integration);
  }, [integrations]);

  return {
    integrations,
    addIntegration,
    removeIntegration,
    toggleIntegration,
    setAllIntegrations,
    hasIntegration
  };
}
