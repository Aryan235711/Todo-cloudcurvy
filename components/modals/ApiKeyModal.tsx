
import React, { useState } from 'react';
import { X, Key, ShieldCheck, Unlock, ChevronRight, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

import { Capacitor } from '@capacitor/core';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasApiKey: boolean;
  // If `manualKey` is provided, the handler validates and stores it.
  onConnect: (manualKey?: string | null) => Promise<void>;
}

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid' | 'quota_exceeded';

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, hasApiKey, onConnect }) => {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePrimary = async () => {
    // On native platforms use the native prompt flow; on web, reveal a non-blocking input instead
    if (Capacitor.isNativePlatform() || (window as any).aistudio?.openSelectKey) {
      await onConnect();
      return;
    }

    setShowInput(true);
  };

  const handleSave = async () => {
    if (!inputValue.trim()) return;
    
    setIsSaving(true);
    setValidationState('validating');
    setErrorMessage(null);
    
    try {
      await onConnect(inputValue.trim());
      setValidationState('valid');
      setShowInput(false);
      setInputValue('');
      onClose();
    } catch (error: any) {
      setValidationState('invalid');
      setErrorMessage(error.message || 'Failed to validate API key. Please check your key and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getValidationIcon = () => {
    switch (validationState) {
      case 'validating':
        return <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />;
      case 'valid':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'invalid':
      case 'quota_exceeded':
        return <AlertCircle size={16} className="text-rose-500" />;
      default:
        return null;
    }
  };

  const getValidationMessage = () => {
    switch (validationState) {
      case 'validating':
        return 'Validating API key...';
      case 'valid':
        return 'API key is valid!';
      case 'invalid':
        return errorMessage || 'Invalid API key';
      case 'quota_exceeded':
        return 'API key valid but quota exceeded';
      default:
        return null;
    }
  };

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
            Loop is a free, privacy-first tool. To manifest with AI, you link your own AI API key. Your key stays on-device and powers your private AI features.

            <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-100 text-amber-900">
              <p className="text-xs font-black uppercase tracking-widest">Free-tier warning</p>
              <p className="mt-2 text-sm font-semibold leading-snug">
                Free keys can exhaust quickly. For the most efficient use of calls, generate a <span className="font-black">Manifest Kit</span> (template) with Sparkles, then Deploy it—this creates many tasks from a single AI request.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/40">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:gap-3 transition-all">
                Learn about Free Usage <ChevronRight size={12} />
              </a>
            </div>
          </div>
          <div className="w-full flex flex-col gap-3">
             {!showInput ? (
               <>
                 <button onClick={handlePrimary} className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${hasApiKey ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
                   {hasApiKey ? <><RotateCcw size={22} /> Switch AI Key</> : <><Key size={22} /> Link My AI Key</>}
                 </button>
                 {hasApiKey && (
                   <div className="flex items-center justify-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 py-2 rounded-xl">
                     <ShieldCheck size={14} strokeWidth={4} /> System Online & Private
                   </div>
                 )}
               </>
             ) : (
               <div className="flex flex-col gap-3">
                 <div className="relative">
                   <input 
                     className={`w-full p-3 pr-10 rounded-xl bg-white/80 border text-sm transition-colors ${
                       validationState === 'invalid' || validationState === 'quota_exceeded' 
                         ? 'border-rose-300 focus:border-rose-500' 
                         : validationState === 'valid'
                         ? 'border-emerald-300 focus:border-emerald-500'
                         : 'border-white/30 focus:border-indigo-500'
                     }`}
                     placeholder="Paste your Gemini API key…" 
                     value={inputValue} 
                     onChange={e => {
                       setInputValue(e.target.value);
                       setValidationState('idle');
                       setErrorMessage(null);
                     }}
                     disabled={isSaving}
                   />
                   <div className="absolute right-3 top-1/2 -translate-y-1/2">
                     {getValidationIcon()}
                   </div>
                 </div>
                 
                 {getValidationMessage() && (
                   <div className={`text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-2 ${
                     validationState === 'valid' 
                       ? 'bg-emerald-50 text-emerald-700'
                       : validationState === 'validating'
                       ? 'bg-indigo-50 text-indigo-700'
                       : 'bg-rose-50 text-rose-700'
                   }`}>
                     {getValidationMessage()}
                   </div>
                 )}
                 
                 <div className="flex gap-3">
                   <button 
                     onClick={handleSave} 
                     disabled={isSaving || !inputValue.trim()}
                     className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-black disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                   >
                     {isSaving ? 'Validating…' : 'Save & Validate'}
                   </button>
                   <button 
                     onClick={() => { 
                       setShowInput(false); 
                       setInputValue(''); 
                       setValidationState('idle');
                       setErrorMessage(null);
                     }} 
                     className="flex-1 py-3 rounded-2xl bg-white/30 font-black"
                     disabled={isSaving}
                   >
                     Cancel
                   </button>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
