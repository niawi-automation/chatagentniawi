/**
 * LoadingInsights - Tips accionables rotativos durante la carga
 *
 * Características:
 * - Aparece a los 3s de iniciar la carga
 * - Rotación cada 7s
 * - Máximo 5 tips por request
 * - Anti-flicker: sostiene 1.2s antes de ocultar
 * - Gating por integraciones
 * - Cooldown para evitar repeticiones (N=20)
 * - Animaciones suaves
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lightbulb, TrendingUp } from 'lucide-react';
import { CHAT_CONTENT } from '@/constants/chatContent';
import {
  selectLoadingTips,
  loadUserHistory,
  saveUserHistory,
  updateHistory,
  type UserIntegrations
} from '@/utils/chatHelpers';
import type { LoadingTip } from '@/constants/chatContent';

interface LoadingInsightsProps {
  isLoading: boolean;
  userId: string;
  integrations: UserIntegrations;
  className?: string;
}

/**
 * Componente de Loading Insights
 */
const LoadingInsights: React.FC<LoadingInsightsProps> = ({
  isLoading,
  userId,
  integrations,
  className = ''
}) => {
  const [visible, setVisible] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [selectedTips, setSelectedTips] = useState<LoadingTip[]>([]);
  const [isExiting, setIsExiting] = useState(false);

  const initialDelayTimer = useRef<NodeJS.Timeout | null>(null);
  const rotationTimer = useRef<NodeJS.Timeout | null>(null);
  const exitTimer = useRef<NodeJS.Timeout | null>(null);

  // Seleccionar tips cuando inicia la carga
  useEffect(() => {
    if (isLoading) {
      // Seleccionar tips con gating y cooldown
      const history = loadUserHistory(userId);
      const tips = selectLoadingTips(
        CHAT_CONTENT.loadingTips,
        integrations,
        history,
        userId,
        5 // Máximo 5 tips
      );
      setSelectedTips(tips);
      setCurrentTipIndex(0);
      setIsExiting(false);

      // Mostrar después de 3 segundos
      initialDelayTimer.current = setTimeout(() => {
        setVisible(true);
      }, 3000);

      // Actualizar historial
      const updatedHistory = {
        ...history,
        lastTips: updateHistory(
          history.lastTips,
          tips.map(t => t.id),
          20
        )
      };
      saveUserHistory(userId, updatedHistory);

      // Tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'loading_tips_shown', {
          tip_count: tips.length,
          request_start: new Date().toISOString()
        });
      }
    }

    return () => {
      if (initialDelayTimer.current) {
        clearTimeout(initialDelayTimer.current);
      }
    };
  }, [isLoading, userId, integrations]);

  // Rotación de tips cada 7 segundos
  useEffect(() => {
    if (visible && selectedTips.length > 1) {
      rotationTimer.current = setInterval(() => {
        setCurrentTipIndex(prev => (prev + 1) % selectedTips.length);
      }, 7000);

      return () => {
        if (rotationTimer.current) {
          clearInterval(rotationTimer.current);
        }
      };
    }
  }, [visible, selectedTips.length]);

  // Anti-flicker: sostener 1.2s antes de ocultar
  useEffect(() => {
    if (!isLoading && visible) {
      setIsExiting(true);

      exitTimer.current = setTimeout(() => {
        setVisible(false);
        setIsExiting(false);
        setCurrentTipIndex(0);
        setSelectedTips([]);
      }, 1200);

      return () => {
        if (exitTimer.current) {
          clearTimeout(exitTimer.current);
        }
      };
    }
  }, [isLoading, visible]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (initialDelayTimer.current) clearTimeout(initialDelayTimer.current);
      if (rotationTimer.current) clearInterval(rotationTimer.current);
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, []);

  if (!visible || selectedTips.length === 0) {
    return null;
  }

  const currentTip = selectedTips[currentTipIndex];

  return (
    <div
      className={`${className} ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-niawi-accent/10 via-niawi-primary/10 to-niawi-accent/10 border border-niawi-border/30">
        {/* Icono animado */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="relative">
            <Lightbulb className="w-5 h-5 text-niawi-accent animate-pulse-slow" />
            <TrendingUp className="w-3 h-3 text-niawi-primary absolute -top-1 -right-1 animate-bounce" />
          </div>
        </div>

        {/* Contenido del tip */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-niawi-accent uppercase tracking-wide">
              Insight accionable
            </span>
            {selectedTips.length > 1 && (
              <span className="text-xs text-muted-foreground">
                {currentTipIndex + 1}/{selectedTips.length}
              </span>
            )}
          </div>

          {/* Texto del tip con animación de cambio */}
          <p
            key={currentTip.id}
            className="text-sm text-foreground leading-relaxed animate-slide-in-right"
          >
            {currentTip.text}
          </p>

          {/* Categoría del tip */}
          {currentTip.category && (
            <span className="inline-block mt-2 text-xs text-muted-foreground/70 capitalize">
              #{currentTip.category}
            </span>
          )}
        </div>

        {/* Indicador de progreso (si hay múltiples tips) */}
        {selectedTips.length > 1 && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            {selectedTips.map((_, index) => (
              <div
                key={index}
                className={`w-1 h-1 rounded-full transition-all duration-500 ${
                  index === currentTipIndex
                    ? 'bg-niawi-accent w-1.5 h-1.5'
                    : 'bg-niawi-border/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Barra de progreso de rotación */}
      {selectedTips.length > 1 && (
        <div className="mt-2 h-0.5 bg-niawi-border/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-niawi-accent to-niawi-primary animate-progress-bar"
            style={{
              animation: 'progressBar 7s linear infinite'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(LoadingInsights);
