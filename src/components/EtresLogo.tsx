import React from 'react';
import EtresBrandSvg from '@/assets/images/etres-brand.svg';

interface EtresLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const EtresLogo: React.FC<EtresLogoProps> = ({ size = 'md', showText = true }) => {
  const logoSizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };

  return (
    <div className="flex items-center gap-3">
      <img 
        src={EtresBrandSvg} 
        alt="E.tres Agent" 
        className={`${logoSizes[size]} w-auto`}
      />
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-foreground">E.tres Agent</span>
          <span className="text-xs text-muted-foreground">EMA: Copiloto Inteligente</span>
        </div>
      )}
    </div>
  );
};

export default EtresLogo;

