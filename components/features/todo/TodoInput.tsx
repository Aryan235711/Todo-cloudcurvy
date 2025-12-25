import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, Plus } from 'lucide-react';
import { Priority } from '../../../types';
import { PriorityPicker } from '../../ui/PriorityPicker';
import { HelpTooltip } from '../../ui/HelpTooltip';

interface TodoInputProps {
  inputValue: string;
  setInputValue: (v: string) => void;
  activePriority: Priority;
  setActivePriority: (p: Priority) => void;
  isListening: boolean;
  toggleVoice: () => void;
  voiceMode?: 'native' | 'web' | 'none';
  isMagicLoading: boolean;
  onMagic: () => Promise<void>;
  onSubmit: (e: React.FormEvent) => void;
}

export const TodoInput: React.FC<TodoInputProps> = ({
  inputValue,
  setInputValue,
  activePriority,
  setActivePriority,
  isListening,
  toggleVoice,
  voiceMode = 'none',
  isMagicLoading,
  onMagic,
  onSubmit
}) => {
  const canVoice = voiceMode !== 'none';
  const [isFocused, setIsFocused] = useState(false);
  const showAnimatedPlaceholder = !inputValue.trim() && !isFocused;
  const showStaticPlaceholder = !inputValue.trim() && isFocused;

  return (
    <div className="liquid-glass rounded-[2.5rem] p-4 sm:p-5 curvy-shadow mb-10 sticky top-4 z-40 w-full flex flex-col gap-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleVoice}
            aria-disabled={!canVoice}
            className={`p-4 rounded-2xl transition-all curvy-btn shadow-md shrink-0 ${
              !canVoice
                ? 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white opacity-60'
                : isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white'
            }`}
          >
            {!canVoice ? <MicOff size={22} /> : (isListening ? <MicOff size={22} /> : <Mic size={22} />)}
          </button>
          <div className="flex-1 overflow-hidden relative">
            {showAnimatedPlaceholder && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none">
                <div className="w-full overflow-hidden">
                  <div className="inline-flex whitespace-nowrap curvy-placeholder-marquee sm:animate-none text-lg font-bold tracking-tight text-slate-200">
                    <span className="pr-10">Manifest a template…</span>
                    <span className="pr-10">Manifest a template…</span>
                  </div>
                </div>
              </div>
            )}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={showStaticPlaceholder ? "Manifest a template…" : ""}
              className="w-full bg-transparent text-lg sm:text-2xl font-bold placeholder-slate-200 focus:outline-none tracking-tight"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onMagic}
              disabled={!inputValue.trim() || isMagicLoading}
              className={`p-4 rounded-2xl transition-all shadow-md active:scale-95 curvy-btn ${
                isMagicLoading ? 'bg-slate-200 text-slate-400' : 'bg-indigo-500 text-white'
              }`}
            >
              <Sparkles size={22} className={isMagicLoading ? 'animate-spin' : ''} />
            </button>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-sky-500 text-white p-4 rounded-2xl hover:bg-sky-600 transition-all shadow-md active:scale-95 curvy-btn"
            >
              <Plus size={22} strokeWidth={4} />
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-white/40">
          <PriorityPicker activePriority={activePriority} onSelect={setActivePriority} />
          <HelpTooltip 
            content="Gesture Guide: Swipe right to delete tasks, swipe left to edit, long-press for multi-select. Tap priority dots to cycle priorities. Sparkles breaks tasks into steps."
            position="top"
          />
        </div>
      </form>
    </div>
  );
};