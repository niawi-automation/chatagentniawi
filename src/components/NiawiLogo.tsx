import React from 'react';

interface NiawiLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const NiawiLogo: React.FC<NiawiLogoProps> = ({ size = 'md', showText = true }) => {
  const logoSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center gap-3">
      {/* Niawi Logo - Modern geometric design */}
      <div className={`${logoSizes[size]} flex items-center justify-center relative`}>
        <div className="absolute inset-0 bg-gradient-to-br from-niawi-primary via-niawi-accent to-niawi-secondary rounded-lg transform rotate-3"></div>
        <div className="relative bg-white dark:bg-gray-900 rounded-lg w-full h-full flex items-center justify-center font-bold text-niawi-primary">
          <span className={`${size === 'lg' ? 'text-lg' : size === 'md' ? 'text-base' : 'text-sm'} font-bold`}>N</span>
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-foreground">Copiloto Niawi</span>
          <span className="text-xs text-muted-foreground">Niawi Tech</span>
        </div>
      )}
    </div>
  );
};

export default NiawiLogo;
