import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dots' | 'circle' | 'pulse';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'circle',
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className={`${sizeClasses[size]} bg-niawi-primary rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`${sizeClasses[size]} bg-niawi-primary rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`${sizeClasses[size]} bg-niawi-primary rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} bg-niawi-primary rounded-full animate-pulse-slow`}></div>
        );
      
      case 'circle':
      default:
        return (
          <div className={`${sizeClasses[size]} border-2 border-niawi-border border-t-niawi-primary rounded-full animate-spin`}></div>
        );
    }
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      {renderSpinner()}
    </div>
  );
};

export default LoadingSpinner;




