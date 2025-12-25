
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, Key, Library, RotateCcw, Bell, Grid3X3, Settings, Database } from 'lucide-react';
import { APP_TITLE } from '../../constants';

interface HeaderProps {
  onShowOnboarding: () => void;
  onOpenSettings: () => void;
  onOpenLibrary: () => void;
  onOpenNeuralNudge: () => void;
  hasApiKey: boolean;
  templatesCount: number;
  motivation: string;
  neuralNudgeData?: {
    procrastinationRisk: 'low' | 'medium' | 'high';
    engagementScore: number;
    isActive: boolean;
  };
}

export const Header: React.FC<HeaderProps> = ({
  onShowOnboarding,
  onOpenSettings,
  onOpenLibrary,
  onOpenNeuralNudge,
  hasApiKey,
  templatesCount,
  motivation,
  neuralNudgeData
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleActionClick = (action: () => void) => {
    action();
    setIsExpanded(false); // Close menu after action
  };

  // Track state changes
  useEffect(() => {
    // Silent state tracking in production
  }, [isExpanded, isMobile]);
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-rose-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-emerald-500';
      default: return 'text-slate-400';
    }
  };

  const getRiskDotColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };
  return (
    <header className="mb-12 text-center flex flex-col items-center relative w-full">
      <div className="absolute left-0 top-0">
         <button onClick={onShowOnboarding} className="p-3.5 liquid-glass-dark rounded-2xl text-slate-400 hover:text-sky-500 transition-all active:scale-95 curvy-btn shadow-sm" aria-label="Restart Onboarding">
           <Info size={24} />
         </button>
      </div>
      <div className="absolute right-0 top-0 flex gap-2">
        {isMobile ? (
          // Mobile: Expandable Menu
          <div className="relative">
            <button 
              onClick={toggleExpanded}
              className="p-3.5 liquid-glass-dark rounded-2xl text-slate-600 hover:text-sky-500 transition-all active:scale-95 curvy-btn shadow-sm"
              aria-label="Menu"
            >
              <Grid3X3 size={24} />
            </button>
            
            {/* Always render menu for smooth animations */}
            <div 
              className={`absolute right-0 top-16 flex flex-col gap-3 z-50 transition-all duration-500 ease-out ${
                isExpanded 
                  ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
                  : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
              }`}
            />
            
            {/* Portal Menu - Renders at document.body level above backdrop */}
            {typeof window !== 'undefined' && (() => {
              return createPortal(
                <div 
                  className={`fixed top-20 right-4 flex flex-col gap-3 z-40 transition-all duration-500 ease-out ${
                    isExpanded 
                      ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
                      : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
                  }`}
                >
                  <button 
                    onClick={() => handleActionClick(onOpenNeuralNudge)}
                    className={`group p-3.5 liquid-glass-dark rounded-2xl transition-all hover:scale-105 active:scale-95 curvy-btn shadow-xl relative ${
                      neuralNudgeData ? getRiskColor(neuralNudgeData.procrastinationRisk) : 'text-slate-400'
                    } ${
                      neuralNudgeData?.procrastinationRisk === 'high' ? 'animate-pulse' : ''
                    } ${
                      isExpanded 
                        ? 'opacity-100 translate-y-0 delay-100' 
                        : 'opacity-0 -translate-y-2 delay-0'
                    }`}
                  >
                    <Bell size={24} />
                    {neuralNudgeData && (
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                        getRiskDotColor(neuralNudgeData.procrastinationRisk)
                      } ${
                        neuralNudgeData.isActive ? 'animate-pulse' : ''
                      }`} />
                    )}
                  </button>
                  
                  <button 
                    onClick={() => handleActionClick(onOpenSettings)}
                    className={`p-3.5 liquid-glass-dark rounded-2xl text-slate-600 hover:text-indigo-600 transition-all hover:scale-105 active:scale-95 curvy-btn shadow-xl ${
                      isExpanded 
                        ? 'opacity-100 translate-y-0 delay-200' 
                        : 'opacity-0 -translate-y-2 delay-0'
                    }`}
                  >
                    <Settings size={24} />
                  </button>
                  
                  <button 
                    onClick={() => handleActionClick(onOpenLibrary)}
                    className={`p-3.5 liquid-glass-dark rounded-2xl text-sky-600 hover:text-sky-700 transition-all hover:scale-105 active:scale-95 curvy-btn shadow-xl relative ${
                      isExpanded 
                        ? 'opacity-100 translate-y-0 delay-300' 
                        : 'opacity-0 -translate-y-2 delay-0'
                    }`}
                  >
                    <Library size={24} />
                    {templatesCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-black shadow-lg">
                        {templatesCount}
                      </span>
                    )}
                  </button>
                </div>,
                document.body
              );
            })()}
            
            {/* Portal Backdrop - Renders at document.body level */}
            {isExpanded && typeof window !== 'undefined' && (() => {
              return createPortal(
                <div 
                  className="fixed inset-0 bg-black/40 backdrop-blur-md z-30"
                  onClick={() => {
                    setIsExpanded(false);
                  }}
                  style={{
                    transition: 'all 300ms ease-out'
                  }}
                />,
                document.body
              );
            })()}
          </div>
        ) : (
          // Desktop: Original Layout
          <>
            <button 
              onClick={onOpenNeuralNudge} 
              aria-label="Neural Nudge Dashboard" 
              className={`group p-3.5 liquid-glass-dark rounded-2xl transition-all hover:scale-105 active:scale-95 curvy-btn shadow-sm relative ${
                neuralNudgeData ? getRiskColor(neuralNudgeData.procrastinationRisk) : 'text-slate-400'
              } ${
                neuralNudgeData?.procrastinationRisk === 'high' ? 'animate-pulse' : ''
              }`}
            >
              <Bell size={24} />
              {neuralNudgeData && (
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                  getRiskDotColor(neuralNudgeData.procrastinationRisk)
                } ${
                  neuralNudgeData.isActive ? 'animate-pulse' : ''
                }`} />
              )}
            </button>
            <button onClick={onOpenSettings} aria-label="Settings" className="p-3.5 liquid-glass-dark rounded-2xl text-slate-600 hover:text-indigo-600 transition-all hover:scale-105 active:scale-95 curvy-btn shadow-sm">
              <Settings size={24} />
            </button>
            <button onClick={onOpenLibrary} aria-label="Open Library" className="p-3.5 liquid-glass-dark rounded-2xl text-sky-600 hover:text-sky-700 transition-all hover:scale-105 active:scale-95 curvy-btn shadow-sm relative">
              <Library size={24} />
              {templatesCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-black shadow-lg">{templatesCount}</span>}
            </button>
          </>
        )}
      </div>
      <div className="flex flex-col items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-tr from-sky-500 to-emerald-400 rounded-[1.6rem] flex items-center justify-center text-white shadow-xl shadow-sky-200 animate-spin-slow">
          <RotateCcw size={32} />
        </div>
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-sky-700 to-emerald-500 tracking-tighter pb-1 leading-tight">{APP_TITLE}</h1>
          <p className="text-slate-400 font-medium text-xs sm:text-sm tracking-wide mt-1">Stay in a productive loop</p>
        </div>
      </div>
      <p className="text-slate-400 font-semibold text-lg sm:text-xl px-4 italic opacity-90 tracking-tight">"{motivation}"</p>
    </header>
  );
};
