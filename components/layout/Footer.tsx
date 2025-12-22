
import React from 'react';
import { ShieldCheck, Database, Trash } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

interface FooterProps {
  onPurge: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onPurge }) => {
  const supportUrl = 'https://substack.com/@observededucerespond';

  const openSupport = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: supportUrl });
        return;
      }
    } catch {
      // fall back to window.open
    }
    window.open(supportUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="mt-auto pt-16 pb-8 flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 px-6 py-3 liquid-glass rounded-full border border-white shadow-lg">
        <ShieldCheck size={18} className="text-emerald-500" />
        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">On-Device Vault <Database size={10} /></span>
      </div>
      <div className="flex flex-col items-center gap-2 mt-4">
        <button
          onClick={() => void openSupport()}
          className="text-[10px] font-black text-slate-400 hover:text-indigo-500 uppercase tracking-widest transition-colors curvy-btn px-4 py-2"
        >
          Support AlterEgo
        </button>
        <button
          onClick={onPurge}
          className="text-[10px] font-black text-rose-300 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2 curvy-btn px-4 py-2"
        >
          <Trash size={12} /> Purge Vault
        </button>
        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider text-center max-w-[200px]">
          Wipes all local data. This action is final and removes all manifests from your browser cache.
        </p>
      </div>
    </footer>
  );
};
