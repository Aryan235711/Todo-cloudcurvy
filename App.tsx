
import React, { useState } from 'react';
import { Sun, AlertTriangle, X } from 'lucide-react';
import { Todo } from './types';
import { CATEGORIES } from './constants';
import { TodoCard } from './components/TodoCard';
import { Onboarding } from './components/Onboarding';
import { useTodoLogic } from './hooks/useTodoLogic';
import { ApiKeyModal } from './components/modals/ApiKeyModal';
import { LibraryModal } from './components/modals/LibraryModal';
import { ReviewModal } from './components/modals/ReviewModal';
import { triggerHaptic } from './services/notificationService';

// Refactored Modular Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { TodoInput } from './components/features/todo/TodoInput';
import { TodoBundle } from './components/features/todo/TodoBundle';

const App: React.FC = () => {
  const {
    todos, setTodos,
    templates, setTemplates,
    inputValue, setInputValue,
    activePriority, setActivePriority,
    sortMode, setSortMode,
    filterCategory, setFilterCategory,
    motivation,
    isListening, toggleVoice,
    hasApiKey, setHasApiKey,
    aiError, setAiError,
    isMagicLoading,
    reviewingTemplate, setReviewingTemplate,
    selectedReviewIndices, setSelectedReviewIndices,
    groupedTodos,
    handleAddTodo,
    handleMagicTemplate,
    capitalize
  } = useTodoLogic();

  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set());

  const handleConnectKey = async () => {
    if (window.aistudio) {
      triggerHaptic('medium');
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setIsKeyModalOpen(false);
      setAiError(null);
    }
  };

  const handleToggleBundleCompletion = (bundleName: string, shouldComplete: boolean) => {
    const tmpl = templates.find(t => t.name === bundleName);
    if (shouldComplete) triggerHaptic(tmpl?.priority === 'high' ? 'success' : 'medium');
    setTodos(prev => prev.map(todo => todo.templateName === bundleName ? { ...todo, completed: shouldComplete } : todo));
  };

  const toggleBundle = (bundleName: string) => {
    setExpandedBundles(prev => {
      const next = new Set(prev);
      if (next.has(bundleName)) next.delete(bundleName); else next.add(bundleName);
      return next;
    });
    triggerHaptic('light');
  };

  const handleTodoToggle = (id: string) => {
    const item = todos.find(i => i.id === id);
    if (item && !item.completed) triggerHaptic(item.priority === 'high' ? 'success' : 'medium');
    setTodos(prev => prev.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
  };

  const handleTodoDelete = (id: string) => {
    triggerHaptic('heavy');
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const handleUpdateSubtasks = (id: string, steps: string[]) => {
    setTodos(prev => prev.map(todo => todo.id === id ? { ...todo, subTasks: steps } : todo));
  };

  const renderCategorizedList = (items: Todo[]) => {
    const nodes: (Todo | { type: 'bundle', name: string, items: Todo[] })[] = [];
    const processedBundles = new Set<string>();

    items.forEach(todo => {
      if (todo.templateName) {
        if (!processedBundles.has(todo.templateName)) {
          const bundleTasks = items.filter(i => i.templateName === todo.templateName);
          nodes.push({ type: 'bundle', name: todo.templateName, items: bundleTasks });
          processedBundles.add(todo.templateName);
        }
      } else nodes.push(todo);
    });

    return nodes.map((node, idx) => {
      if ('type' in node && node.type === 'bundle') {
        const tmpl = templates.find(t => t.name === node.name);
        return (
          <TodoBundle
            key={`bundle-${node.name}-${idx}`}
            name={node.name}
            items={node.items}
            isExpanded={expandedBundles.has(node.name)}
            onToggleExpand={() => toggleBundle(node.name)}
            onToggleComplete={(val) => handleToggleBundleCompletion(node.name, val)}
            onTodoToggle={handleTodoToggle}
            onTodoDelete={handleTodoDelete}
            onUpdateSubtasks={handleUpdateSubtasks}
            isHigh={tmpl?.priority === 'high'}
          />
        );
      }
      return (
        <TodoCard
          key={node.id}
          todo={node}
          onToggle={handleTodoToggle}
          onDelete={handleTodoDelete}
          onUpdateSubtasks={handleUpdateSubtasks}
        />
      );
    });
  };

  React.useEffect(() => {
    const onboardingSeen = localStorage.getItem('curvycloud_onboarding_seen');
    setShowOnboarding(onboardingSeen !== 'true');
  }, []);

  const handleFinishOnboarding = () => {
    localStorage.setItem('curvycloud_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  if (showOnboarding === null) return null;
  if (showOnboarding) return <Onboarding onComplete={handleFinishOnboarding} />;

  return (
    <div className="app-scroller no-scrollbar">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-8 py-8 md:py-16 flex flex-col min-h-full">
        <Header
          onShowOnboarding={() => { setShowOnboarding(true); triggerHaptic('medium'); }}
          onOpenKeyModal={() => setIsKeyModalOpen(true)}
          onOpenLibrary={() => { setIsTemplatesOpen(true); triggerHaptic('medium'); }}
          hasApiKey={hasApiKey}
          templatesCount={templates.length}
          motivation={motivation}
        />

        {aiError && (
          <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
             <div className="p-3 bg-white rounded-2xl text-rose-500 shadow-sm"><AlertTriangle size={24} /></div>
             <p className="text-sm font-black text-rose-800 tracking-tight leading-snug">{aiError}</p>
             <button onClick={() => setAiError(null)} className="ml-auto text-rose-300 hover:text-rose-500"><X size={20} /></button>
          </div>
        )}

        <TodoInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          activePriority={activePriority}
          setActivePriority={setActivePriority}
          isListening={isListening}
          toggleVoice={toggleVoice}
          isMagicLoading={isMagicLoading}
          onMagic={async () => { const res = await handleMagicTemplate(); if (res === 'OPEN_KEY_MODAL') setIsKeyModalOpen(true); }}
          onSubmit={handleAddTodo}
        />

        <div className="flex items-center gap-2 bg-white/30 p-2 rounded-[1.8rem] border border-white/40 overflow-x-auto no-scrollbar mb-10 w-full">
            <button onClick={() => { setSortMode('smart'); triggerHaptic('light'); }} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap curvy-btn ${sortMode === 'smart' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Smart Filter</button>
            <div className="w-[1px] h-5 bg-slate-300/40 mx-2 shrink-0" />
            <button onClick={() => { setFilterCategory('all'); triggerHaptic('light'); }} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap curvy-btn ${filterCategory === 'all' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}>All</button>
            {CATEGORIES.map(cat => (
              <button key={cat.value} onClick={() => { setFilterCategory(cat.value); triggerHaptic('light'); }} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap curvy-btn ${filterCategory === cat.value ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500'}`}>{cat.label}</button>
            ))}
        </div>

        <main className="flex-1 flex flex-col gap-10">
          {(Object.entries(groupedTodos) as [string, Todo[]][]).map(([name, items]) => items.length > 0 && (
            <section key={name} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center gap-4 px-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400/70 shrink-0">{name}</h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200/50 to-transparent" />
              </div>
              <div className="flex flex-col gap-5 w-full">{renderCategorizedList(items)}</div>
            </section>
          ))}
          {todos.length === 0 && (
            <div className="text-center py-20 opacity-20 flex flex-col items-center gap-6">
              <Sun size={48} className="text-sky-300 animate-pulse" />
              <p className="font-black text-xl tracking-tighter uppercase">Clear Skies</p>
            </div>
          )}
        </main>

        <Footer
          onPurge={() => {
            if(confirm("Permanently erase everything? This includes all your tasks and custom templates.")) {
              setTodos([]);
              setTemplates([]);
              localStorage.removeItem('curvycloud_todos');
              localStorage.removeItem('curvycloud_templates');
              localStorage.removeItem('curvycloud_onboarding_seen');
              window.location.reload();
            }
          }}
        />

        <ApiKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} hasApiKey={hasApiKey} onConnect={handleConnectKey} />

        <LibraryModal
          isOpen={isTemplatesOpen}
          onClose={() => setIsTemplatesOpen(false)}
          templates={templates}
          setTemplates={setTemplates}
          onDeploy={(tmpl) => {
            setReviewingTemplate(tmpl);
            setSelectedReviewIndices(new Set(tmpl.items.map((_, i) => i)));
            setIsTemplatesOpen(false);
            triggerHaptic('medium');
          }}
          capitalize={capitalize}
        />

        <ReviewModal
          template={reviewingTemplate}
          onClose={() => setReviewingTemplate(null)}
          selectedIndices={selectedReviewIndices}
          onToggleIndex={(idx) => {
            const next = new Set(selectedReviewIndices);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            setSelectedReviewIndices(next);
            triggerHaptic('light');
          }}
          onToggleAll={() => {
            if (selectedReviewIndices.size === reviewingTemplate?.items.length) setSelectedReviewIndices(new Set());
            else setSelectedReviewIndices(new Set(reviewingTemplate?.items.map((_, i) => i)));
          }}
          onManifest={() => {
            if (!reviewingTemplate) return;
            triggerHaptic('success');
            const itemsToCreate = reviewingTemplate.items.filter((_, i) => selectedReviewIndices.has(i));
            const newTodos: Todo[] = itemsToCreate.map((text: string) => ({
              id: Math.random().toString(36).substring(2, 9),
              text,
              completed: false,
              createdAt: Date.now(),
              category: reviewingTemplate.category,
              priority: reviewingTemplate.priority || 'medium',
              tags: reviewingTemplate.tags,
              templateName: reviewingTemplate.name
            }));
            setTodos(prev => [...newTodos, ...prev]);
            setReviewingTemplate(null);
          }}
          onAddItem={(item) => {
            if (!item.trim() || !reviewingTemplate) return;
            const newItem = capitalize(item.trim());
            const newItems = [...reviewingTemplate.items, newItem];
            const newIndex = newItems.length - 1;
            setTemplates(prev => prev.map(tmpl => tmpl.id === reviewingTemplate.id ? { ...tmpl, items: newItems } : tmpl));
            setReviewingTemplate({ ...reviewingTemplate, items: newItems });
            setSelectedReviewIndices(prev => new Set(prev).add(newIndex));
            triggerHaptic('light');
          }}
          capitalize={capitalize}
        />
      </div>
    </div>
  );
};

export default App;
