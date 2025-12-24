
import React from 'react';
import { Priority } from '../../types';
import { triggerHaptic } from '../../services/notificationService';

const prioritySelectionColors: Record<Priority, string> = {
  low: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200/50 border-emerald-400',
  medium: 'bg-amber-500 text-white shadow-lg shadow-amber-200/50 border-amber-400',
  high: 'bg-rose-500 text-white shadow-lg shadow-rose-200/50 border-rose-400'
};

interface PriorityPickerProps {
  activePriority: Priority;
  onSelect: (p: Priority) => void;
}

export const PriorityPicker: React.FC<PriorityPickerProps> = ({ activePriority, onSelect }) => {
  return (
    <div className="flex items-center gap-1.5 bg-white/40 p-1.5 rounded-2xl border border-white/60 w-full sm:w-auto overflow-hidden">
      <span className="text-[9px] font-black uppercase text-slate-400 px-2 shrink-0">Priority</span>
      <div className="flex flex-1 sm:flex-initial gap-1">
        {(Object.keys(prioritySelectionColors) as Priority[]).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => { onSelect(p); triggerHaptic('light'); }}
            className={`flex-1 sm:px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all curvy-btn border ${
              activePriority === p ? `${prioritySelectionColors[p]} border-transparent` : 'text-slate-400 bg-white/30 border-white/20'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};
