import React, { useState, memo, useRef } from 'react';
import { CheckCircle2, Circle, Trash2, Edit3, Sparkles, ChevronDown, ChevronUp, Clock, AlarmClock, Check, X } from 'lucide-react';
import { Todo } from '../types';
import { getTaskBreakdown } from '../services/geminiService';
import { triggerHaptic } from '../services/notificationService';
import { shouldShowDeleteConfirmation, isGestureEnabled } from '../services/preferencesService';

interface TodoCardProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  onUpdateSubtasks: (id: string, subTasks: string[]) => void;
  onPriorityChange?: (id: string, priority: 'low' | 'medium' | 'high') => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
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

export const TodoCard = memo(({ todo, onToggle, onDelete, onEdit, onUpdateSubtasks, onPriorityChange, isSelectionMode, isSelected, onSelect }: TodoCardProps) => {
  TodoCard.displayName = 'TodoCard';
  const [isExpanding, setIsExpanding] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const startX = useRef(0);

  const REVEAL_THRESHOLD = 30;
  const TRIGGER_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setSwipeOffset(Math.max(-120, Math.min(120, diff)));
    
    if (Math.abs(diff) > REVEAL_THRESHOLD) {
      triggerHaptic('light');
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (swipeOffset > TRIGGER_THRESHOLD && isGestureEnabled('swipeToDelete')) {
      triggerHaptic('warning');
      if (shouldShowDeleteConfirmation()) {
        setShowDeleteConfirm(true);
      } else {
        onDelete(todo.id);
      }
    } else if (swipeOffset < -TRIGGER_THRESHOLD && isGestureEnabled('swipeToEdit')) {
      triggerHaptic('medium');
      setIsEditing(true);
      setEditText(todo.text);
    }
    
    setSwipeOffset(0);
  };

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
    
    if (isSelectionMode && onSelect) {
      onSelect(todo.id);
      triggerHaptic('light');
      return;
    }
    
    onToggle(todo.id);
    
    if (!todo.completed) {
      import('../services/notificationService').then(({ recordTaskCompletion }) => {
        recordTaskCompletion(todo.priority);
      });
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText.trim() !== todo.text) {
      onEdit(todo.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(todo.text);
    setIsEditing(false);
    triggerHaptic('light');
  };

  const handlePriorityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onPriorityChange) return;
    
    const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const currentIndex = priorities.indexOf(todo.priority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    
    onPriorityChange(todo.id, nextPriority);
    triggerHaptic('light');
  };

  const handleConfirmDelete = () => {
    triggerHaptic('heavy');
    onDelete(todo.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="relative overflow-hidden rounded-[2.2rem]">
      {/* Delete zone (left) */}
      <div className={`absolute inset-y-0 left-0 bg-rose-500 flex items-center justify-center transition-all duration-200 ${
        swipeOffset > REVEAL_THRESHOLD ? 'w-20' : 'w-0'
      }`}>
        <Trash2 size={24} className="text-white" strokeWidth={2.5} />
      </div>
      
      {/* Edit zone (right) */}
      <div className={`absolute inset-y-0 right-0 bg-amber-500 flex items-center justify-center transition-all duration-200 ${
        swipeOffset < -REVEAL_THRESHOLD ? 'w-20' : 'w-0'
      }`}>
        <Edit3 size={24} className="text-white" strokeWidth={2.5} />
      </div>

      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        className={`group relative w-full bg-white rounded-[2.2rem] p-4 sm:p-5 shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-lg border-2 flex flex-col gap-3 ${
          todo.isUrgent && !todo.completed ? 'urgent-pulse' : 'border-transparent'
        } ${
          todo.completed ? 'border-emerald-100/40 bg-emerald-50/10 opacity-70' : 'hover:border-sky-100'
        } ${
          isDragging ? 'transition-none' : ''
        }`}
      >
        <div className="flex items-start gap-4 sm:gap-5 w-full">
          <button 
            onClick={handleToggleAction}
            className={`mt-1 shrink-0 transition-all duration-500 active:scale-75 curvy-btn ${
              isSelectionMode 
                ? (isSelected ? 'text-indigo-500' : 'text-slate-300')
                : (todo.completed ? 'text-emerald-500' : 'text-slate-200 hover:text-sky-400')
            }`}
          >
            {isSelectionMode ? (
              isSelected ? <CheckCircle2 size={30} /> : <Circle size={30} strokeWidth={1.5} />
            ) : (
              todo.completed ? <CheckCircle2 size={30} /> : <Circle size={30} strokeWidth={1.5} />
            )}
          </button>

          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handlePriorityToggle}
                className={`w-2.5 h-2.5 rounded-full ${priorityColors[todo.priority]} shadow-sm shrink-0 transition-all hover:scale-125 active:scale-110 curvy-btn`} 
              />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                <Clock size={11} /> {formatTime(todo.createdAt)}
              </span>
              {todo.isUrgent && !todo.completed && (
                <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-rose-100">
                  <AlarmClock size={12} /> {todo.extractedTime || 'Soon'}
                </span>
              )}
            </div>
            
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="flex-1 text-lg font-black bg-transparent border-b-2 border-indigo-300 focus:border-indigo-500 outline-none py-1"
                  autoFocus
                />
                <button onClick={handleSaveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                  <Check size={18} />
                </button>
                <button onClick={handleCancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-all">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <p className={`text-lg sm:text-xl font-black transition-all duration-700 leading-snug tracking-tight break-words pb-1 ${
                todo.completed ? 'line-through text-slate-400' : 'text-slate-800'
              }`}>
                {todo.text}
              </p>
            )}

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

          <button 
            onClick={handleAiBreakdown}
            disabled={aiLoading}
            className={`mt-1 p-2.5 rounded-xl transition-all curvy-btn border-2 ${
              aiLoading ? 'animate-pulse text-indigo-500 bg-indigo-50 border-indigo-200' : 'text-indigo-500 bg-indigo-50 border-indigo-200'
            }`}
          >
            <Sparkles size={20} className={aiLoading ? 'animate-spin' : ''} strokeWidth={2.5} />
          </button>
        </div>

        {isExpanding && todo.subTasks && todo.subTasks.length > 0 && (
          <div className="mt-2 pt-4 border-t border-slate-50 ml-10 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
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

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm font-bold text-rose-800">Delete this task?</p>
            <div className="flex gap-2">
              <button 
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-lg transition-all curvy-btn"
              >
                Delete
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all curvy-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});