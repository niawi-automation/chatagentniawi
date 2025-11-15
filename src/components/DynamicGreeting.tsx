/**
 * DynamicGreeting - Saludo dinámico personalizado
 *
 * Características:
 * - Saludo según franja horaria (mañana/tarde/noche)
 * - Personalización por nombre de usuario
 * - Header y subheader rotativos con seeding
 * - Animaciones suaves y profesionales
 * - Responsive design
 */

import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { CHAT_CONTENT, DAYPART_ES } from '@/constants/chatContent';
import {
  getDaypart,
  generateSeed,
  seededPick,
  replacePlaceholders,
  type Daypart
} from '@/utils/chatHelpers';

interface DynamicGreetingProps {
  userName?: string;
  userId: string;
  agentIcon?: React.ComponentType<{ className?: string }>;
  agentColor?: string;
  agentBgColor?: string;
  className?: string;
}

/**
 * Obtiene el saludo base según la franja horaria
 */
function getGreetingByDaypart(daypart: Daypart): string {
  const greetings: Record<Daypart, string> = {
    morning: 'Buenos días',
    afternoon: 'Buenas tardes',
    evening: 'Buenas noches'
  };
  return greetings[daypart];
}

/**
 * Componente de saludo dinámico
 */
const DynamicGreeting: React.FC<DynamicGreetingProps> = ({
  userName,
  userId,
  agentIcon: AgentIcon = Sparkles,
  agentColor = 'text-green-600',
  agentBgColor = 'bg-green-500/10',
  className = ''
}) => {
  // Calcular franja horaria y contenidos dinámicos - SE RECALCULA EN CADA RENDER
  const { daypart, greeting, header, subheader } = useMemo(() => {
    const now = new Date();
    const currentDaypart = getDaypart(now);
    // Usar timestamp completo para seed aleatorio en cada refresh
    const seed = Math.floor(Math.random() * 1000000);

    // Seleccionar header según franja horaria
    const daypartHeaders = CHAT_CONTENT.meta.daypartRules[currentDaypart];
    const headerKey = seededPick(daypartHeaders, seed);
    const rawHeader = CHAT_CONTENT.headers[headerKey] || CHAT_CONTENT.headers.impacto_ahora;

    // Seleccionar subheader (50% probabilidad de mostrar)
    const showSubheader = seed % 2 === 0;
    const rawSubheader = showSubheader
      ? seededPick(CHAT_CONTENT.subheaders, seed + 1)
      : null;

    // Reemplazar placeholders
    const processedHeader = replacePlaceholders(rawHeader, {
      agentBrand: CHAT_CONTENT.meta.agentBrand,
      daypart: currentDaypart,
      spanishVariant: CHAT_CONTENT.meta.spanishVariant
    });

    const processedSubheader = rawSubheader
      ? replacePlaceholders(rawSubheader, {
          agentBrand: CHAT_CONTENT.meta.agentBrand
        })
      : null;

    return {
      daypart: currentDaypart,
      greeting: getGreetingByDaypart(currentDaypart),
      header: processedHeader,
      subheader: processedSubheader
    };
  }); // Sin dependencies = recalcula en cada render

  // Nombre del usuario (primer nombre)
  const firstName = userName?.split(' ')[0] || '';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Icono del agente */}
      <div className="flex justify-center">
        <div className={`inline-flex p-4 rounded-2xl ${agentBgColor}`}>
          <AgentIcon className={`w-12 h-12 ${agentColor}`} />
        </div>
      </div>

      {/* Saludo principal */}
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-center">
          {greeting}
          {firstName && `, ${firstName}`}! 👋
        </h1>

        {/* Header dinámico */}
        <p className="text-lg md:text-xl text-muted-foreground text-center max-w-3xl mx-auto">
          {header}
        </p>

        {/* Subheader opcional */}
        {subheader && (
          <p className="text-sm md:text-base text-muted-foreground/80 text-center max-w-2xl mx-auto">
            {subheader}
          </p>
        )}
      </div>

      {/* Badge de franja horaria (sutil) */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/20 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span>{DAYPART_ES[daypart]}</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DynamicGreeting);
