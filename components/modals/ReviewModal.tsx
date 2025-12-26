
import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Check, Plus, Zap } from 'lucide-react';
import { Template } from '../../types';

interface ReviewModalProps {
  template: Template | null;
  onClose: () => void;
  selectedIndices: Set<number>;
  onToggleIndex: (index: number) => void;
  onToggleAll: () => void;
  onManifest: () => void;
  onAddItem: (item: string) => void;
  capitalize: (str: string) => string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ template, onClose, selectedIndices, onToggleIndex, onToggleAll, onManifest, onAddItem, capitalize }) => {
  const [newItem, setNewItem] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Ensure mobile/iOS momentum scrolling and focus works when the modal is
  // first shown. Some WebKit builds require `-webkit-overflow-scrolling: touch`
  // and an explicit focus to allow immediate touch scrolling in nested
  // overflow containers when they appear.
  useEffect(() => {
    if (!template || !scrollRef.current) return;
    const el = scrollRef.current;
    try {
      // Prefer a short delay so CSS animations or layout settle first.
      const tid = window.setTimeout(() => {
        (el.style as any)['-webkit-overflow-scrolling'] = 'touch';
        el.style.touchAction = 'pan-y';
        el.scrollTop = 0;
        el.focus({ preventScroll: true } as any);
        // Debug: log scroll container properties
        console.log('[ReviewModal] scrollRef mounted:', {
          offsetHeight: el.offsetHeight,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          overflowScrolling: (el.style as any)['-webkit-overflow-scrolling'],
          touchAction: el.style.touchAction,
        });
      }, 40);
      // Debug: add scroll event listener
      el.addEventListener('scroll', () => {
        console.log('[ReviewModal] scroll event:', {
          scrollTop: el.scrollTop,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
        });
      });
      return () => {
        window.clearTimeout(tid);
        el.removeEventListener('scroll', () => {});
      };
    } catch {
      // ignore failures
    }
  }, [template]);

  if (!template) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-sky-900/10 backdrop-blur-2xl p-0 sm:p-10 animate-in zoom-in-95 duration-500">
      <div className="liquid-glass-dark w-full h-full sm:h-auto sm:max-w-xl sm:rounded-[4rem] p-0 shadow-2xl relative flex flex-col border border-white overflow-hidden max-h-[80vh] sm:max-h-[90vh]">
        <div className="shrink-0 px-6 sm:p-12 pb-2 sm:pb-4 pt-[calc(var(--safe-top)+1.5rem)] border-b border-white/40 bg-white/40 backdrop-blur-lg z-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Manifest Kit</h2>
            <button onClick={onClose} className="text-slate-400 bg-white/80 p-3 rounded-2xl shadow-sm"><X size={24} /></button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-sky-700 bg-sky-50 px-3 py-1 rounded-full">{template.category}</span>
              <span className="text-[10px] font-black uppercase text-slate-400">{selectedIndices.size} selected</span>
            </div>
            <button onClick={onToggleAll} className="text-[10px] font-black uppercase text-sky-600 bg-sky-50 px-4 py-2 rounded-xl flex items-center gap-2">
              {selectedIndices.size === (template.items || []).length ? 'Clear' : 'Select All'}
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <div ref={scrollRef} tabIndex={-1} className="flex-1 overflow-y-auto p-6 sm:p-12 pt-4 pb-36 no-scrollbar relative">
            <div className="space-y-4">
              {(template.items || []).map((item, idx) => (
                <button key={idx} onClick={() => onToggleIndex(idx)} className={`w-full text-left p-5 rounded-[2.2rem] border-2 transition-all flex items-center justify-between ${selectedIndices.has(idx) ? 'border-sky-400 bg-sky-50 shadow-md' : 'border-white/60 bg-white/20'}`}>
                  <span className="font-bold text-lg truncate flex-1 pr-2">{item}</span>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedIndices.has(idx) ? 'bg-sky-500 border-sky-500 text-white shadow-lg' : 'border-slate-200'}`}>{selectedIndices.has(idx) && <Check size={16} strokeWidth={4} />}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="shrink-0 p-6 sm:p-12 pt-4 pb-[calc(var(--safe-bottom)+1.5rem)] bg-gradient-to-t from-white via-white/80 to-transparent border-t border-white/20 z-50">
            <div className="flex flex-col gap-4">
              <div className="liquid-glass border-white/80 p-2 rounded-[2.5rem] shadow-2xl flex items-center gap-3">
                <input type="text" placeholder="Add extra intent..." value={newItem} onChange={(e) => setNewItem(capitalize(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && (onAddItem(newItem), setNewItem(''))} className="flex-1 bg-transparent text-base font-black focus:outline-none placeholder:text-slate-300 px-4 min-h-[44px]" />
                <button onClick={() => { onAddItem(newItem); setNewItem(''); }} className="bg-sky-500 text-white p-3 rounded-2xl shadow-lg shrink-0"><Plus size={24} strokeWidth={3} /></button>
              </div>
              <button onClick={onManifest} disabled={selectedIndices.size === 0} className="w-full bg-sky-600 text-white py-5 rounded-[2.2rem] font-black text-lg shadow-2xl disabled:opacity-40 flex items-center justify-center gap-4 tracking-widest uppercase"><Zap size={22} fill="currentColor" /> Manifest Goals</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
