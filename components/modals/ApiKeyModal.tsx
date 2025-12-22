
import React from 'react';
import { X, Key, ShieldCheck, Unlock, ChevronRight, RotateCcw } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasApiKey: boolean;
  onConnect: () => Promise<void>;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, hasApiKey, onConnect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl p-4 animate-in fade-in duration-500">
      <div className="liquid-glass-dark w-full max-w-md rounded-[3rem] p-8 sm:p-12 shadow-2xl relative animate-in zoom-in-95 duration-500 border-2 border-white">
        <button onClick={onClose} className="absolute right-6 top-[calc(var(--safe-top)+1.5rem)] p-3 bg-white/80 rounded-2xl text-slate-400 hover:text-slate-600 transition-all"><X size={24} /></button>
        <div className="flex flex-col items-center text-center gap-6">
          <div className={`p-8 rounded-[2.5rem] shadow-xl ${hasApiKey ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'} animate-bounce-slow`}>
            {hasApiKey ? <ShieldCheck size={64} strokeWidth={1.5} /> : <Unlock size={64} strokeWidth={1.5} />}
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
              {hasApiKey ? 'AI Connection Secured' : 'Connect Your Magic'}
            </h2>
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">BYOK Ecosystem Model</p>
          </div>
          <div className="bg-white/40 p-6 rounded-[2rem] text-sm text-slate-600 font-medium leading-relaxed border border-white/60">
            CurvyCloud is a free, privacy-first tool. To manifest with AI, we use your own Gemini API key. This ensures your data remains yours and the app stays free forever.
            <div className="mt-4 pt-4 border-t border-white/40">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-500 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:gap-3 transition-all">
                Learn about Free Usage <ChevronRight size={12} />
              </a>
            </div>
          </div>
          <div className="w-full flex flex-col gap-3">
             <button onClick={onConnect} className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${hasApiKey ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
               {hasApiKey ? <><RotateCcw size={22} /> Switch AI Key</> : <><Key size={22} /> Link My Gemini Key</>}
             </button>
             {hasApiKey && (
               <div className="flex items-center justify-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 py-2 rounded-xl">
                 <ShieldCheck size={14} strokeWidth={4} /> System Online & Private
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
