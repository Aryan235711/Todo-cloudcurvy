import React from 'react';
import { Cloud, Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
  variant?: 'spinner' | 'cloud' | 'dots';
}

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  message, 
  fullScreen = false,
  variant = 'spinner'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-sky-50 to-white'
    : 'flex items-center justify-center p-4';

  const renderLoader = () => {
    switch (variant) {
      case 'cloud':
        return (
          <div className="flex flex-col items-center gap-4">
            <Cloud 
              size={size === 'sm' ? 32 : size === 'md' ? 48 : 64} 
              className="text-sky-400 animate-bounce" 
            />
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        );
      
      case 'dots':
        return (
          <div className="flex gap-2">
            <div className={`bg-indigo-600 rounded-full animate-bounce ${sizeClasses[size]}`} style={{ animationDelay: '0ms' }} />
            <div className={`bg-indigo-600 rounded-full animate-bounce ${sizeClasses[size]}`} style={{ animationDelay: '150ms' }} />
            <div className={`bg-indigo-600 rounded-full animate-bounce ${sizeClasses[size]}`} style={{ animationDelay: '300ms' }} />
          </div>
        );
      
      default:
        return (
          <Loader2 
            size={size === 'sm' ? 16 : size === 'md' ? 24 : 32} 
            className="text-indigo-600 animate-spin" 
          />
        );
    }
  };

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3">
        {renderLoader()}
        {message && (
          <p className={`font-medium text-slate-600 text-center ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

// Inline loading component for buttons
export const ButtonLoading: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <Loader2 size={size} className="animate-spin" />
);

// Skeleton loading component
export const Skeleton: React.FC<{ 
  className?: string; 
  variant?: 'text' | 'rectangular' | 'circular' 
}> = ({ 
  className = '', 
  variant = 'rectangular' 
}) => {
  const baseClasses = 'animate-pulse bg-slate-200';
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};