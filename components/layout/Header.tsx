
import React from 'react';
import { Info, Key, Library, Cloud } from 'lucide-react';
import { APP_TITLE } from '../../constants';

interface HeaderProps {
  onShowOnboarding: () => void;
  onOpenKeyModal: () => void;
  onOpenLibrary: () => void;
  hasApiKey: boolean;
  templatesCount: number;
  motivation: string;
}

export const Header: React.FC<HeaderProps> = ({
  onShowOnboarding,
  onOpenKeyModal,
  onOpenLibrary,
  hasApiKey,
  templatesCount,
  motivation
}) => {
  return (
    <header className="mb-12 text-center flex flex-col items-center relative w-full">
      <div className="absolute left-0 top-0">
         <button onClick={onShowOnboarding} className="p-3.5 liquid-glass-dark rounded-2xl text-slate-400 hover:text-sky-500 transition-all active:scale-95 curvy-btn shadow-sm" aria-label="Restart Onboarding">
           <Info size={24} />
         </button>
      </div>
      <div className="absolute right-0 top-0 flex gap-2">
        <button onClick={onOpenKeyModal} aria-label="Open API Key Modal" className={`group p-3.5 liquid-glass-dark rounded-2xl transition-all hover:scale-105 active:scale-95 curvy-btn shadow-sm relative ${hasApiKey ? 'text-emerald-500' : 'text-amber-500'}`}>
          <Key size={24} />
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${hasApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        </button>
        <button onClick={onOpenLibrary} aria-label="Open Library" className="p-3.5 liquid-glass-dark rounded-2xl text-sky-600 hover:text-sky-700 transition-all hover:scale-105 active:scale-95 curvy-btn shadow-sm relative">
          <Library size={24} />
          {templatesCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-black shadow-lg">{templatesCount}</span>}
        </button>
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
