
import React from 'react';
import { ShieldCheck, Database, Trash, Newspaper } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

interface FooterProps {
  onPurge: () => void;
}

export const Footer = React.memo<FooterProps>(({ onPurge }) => {
  const substackUrl = 'https://substack.com/@observededucerespond';

  const openSubstack = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: substackUrl });
        return;
      }
    } catch {
      // fall back to window.open
    }
    window.open(substackUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="mt-auto pt-16 pb-8 flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 px-6 py-3 liquid-glass rounded-full border border-white shadow-lg">
        <ShieldCheck size={18} className="text-emerald-500" />
        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">On-Device Vault <Database size={10} /></span>
      </div>
      <div className="flex flex-col items-center gap-3 mt-4">
        <button
          onClick={() => void openSubstack()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all curvy-btn flex items-center gap-2 shadow-lg"
          aria-label="Open Substack"
        >
          <Newspaper size={14} /> Substack
        </button>
        <button
          onClick={onPurge}
          className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all curvy-btn flex items-center gap-2 shadow-lg"
        >
          <Trash size={14} /> Purge Vault
        </button>
        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider text-center max-w-[220px] leading-relaxed">
          ⚠️ CRITICAL: Permanently destroys all tasks, templates, and settings. Cannot be undone.
        </p>
      </div>
    </footer>
  );
});
