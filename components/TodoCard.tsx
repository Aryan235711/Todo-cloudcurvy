
import React, { useState, memo } from 'react';
import { CheckCircle2, Circle, Trash2, Sparkles, ChevronDown, ChevronUp, Tag, Clock, AlarmClock } from 'lucide-react';
import { Todo } from '../types';
import { getTaskBreakdown } from '../services/geminiService';
import { triggerHaptic } from '../services/notificationService';

interface TodoCardProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSubtasks: (id: string, subTasks: string[]) => void;
}

const priorityColors = {
  low: 'bg-emerald-400',
  medium: 'bg-amber-400',
  high: 'bg-rose-500'
};

const formatTime = (ts: number) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(ts).toLocaleDateString();
};

export const TodoCard = memo(({ todo, onToggle, onDelete, onUpdateSubtasks }: TodoCardProps) => {
  const [isExpanding, setIsExpanding] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiBreakdown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    if (todo.subTasks && todo.subTasks.length > 0) {
      setIsExpanding(!isExpanding);
      return;
    }

    setAiLoading(true);
    try {
      const steps = await getTaskBreakdown(todo.text);
      onUpdateSubtasks(todo.id, steps);
      setIsExpanding(true);
      triggerHaptic('success');
    } catch {
      triggerHaptic('warning');
    } finally {
      setAiLoading(false);
    }
  };

  const handleToggleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(todo.id);
  };

  return (
    <div 
      className={`group relative w-full bg-white rounded-[2.2rem] p-5 sm:p-6 shadow-sm transition-all duration-700 hover:scale-[1.01] hover:shadow-lg border-2 flex flex-col gap-4 ${
        todo.isUrgent && !todo.completed ? 'urgent-pulse' : 'border-transparent'
      } ${
        todo.completed ? 'border-emerald-100/40 bg-emerald-50/10 opacity-70' : 'hover:border-sky-100'
      }`}
    >
      <div className="flex items-start gap-4 sm:gap-5 w-full">
        <button 
          onClick={handleToggleAction}
          className={`mt-1 shrink-0 transition-all duration-500 active:scale-75 curvy-btn ${todo.completed ? 'text-emerald-500' : 'text-slate-200 hover:text-sky-400'}`}
        >
          {todo.completed ? <CheckCircle2 size={30} /> : <Circle size={30} strokeWidth={1.5} />}
        </button>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${priorityColors[todo.priority]} shadow-sm shrink-0`} />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
              <Clock size={11} /> {formatTime(todo.createdAt)}
            </span>
            {todo.isUrgent && !todo.completed && (
              <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-rose-100">
                <AlarmClock size={12} /> {todo.extractedTime || 'Soon'}
              </span>
            )}
          </div>
          
          <p className={`text-lg sm:text-xl font-black transition-all duration-700 leading-snug tracking-tight break-words pb-1 ${
            todo.completed ? 'line-through text-slate-400' : 'text-slate-800'
          }`}>
            {todo.text}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {todo.category && (
              <span className="text-[9px] uppercase font-black bg-sky-50 text-sky-600 px-2.5 py-1 rounded-lg">
                {todo.category}
              </span>
            )}
            {todo.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="text-[9px] uppercase font-black bg-slate-50 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-100/50">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-1 shrink-0 sm:opacity-0 group-hover:opacity-100 transition-all duration-500">
          <button 
            onClick={handleAiBreakdown}
            disabled={aiLoading}
            className={`p-2.5 rounded-xl transition-all curvy-btn ${
              aiLoading ? 'animate-pulse text-indigo-500 bg-indigo-50' : 'text-slate-200 hover:text-indigo-500 hover:bg-indigo-50'
            }`}
          >
            <Sparkles size={22} className={aiLoading ? 'animate-spin' : ''} strokeWidth={2.5} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(todo.id); }}
            className="p-2.5 rounded-xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all curvy-btn"
          >
            <Trash2 size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {isExpanding && todo.subTasks && todo.subTasks.length > 0 && (
        <div className="mt-2 pt-5 border-t border-slate-50 ml-10 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
          {todo.subTasks.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm text-slate-600 font-bold tracking-tight">
              <div className="w-2 h-2 rounded-full bg-indigo-300 mt-1.5 shrink-0" />
              <span className="leading-snug">{step}</span>
            </div>
          ))}
        </div>
      )}
      
      {todo.subTasks && todo.subTasks.length > 0 && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanding(!isExpanding); triggerHaptic('light'); }}
          className="mx-auto mt-2 bg-white border border-slate-100 text-slate-200 hover:text-indigo-500 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md z-10 curvy-btn"
        >
          {isExpanding ? <ChevronUp size={18} strokeWidth={3} /> : <ChevronDown size={18} strokeWidth={3} />}
        </button>
      )}
    </div>
  );
});
