
import React from 'react';
import { CheckCheck, Package, BellRing, Zap, RotateCcw, ChevronDown } from 'lucide-react';
import { Todo } from '../../../types';
import { TodoCard } from '../../TodoCard';

interface TodoBundleProps {
  name: string;
  items: Todo[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: (shouldComplete: boolean) => void;
  onTodoToggle: (id: string) => void;
  onTodoDelete: (id: string) => void;
  onUpdateSubtasks: (id: string, steps: string[]) => void;
  isHigh: boolean;
}

export const TodoBundle: React.FC<TodoBundleProps> = ({
  name,
  items,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onTodoToggle,
  onTodoDelete,
  onUpdateSubtasks,
  isHigh
}) => {
  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;
  // Guard against division by zero
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const sortedItems = React.useMemo(() => {
    return items
      .map((todo, index) => ({ todo, index }))
      .sort((a, b) => {
        if (a.todo.completed !== b.todo.completed) return a.todo.completed ? 1 : -1;
        return a.index - b.index;
      })
      .map(x => x.todo);
  }, [items]);

  // Task display limit logic (keeps long templates manageable)
  const INITIAL_LIMIT = 15;
  const SHOW_MORE_COUNT = 10;
  const [showCount, setShowCount] = React.useState(INITIAL_LIMIT);
  const canShowMore = sortedItems.length > showCount;
  const shownItems = sortedItems.slice(0, showCount);

  return (
    <div className="relative mb-6 w-full flex flex-col items-center">
      {isHigh && !isAllCompleted && (
        <div className="absolute -inset-1 bg-gradient-to-tr from-rose-500/20 to-amber-500/20 rounded-[2.8rem] blur-xl animate-pulse -z-30" />
      )}
      <div className={`transition-all duration-700 w-full ${isExpanded ? 'space-y-4' : ''}`}>
        <div className={`w-full bg-white rounded-[2.5rem] border-2 transition-all flex flex-col hover:border-sky-300 group/bundle relative overflow-hidden ${
          isExpanded ? 'border-sky-200 shadow-xl mb-4' : 'border-transparent shadow-sm'
        } ${isAllCompleted ? 'bg-emerald-50/60 border-emerald-100 opacity-70' : ''}`}>
          <div className="flex items-center justify-between p-4 sm:p-5">
            <button onClick={onToggleExpand} className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0 text-left">
              <div className="relative shrink-0">
                <div className={`p-4 rounded-2xl transition-all duration-700 ${
                  isAllCompleted ? 'bg-emerald-500 text-white' : isHigh ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                }`}>
                  {isAllCompleted ? <CheckCheck size={24} /> : isHigh ? <BellRing size={24} className="animate-bounce-slow" /> : <Package size={24} />}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center p-0.5 overflow-hidden">
                  <div className="w-full h-full rounded-full bg-slate-100 relative">
                    <div className={`absolute bottom-0 inset-x-0 transition-all duration-700 ${isAllCompleted ? 'bg-emerald-400' : 'bg-sky-400'}`} style={{ height: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`font-black text-lg sm:text-xl tracking-tight truncate ${isAllCompleted ? 'text-emerald-800' : 'text-slate-800'}`}>{name}
                  {isAllCompleted && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase align-middle">Completed</span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                   <span className={`text-[9px] font-black uppercase tracking-widest ${isAllCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>{completedCount}/{totalCount} goals</span>
                   {isHigh && <span className="text-[8px] text-rose-500 font-black uppercase bg-rose-50 px-1.5 py-0.5 rounded-md flex items-center gap-1"><Zap size={8} fill="currentColor" /> Priority</span>}
                </div>
              </div>
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => onToggleComplete(!isAllCompleted)} className={`p-3.5 rounded-2xl transition-all active:scale-95 flex items-center justify-center ${isAllCompleted ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}> 
                {isAllCompleted ? <RotateCcw size={20} strokeWidth={3} /> : <CheckCheck size={20} strokeWidth={3} />}
              </button>
              <button onClick={onToggleExpand} className={`p-3 rounded-xl transition-transform duration-700 ${isExpanded ? 'rotate-180 text-sky-500 bg-sky-50' : 'text-slate-200 hover:text-slate-400'}`}><ChevronDown size={22} /></button>
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="pl-4 sm:pl-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700 border-l-4 border-sky-100/50">
            {shownItems.map(t => (
              <TodoCard
                key={t.id}
                todo={t}
                onToggle={onTodoToggle}
                onDelete={onTodoDelete}
                onUpdateSubtasks={onUpdateSubtasks}
              />
            ))}
              {canShowMore && (
                <button
                  className="mt-2 px-4 py-2 rounded-xl bg-sky-50 text-sky-700 font-bold text-xs hover:bg-sky-100 transition-all"
                  onClick={() => setShowCount(c => Math.min(c + SHOW_MORE_COUNT, sortedItems.length))}
                  aria-label="Show more tasks"
                >Show more ({Math.min(SHOW_MORE_COUNT, sortedItems.length - showCount)})</button>
              )}
          </div>
        )}
      </div>
    </div>
  );
};
