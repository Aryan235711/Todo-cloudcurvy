
import React from 'react';
import { Mic, MicOff, Sparkles, Plus } from 'lucide-react';
import { Priority } from '../../../types';
import { PriorityPicker } from '../../ui/PriorityPicker';

interface TodoInputProps {
  inputValue: string;
  setInputValue: (v: string) => void;
  activePriority: Priority;
  setActivePriority: (p: Priority) => void;
  isListening: boolean;
  toggleVoice: () => void;
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
  isMagicLoading,
  onMagic,
  onSubmit
}) => {
  return (
    <div className="liquid-glass rounded-[2.5rem] p-4 sm:p-5 curvy-shadow mb-10 sticky top-4 z-40 w-full flex flex-col gap-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleVoice}
            className={`p-4 rounded-2xl transition-all curvy-btn shadow-md shrink-0 ${
              isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white'
            }`}
          >
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <div className="flex-1 overflow-hidden">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Manifest your vision..."
              className="w-full bg-transparent text-xl sm:text-2xl font-bold placeholder-slate-200 focus:outline-none tracking-tight"
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
        </div>
      </form>
    </div>
  );
};
