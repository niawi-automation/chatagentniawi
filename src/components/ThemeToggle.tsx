import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = false 
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 ${className}`}>
            {showLabel && (
              <span className="text-sm text-muted-foreground">
                {isDark ? 'Modo Oscuro' : 'Modo Claro'}
              </span>
            )}
            <div className="flex items-center gap-2 p-1 rounded-lg bg-niawi-border/30 hover:bg-niawi-border/50 transition-all duration-200">
              <Sun className={`w-4 h-4 transition-all duration-300 ${
                isDark ? 'text-muted-foreground opacity-50' : 'text-niawi-warning'
              }`} />
              <Switch
                checked={isDark}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-niawi-primary data-[state=unchecked]:bg-niawi-warning"
              />
              <Moon className={`w-4 h-4 transition-all duration-300 ${
                isDark ? 'text-niawi-primary' : 'text-muted-foreground opacity-50'
              }`} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Alternar entre modo claro y oscuro</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ThemeToggle;
