/**
 * SuggestedQuestions - Preguntas sugeridas con gating y seeding
 *
 * Características:
 * - Selección automática según integraciones disponibles
 * - Cooldown para evitar repeticiones
 * - Diseño responsive (2 móvil, 3 desktop)
 * - Animaciones suaves en hover
 * - Tracking de clics
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { CHAT_CONTENT } from '@/constants/chatContent';
import {
  selectSuggestedQuestions,
  loadUserHistory,
  saveUserHistory,
  updateHistory,
  type UserIntegrations
} from '@/utils/chatHelpers';
import type { ChatQuestion } from '@/constants/chatContent';

interface SuggestedQuestionsProps {
  userId: string;
  integrations: UserIntegrations;
  onQuestionClick: (question: string, questionId: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Componente de preguntas sugeridas
 */
const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  userId,
  integrations,
  onQuestionClick,
  isLoading = false,
  className = ''
}) => {
  // Estado para forzar re-render y obtener nuevas preguntas aleatorias
  const [refreshKey, setRefreshKey] = useState(0);

  // Forzar nueva selección en cada montaje del componente
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Seleccionar preguntas con gating - SIN cooldown para que cambien en cada refresh
  const selectedQuestions = useMemo(() => {
    // No usar historial para permitir rotación libre
    const emptyHistory = { lastQuestions: [], lastTips: [], lastUpdate: new Date().toISOString() };
    return selectSuggestedQuestions(
      CHAT_CONTENT.questions,
      integrations,
      emptyHistory,
      userId + refreshKey // Agregar refreshKey para forzar nuevas selecciones
    );
  }, [userId, integrations, refreshKey]); // Se recalcula cuando cambia refreshKey

  // Manejar clic en pregunta
  const handleQuestionClick = useCallback((question: ChatQuestion) => {
    if (isLoading) return;

    // Actualizar historial
    const history = loadUserHistory(userId);
    const updatedHistory = {
      ...history,
      lastQuestions: updateHistory(history.lastQuestions, [question.id], 5)
    };
    saveUserHistory(userId, updatedHistory);

    // Tracking de telemetría (se puede extender)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'question_click', {
        question_id: question.id,
        question_text: question.text,
        category: question.category
      });
    }

    // Callback al padre
    onQuestionClick(question.text, question.id);
  }, [userId, isLoading, onQuestionClick]);

  if (selectedQuestions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header de sección */}
      <div className="flex items-center justify-center gap-2 text-base text-muted-foreground">
        <Zap className="w-5 h-5 text-niawi-accent" />
        <span>Sugerencias para comenzar</span>
      </div>

      {/* Grid de preguntas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {selectedQuestions.map((question, index) => (
          <button
            key={question.id}
            onClick={() => handleQuestionClick(question)}
            disabled={isLoading}
            className="group relative text-left p-5 rounded-xl border border-niawi-border bg-niawi-border/10
                     hover:bg-niawi-border/20 hover:border-niawi-primary/30 hover:scale-[1.02]
                     transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-niawi-primary focus:ring-offset-2"
            aria-label={`Pregunta sugerida: ${question.text}`}
          >
            {/* Efecto de brillo en hover */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-niawi-primary/5 to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Contenido */}
            <div className="relative flex items-start gap-3">
              <Zap className="w-5 h-5 text-niawi-accent flex-shrink-0 mt-0.5
                            group-hover:text-niawi-primary transition-colors" />
              <span className="text-base text-foreground leading-relaxed">
                {question.text}
              </span>
            </div>

            {/* Indicador de categoría (sutil) */}
            {question.category && (
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-muted-foreground capitalize">
                  {question.category}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Hint sutil */}
      <p className="text-center text-xs text-muted-foreground/60">
        Las sugerencias cambian en cada actualización
      </p>
    </div>
  );
};

export default React.memo(SuggestedQuestions);
