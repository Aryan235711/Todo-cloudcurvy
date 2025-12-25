
import React, { useState, useEffect } from 'react';
import { Info, Key, Library, Cloud, Bell, Grid3X3 } from 'lucide-react';
import { APP_TITLE } from '../../constants';

interface HeaderProps {
  onShowOnboarding: () => void;
  onOpenKeyModal: () => void;
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
  onOpenKeyModal,
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
            
            {isExpanded && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black/20 z-10"
                  onClick={() => setIsExpanded(false)}
                />
                
                {/* Expanded Menu */}
                <div className="absolute right-0 top-16 flex flex-col gap-2 z-20 animate-in slide-in-from-top-2 duration-250">
                  <button 
                    onClick={() => handleActionClick(onOpenNeuralNudge)}
                    className={`group p-3.5 liquid-glass-dark rounded-2xl transition-all hover:scale-105 active:scale-95 curvy-btn shadow-sm relative animate-in slide-in-from-top-1 duration-200 delay-0 ${
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
                  
                  <button 
                    onClick={() => handleActionClick(onOpenKeyModal)}
                    className={`group p-3.5 liquid-glass-dark rounded-2xl transition-all hover:scale-105 active:scale-95 curvy-btn shadow-sm relative animate-in slide-in-from-top-1 duration-200 delay-75 ${
                      hasApiKey ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    <Key size={24} />
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                      hasApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`} />
                  </button>
                  
                  <button 
                    onClick={() => handleActionClick(onOpenLibrary)}
                    className="p-3.5 liquid-glass-dark rounded-2xl text-sky-600 hover:text-sky-700 transition-all hover:scale-105 active:scale-95 curvy-btn shadow-sm relative animate-in slide-in-from-top-1 duration-200 delay-150"
                  >
                    <Library size={24} />
                    {templatesCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-black shadow-lg">
                        {templatesCount}
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}
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
            <button onClick={onOpenKeyModal} aria-label="Open API Key Modal" className={`group p-3.5 liquid-glass-dark rounded-2xl transition-all hover:scale-105 active:scale-95 curvy-btn shadow-sm relative ${hasApiKey ? 'text-emerald-500' : 'text-amber-500'}`}>
              <Key size={24} />
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${hasApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </button>
            <button onClick={onOpenLibrary} aria-label="Open Library" className="p-3.5 liquid-glass-dark rounded-2xl text-sky-600 hover:text-sky-700 transition-all hover:scale-105 active:scale-95 curvy-btn shadow-sm relative">
              <Library size={24} />
              {templatesCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-black shadow-lg">{templatesCount}</span>}
            </button>
          </>
        )}
      </div>
      <div className="flex flex-col items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-tr from-sky-500 to-emerald-400 rounded-[1.6rem] flex items-center justify-center text-white shadow-xl shadow-sky-200 animate-bounce-slow">
          <Cloud fill="currentColor" size={32} />
        </div>
        <h1 className="text-4xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-sky-700 to-emerald-500 tracking-tighter pb-2 leading-tight">{APP_TITLE}</h1>
      </div>
      <p className="text-slate-400 font-semibold text-lg sm:text-xl px-4 italic opacity-90 tracking-tight">"{motivation}"</p>
    </header>
  );
};
