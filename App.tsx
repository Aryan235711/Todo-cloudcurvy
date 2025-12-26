
import React, { useCallback, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { registerPushNotifications, requestNotificationPermission, triggerHaptic, getBehavioralInsights, getNotificationStats } from './services/notificationService';
import { crashReportingService } from './services/crashReportingService';
import { analyticsService } from './services/analyticsService';
import { preferencesService } from './services/preferencesService';
import { userPreferencesService } from './services/userPreferencesService';
import { AlertTriangle, Sun, WifiOff, X } from 'lucide-react';
import { Todo } from './types';
import { TodoCard } from './components/TodoCard';
import { Onboarding } from './components/Onboarding';
import { useTodoLogic } from './hooks/useTodoLogic';
import { ApiKeyModal } from './components/modals/ApiKeyModal';
import { LibraryModal } from './components/modals/LibraryModal';
import { ReviewModal } from './components/modals/ReviewModal';
import { promptForApiKey, setStoredApiKey } from './services/apiKeyService';
import { validateApiKey } from './services/geminiService';
import { SettingsModal } from './components/modals/SettingsModal';
import { HelpTooltip } from './components/ui/HelpTooltip';

// Refactored Modular Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { TodoInput } from './components/features/todo/TodoInput';
import { TodoBundle } from './components/features/todo/TodoBundle';
import { CustomConfirmModal } from './components/modals/CustomConfirmModal';
import { NeuralNudgeDashboard } from './components/modals/NeuralNudgeDashboard';
import { UnifiedTestDashboard } from './components/UnifiedTestDashboard';
import { CATEGORIES } from './constants';

// Import test runner for development
if (process.env.NODE_ENV === 'development') {
  import('./tests/testRunner').then(({ runComprehensiveTests, removeDebugLogs }) => {
    (window as any).runTests = runComprehensiveTests;
    (window as any).removeDebugLogs = removeDebugLogs;
    console.log('🧪 Test commands available: runTests(), removeDebugLogs()');
  });
}

const App: React.FC = () => {
  const [showTestDashboard, setShowTestDashboard] = useState(false);
  const [showCustomPurgeModal, setShowCustomPurgeModal] = useState(false);
  const [isNeuralNudgeOpen, setIsNeuralNudgeOpen] = useState(false);
  const [neuralNudgeData, setNeuralNudgeData] = useState<{
    procrastinationRisk: 'low' | 'medium' | 'high';
    streak: number;
    engagement: number;
    isQuietTime: boolean;
    nextOptimalDelay: number;
    isActive: boolean;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const {
    todos,
    templates,
    addTodo,
    deleteTodo, 
    updateTodo,
    addTemplate,
    deleteTemplate,
    inputValue, setInputValue,
    activePriority, setActivePriority,
    sortMode, setSortMode,
    filterCategory, setFilterCategory,
    motivation,
    isListening, toggleVoice,
    voiceMode,
    hasApiKey, setHasApiKey,
    aiError, setAiError,
    notificationHint, setNotificationHint,
    voiceHint, setVoiceHint,
    isMagicLoading,
    reviewingTemplate, setReviewingTemplate,
    selectedReviewIndices, setSelectedReviewIndices,
    groupedTodos,
    handleAddTodo,
    handleMagicTemplate,
    capitalize,
    isOnline
  } = useTodoLogic();

  // Initialize services and event listeners
  useEffect(() => {
    const initializeServices = async () => {
      if (Capacitor.isNativePlatform()) {
        await registerPushNotifications();
      }
      await requestNotificationPermission();
      
      // Initialize analytics and preferences
      analyticsService.init();
      preferencesService.init();
      
      // Apply saved theme
      const prefs = userPreferencesService.getPreferences();
      document.documentElement.setAttribute('data-theme', prefs.ui.theme);
    };
    initializeServices();
    
    crashReportingService.init();
    
    // Listen for long-press selection mode activation
    const handleEnterSelectionMode = () => {
      setIsSelectionMode(true);
    };
    
    window.addEventListener('enterSelectionMode', handleEnterSelectionMode);
    
    return () => {
      window.removeEventListener('enterSelectionMode', handleEnterSelectionMode);
    };
  }, []);

  // Update Neural Nudge data periodically
  useEffect(() => {
    const updateNeuralNudgeData = () => {
      try {
        const insights = getBehavioralInsights();
        const stats = getNotificationStats();
        
        setNeuralNudgeData({
          ...insights,
          streak: stats.streak,
          engagement: stats.engagementScore,
          isQuietTime: stats.isQuietTime,
          nextOptimalDelay: stats.nextOptimalDelay,
          isActive: insights.procrastinationRisk !== 'low'
        });
      } catch (error) {
        // Silent error handling in production
      }
    };

    updateNeuralNudgeData();
    const interval = setInterval(updateNeuralNudgeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [todos]);

  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set());
  const [sectionVisibleCounts, setSectionVisibleCounts] = useState<Record<string, number>>({});
  const [completedSectionsOpen, setCompletedSectionsOpen] = useState<Record<string, boolean>>({});
  const [completedVisibleCounts, setCompletedVisibleCounts] = useState<Record<string, number>>({});
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());

  const SECTION_INITIAL = 10;
  const SECTION_STEP = 10;
  const SECTION_CAP = 50;

  const handleConnectKey = useCallback(async (manualKey?: string | null) => {
    try {
      let maybeKey = manualKey;

      // If no manual key was provided, attempt the platform-native prompt (returns null on web)
      if (typeof maybeKey === 'undefined') {
        maybeKey = await promptForApiKey();
      }

      if (maybeKey) {
        setAiError('Validating API key…');
        const validation = await validateApiKey(maybeKey);
        if (validation === 'invalid') {
          setHasApiKey(false);
          setAiError('That API key looks invalid. Please paste a valid AI API key.');
          triggerHaptic('warning');
          return;
        }

        await setStoredApiKey(maybeKey);
        setHasApiKey(true);
        setIsKeyModalOpen(false);
        setAiError(validation === 'quota' ? 'API key saved, but quota appears exhausted on this key.' : null);
        if (validation === 'quota') triggerHaptic('warning');
        return;
      }

      // If we reach here, no key was obtained. In web contexts we expect the ApiKeyModal
      // to show an inline non-blocking input (handled there). Surface a user-facing
      // message so they know how to proceed.
      setAiError('No key manager available. Please paste an API key manually.');
    } catch {
      setAiError('Failed to connect API key. Please try again.');
      triggerHaptic('warning');
    }
  }, [setAiError, setHasApiKey]);

  const handleToggleBundleCompletion = useCallback((bundleName: string, shouldComplete: boolean) => {
    const tmpl = templates.find(t => t.name === bundleName);
    if (shouldComplete) triggerHaptic(tmpl?.priority === 'high' ? 'success' : 'medium');
    todos.forEach(todo => {
      if (todo.templateName === bundleName) {
        updateTodo(todo.id, { completed: shouldComplete });
      }
    });
  }, [templates, todos, updateTodo]);

  const toggleBundle = useCallback((bundleName: string) => {
    setExpandedBundles(prev => {
      const next = new Set(prev);
      if (next.has(bundleName)) next.delete(bundleName); else next.add(bundleName);
      return next;
    });
    triggerHaptic('light');
  }, []);

  const handleTodoToggle = useCallback((id: string) => {
    const item = todos.find(i => i.id === id);
    if (item && !item.completed) {
      triggerHaptic(item.priority === 'high' ? 'success' : 'medium');
      // Track completion for analytics
      analyticsService.trackTaskCompleted(id);
      updateTodo(id, { completed: true, completedAt: Date.now() });
    } else {
      // Handle restore from completed (clear completedAt)
      updateTodo(id, { 
        completed: !item?.completed, 
        completedAt: item?.completed ? undefined : Date.now() 
      });
    }
  }, [todos, updateTodo]);

  const handleTodoDelete = useCallback((id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      analyticsService.trackTaskAbandoned(id);
      deleteTodo(id);
    }
    triggerHaptic('heavy');
  }, [todos, deleteTodo]);

  const handleTodoEdit = useCallback((id: string, newText: string) => {
    if (!newText.trim()) return;
    
    const todo = todos.find(t => t.id === id);
    if (todo) {
      // Track edit for analytics
      analyticsService.trackTaskEdited(id, todo.text, newText.trim());
      
      // Add to edit history
      const editEntry = {
        timestamp: Date.now(),
        oldText: todo.text,
        newText: newText.trim(),
        type: 'text' as const
      };
      
      updateTodo(id, { 
        text: capitalize(newText.trim()),
        editHistory: [...(todo.editHistory || []), editEntry]
      });
    }
    triggerHaptic('light');
  }, [todos, updateTodo, capitalize]);

  const handleTodoPriorityChange = useCallback((id: string, priority: 'low' | 'medium' | 'high') => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      // Track priority change for analytics
      analyticsService.trackPriorityChanged(id, todo.priority, priority);
      
      updateTodo(id, { priority });
    }
    triggerHaptic('light');
  }, [todos, updateTodo]);

  // Clean up selection state when todos change
  useEffect(() => {
    const activeTodoIds = new Set(todos.map(t => t.id));
    setSelectedTodos(prev => {
      const filtered = new Set([...prev].filter(id => activeTodoIds.has(id)));
      return filtered.size !== prev.size ? filtered : prev;
    });
  }, [todos]);

  // Remove debug logs in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const originalLog = console.log;
      console.log = (...args) => {
        const message = args.join(' ');
        if (!message.includes('🔥')) {
          originalLog(...args);
        }
      };
    }
  }, []);

  const handleSelectTodo = useCallback((id: string) => {
    setSelectedTodos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    // Actually remove tasks instead of soft delete
    selectedTodos.forEach(id => deleteTodo(id));
    
    // Track abandoned tasks for analytics
    selectedTodos.forEach(id => {
      analyticsService.trackTaskAbandoned(id);
    });
    
    setSelectedTodos(new Set());
    setIsSelectionMode(false);
    triggerHaptic('heavy');
  }, [selectedTodos, deleteTodo]);

  const handleBulkPriority = useCallback((priority: 'low' | 'medium' | 'high') => {
    selectedTodos.forEach(id => updateTodo(id, { priority }));
    setSelectedTodos(new Set());
    setIsSelectionMode(false);
    triggerHaptic('medium');
  }, [selectedTodos, updateTodo]);

  const handleBundleDelete = useCallback((bundleName: string) => {
    // Actually remove bundle tasks instead of soft delete
    const bundleTasks = todos.filter(t => t.templateName === bundleName);
    bundleTasks.forEach(task => {
      deleteTodo(task.id);
      analyticsService.trackTaskAbandoned(task.id);
    });
    
    triggerHaptic('heavy');
  }, [deleteTodo, todos]);

  const handleUpdateSubtasks = useCallback((id: string, steps: string[]) => {
    updateTodo(id, { subTasks: steps });
  }, [updateTodo]);

  type BundleNode = { type: 'bundle'; name: string; items: Todo[] };
  const isBundleNode = (node: Todo | BundleNode): node is BundleNode => 'type' in node;

  const buildCategorizedNodes = (items: Todo[]) => {
    const nodes: (Todo | BundleNode)[] = [];
    const bundleItemsByName = new Map<string, Todo[]>();

    items.forEach(todo => {
      const bundleName = todo.templateName;
      if (bundleName) {
        let bucket = bundleItemsByName.get(bundleName);
        if (!bucket) {
          bucket = [];
          bundleItemsByName.set(bundleName, bucket);
          nodes.push({ type: 'bundle', name: bundleName, items: bucket });
        }
        bucket.push(todo);
      } else {
        nodes.push(todo);
      }
    });

    return nodes;
  };

  const renderCategorizedNode = (node: Todo | BundleNode, _idx: number) => {
    if (isBundleNode(node)) {
      const tmpl = templates.find(t => t.name === node.name);
      return (
        <TodoBundle
          key={`bundle-${node.name}`}
          name={node.name}
          items={node.items}
          isExpanded={expandedBundles.has(node.name)}
          onToggleExpand={() => toggleBundle(node.name)}
          onToggleComplete={(val) => handleToggleBundleCompletion(node.name, val)}
          onTodoToggle={handleTodoToggle}
          onTodoDelete={handleTodoDelete}
          onTodoEdit={handleTodoEdit}
          onUpdateSubtasks={handleUpdateSubtasks}
          onBundleDelete={handleBundleDelete}
          onPriorityChange={handleTodoPriorityChange}
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
        onEdit={handleTodoEdit}
        onUpdateSubtasks={handleUpdateSubtasks}
        onPriorityChange={handleTodoPriorityChange}
        isSelectionMode={isSelectionMode}
        isSelected={selectedTodos.has(node.id)}
        onSelect={handleSelectTodo}
      />
    );
  };

  React.useEffect(() => {
    const onboardingSeen = localStorage.getItem('curvycloud_onboarding_seen');
    setShowOnboarding(onboardingSeen !== 'true');
  }, []);

  const handleFinishOnboarding = () => {
    localStorage.setItem('curvycloud_onboarding_seen', 'true');
    setShowOnboarding(false);

    const prompted = localStorage.getItem('curvycloud_notifications_prompted') === 'true';
    if (!prompted) {
      localStorage.setItem('curvycloud_notifications_prompted', 'true');
      void (async () => {
        try {
          await requestNotificationPermission();
        } catch {
          // ignore
        }
      })();
    }
  };

  if (showOnboarding === null) return null;
  if (showOnboarding) return <Onboarding onComplete={handleFinishOnboarding} />;
  if (showTestDashboard) return <UnifiedTestDashboard />;

  return (
    <div className="app-scroller no-scrollbar">
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 md:py-12 lg:py-16 flex flex-col min-h-full">
        {/* Responsive container: 
            Mobile: full width with padding
            Tablet: 90% width 
            Desktop: 85% width
            Large: 80% width with max constraints */}
        <Header
          onShowOnboarding={() => { setShowOnboarding(true); triggerHaptic('medium'); }}
          onOpenSettings={() => { setIsSettingsOpen(true); triggerHaptic('medium'); }}
          onOpenLibrary={() => { setIsTemplatesOpen(true); triggerHaptic('medium'); }}
          onOpenNeuralNudge={() => { setIsNeuralNudgeOpen(true); triggerHaptic('medium'); }}
          hasApiKey={hasApiKey}
          templatesCount={templates.length}
          motivation={motivation}
          neuralNudgeData={neuralNudgeData}
        />

        {/* Unified Test Dashboard */}
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
          <button
            onClick={() => setShowTestDashboard(true)}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            🧪 Test Suite Dashboard
          </button>
          <p className="text-xs text-indigo-600 mt-2 text-center">
            Neural nudge • Phase 1 stability • Phase 2 testing infrastructure
          </p>
        </div>

        {!isOnline && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm"><WifiOff size={24} /></div>
            <p className="text-sm font-black text-amber-800 tracking-tight leading-snug">Working offline. Core features available, AI disabled.</p>
          </div>
        )}

        {aiError && (
          <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
             <div className="p-3 bg-white rounded-2xl text-rose-500 shadow-sm"><AlertTriangle size={24} /></div>
             <p className="text-sm font-black text-rose-800 tracking-tight leading-snug">{aiError}</p>
             <button aria-label="Dismiss error" onClick={() => setAiError(null)} className="ml-auto text-rose-300 hover:text-rose-500"><X size={20} /></button>
          </div>
        )}

        {!aiError && notificationHint && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm"><AlertTriangle size={24} /></div>
            <p className="text-sm font-black text-amber-800 tracking-tight leading-snug">{notificationHint}</p>
            <button aria-label="Dismiss notification hint" onClick={() => setNotificationHint(null)} className="ml-auto text-amber-300 hover:text-amber-600"><X size={20} /></button>
          </div>
        )}

        {!aiError && !notificationHint && voiceHint && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm"><AlertTriangle size={24} /></div>
            <p className="text-sm font-black text-amber-800 tracking-tight leading-snug">{voiceHint}</p>
            <button aria-label="Dismiss voice hint" onClick={() => setVoiceHint(null)} className="ml-auto text-amber-300 hover:text-amber-600"><X size={20} /></button>
          </div>
        )}

        <TodoInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          activePriority={activePriority}
          setActivePriority={setActivePriority}
          isListening={isListening}
          toggleVoice={toggleVoice}
          voiceMode={voiceMode}
          isMagicLoading={isMagicLoading}
          onMagic={async () => { const res = await handleMagicTemplate(); if (res === 'OPEN_KEY_MODAL') setIsKeyModalOpen(true); }}
          onSubmit={handleAddTodo}
        />

        <div className="flex items-center gap-2 bg-white/30 p-2 rounded-[1.8rem] border border-white/40 overflow-x-auto no-scrollbar mb-10 w-full">
            <button aria-pressed={sortMode === 'smart'} onClick={() => { setSortMode('smart'); triggerHaptic('light'); }} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap curvy-btn ${sortMode === 'smart' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Smart</button>
            <button aria-pressed={sortMode === 'newest'} onClick={() => { setSortMode('newest'); triggerHaptic('light'); }} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap curvy-btn ${sortMode === 'newest' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Newest</button>
            <button aria-pressed={sortMode === 'priority'} onClick={() => { setSortMode('priority'); triggerHaptic('light'); }} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap curvy-btn ${sortMode === 'priority' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Priority</button>
            <HelpTooltip 
              content="Smart: AI-powered sorting based on urgency, deadlines, and priority. Newest: Most recently created tasks first. Priority: High → Medium → Low priority order."
              position="bottom"
            />
            <div className="w-[1px] h-5 bg-slate-300/40 mx-2 shrink-0" />
            <button aria-pressed={filterCategory === 'all'} onClick={() => { setFilterCategory('all'); triggerHaptic('light'); }} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap curvy-btn ${filterCategory === 'all' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}>All</button>
            {CATEGORIES.map(cat => (
              <button aria-pressed={filterCategory === cat.value} key={cat.value} onClick={() => { setFilterCategory(cat.value); triggerHaptic('light'); }} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap curvy-btn ${filterCategory === cat.value ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500'}`}>{cat.label}</button>
            ))}
        </div>

        {/* Bulk Operations Toolbar */}
        {isSelectionMode && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-indigo-800">
                {selectedTodos.size > 0 ? `${selectedTodos.size} selected` : 'Long-press tasks to select'}
              </p>
              {selectedTodos.size === 0 && (
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-300" />
                </div>
              )}
              <button 
                onClick={() => { setIsSelectionMode(false); setSelectedTodos(new Set()); triggerHaptic('light'); }}
                className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all curvy-btn"
              >
                Done
              </button>
            </div>
            {selectedTodos.size > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleBulkPriority('high')} className="px-3 py-2 bg-rose-500 text-white text-xs font-bold rounded-lg transition-all curvy-btn">High Priority</button>
                <button onClick={() => handleBulkPriority('medium')} className="px-3 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg transition-all curvy-btn">Medium Priority</button>
                <button onClick={() => handleBulkPriority('low')} className="px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all curvy-btn">Low Priority</button>
                <button onClick={handleBulkDelete} className="px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg transition-all curvy-btn">Delete All</button>
              </div>
            )}
          </div>
        )}

        <main className="flex-1 flex flex-col gap-6 lg:gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12">
            {(Object.entries(groupedTodos) as [string, Todo[]][]).map(([name, items]) => {
              if (items.length === 0) return null;
              const nodes = buildCategorizedNodes(items);

              const activeNodes: (Todo | BundleNode)[] = [];
              const completedNodes: (Todo | BundleNode)[] = [];
              for (const node of nodes) {
                if (isBundleNode(node)) {
                  const isBundleComplete = node.items.length > 0 && node.items.every(t => t.completed);
                  if (isBundleComplete) completedNodes.push(node);
                  else activeNodes.push(node);
                } else {
                  if (node.completed) completedNodes.push(node);
                  else activeNodes.push(node);
                }
              }

              const totalActive = activeNodes.length;
              const requestedActive = sectionVisibleCounts[name] ?? SECTION_INITIAL;
              const visibleActive = Math.min(requestedActive, totalActive, SECTION_CAP);
              const canShowMoreActive = visibleActive < totalActive && visibleActive < SECTION_CAP;
              const isActiveCapped = visibleActive >= SECTION_CAP && totalActive > SECTION_CAP;
              const canCollapseActive = visibleActive > SECTION_INITIAL;

              const totalCompleted = completedNodes.length;
              const completedOpen = completedSectionsOpen[name] ?? false;
              const requestedCompleted = completedVisibleCounts[name] ?? SECTION_INITIAL;
              const visibleCompleted = Math.min(requestedCompleted, totalCompleted, SECTION_CAP);
              const canShowMoreCompleted = visibleCompleted < totalCompleted && visibleCompleted < SECTION_CAP;
              const isCompletedCapped = visibleCompleted >= SECTION_CAP && totalCompleted > SECTION_CAP;
              const canCollapseCompleted = visibleCompleted > SECTION_INITIAL;

              return (
                <section key={name} className="flex flex-col gap-4 lg:gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="flex items-center gap-3 lg:gap-4 px-2 lg:px-4">
                    <h2 className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.25em] lg:tracking-[0.3em] text-slate-400/70 shrink-0">
                      {name}
                      {name === 'Today' ? ` (${items.filter(t => !t.completed).length})` : ''}
                    </h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200/50 to-transparent" />
                  </div>

                  <div className="flex flex-col gap-3 lg:gap-4 w-full">{activeNodes.slice(0, visibleActive).map(renderCategorizedNode)}</div>

                {(canShowMoreActive || isActiveCapped || canCollapseActive) && (
                  <div className="px-2 lg:px-4 flex flex-col gap-2 lg:gap-3">
                    {canShowMoreActive && (
                      <button
                        type="button"
                        onClick={() => {
                          setSectionVisibleCounts(prev => ({
                            ...prev,
                            [name]: Math.min((prev[name] ?? SECTION_INITIAL) + SECTION_STEP, SECTION_CAP)
                          }));
                          triggerHaptic('light');
                        }}
                        className="w-full py-2.5 lg:py-3 rounded-2xl bg-indigo-600 text-white shadow-lg text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] lg:tracking-[0.25em] curvy-btn"
                      >
                        Show {Math.min(SECTION_STEP, totalActive - visibleActive)} more
                      </button>
                    )}

                    {canCollapseActive && (
                      <button
                        type="button"
                        onClick={() => {
                          setSectionVisibleCounts(prev => ({ ...prev, [name]: SECTION_INITIAL }));
                          triggerHaptic('light');
                        }}
                        className="w-full py-2.5 lg:py-3 rounded-2xl bg-slate-800 text-white shadow-lg text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] lg:tracking-[0.25em] curvy-btn"
                      >
                        Show less
                      </button>
                    )}

                    {isActiveCapped && !canShowMoreActive && (
                      <div className="w-full py-2.5 lg:py-3 rounded-2xl bg-white/30 border border-white/40 text-slate-400 text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] lg:tracking-[0.25em] text-center">
                        Showing {SECTION_CAP} of {totalActive}
                      </div>
                    )}
                  </div>
                )}

                {totalCompleted > 0 && (
                  <div className="px-2 lg:px-4 flex flex-col gap-2 lg:gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCompletedSectionsOpen(prev => ({ ...prev, [name]: !(prev[name] ?? false) }));
                        triggerHaptic('light');
                      }}
                      className="w-full py-2.5 lg:py-3 rounded-2xl bg-white/40 border border-white/50 text-slate-600 text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] lg:tracking-[0.25em] curvy-btn"
                      aria-expanded={completedOpen}
                    >
                      {completedOpen ? `Hide completed (${totalCompleted})` : `Completed (${totalCompleted})`}
                    </button>

                    {completedOpen && (
                      <>
                        <div className="flex flex-col gap-3 lg:gap-4 w-full">{completedNodes.slice(0, visibleCompleted).map(renderCategorizedNode)}</div>

                        {(canShowMoreCompleted || isCompletedCapped || canCollapseCompleted) && (
                          <div className="flex flex-col gap-2 lg:gap-3">
                            {canShowMoreCompleted && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletedVisibleCounts(prev => ({
                                    ...prev,
                                    [name]: Math.min((prev[name] ?? SECTION_INITIAL) + SECTION_STEP, SECTION_CAP)
                                  }));
                                  triggerHaptic('light');
                                }}
                                className="w-full py-2.5 lg:py-3 rounded-2xl bg-indigo-600 text-white shadow-lg text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] lg:tracking-[0.25em] curvy-btn"
                              >
                                Show {Math.min(SECTION_STEP, totalCompleted - visibleCompleted)} more
                              </button>
                            )}

                            {canCollapseCompleted && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletedVisibleCounts(prev => ({ ...prev, [name]: SECTION_INITIAL }));
                                  triggerHaptic('light');
                                }}
                                className="w-full py-2.5 lg:py-3 rounded-2xl bg-slate-800 text-white shadow-lg text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] lg:tracking-[0.25em] curvy-btn"
                              >
                                Show less
                              </button>
                            )}

                            {isCompletedCapped && !canShowMoreCompleted && (
                              <div className="w-full py-2.5 lg:py-3 rounded-2xl bg-white/30 border border-white/40 text-slate-400 text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] lg:tracking-[0.25em] text-center">
                                Showing {SECTION_CAP} of {totalCompleted}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </section>
            );
          })}
          </div>
          {todos.length === 0 && (
            <div className="text-center py-20 opacity-20 flex flex-col items-center gap-6">
              <Sun size={48} className="text-sky-300 animate-pulse" />
              <p className="font-black text-xl tracking-tighter uppercase">Clear Skies</p>
            </div>
          )}
        </main>

        <Footer
          // Replace native confirm with custom modal
          onPurge={() => setShowCustomPurgeModal(true)}
        />

      {/* Custom Purge Modal */}
      {showCustomPurgeModal && (
        <CustomConfirmModal
          message="Permanently erase everything? This includes all your tasks and custom templates."
          onConfirm={() => {
            todos.forEach(todo => deleteTodo(todo.id));
            templates.forEach(template => deleteTemplate(template.id));
            localStorage.removeItem('curvycloud_todos');
            localStorage.removeItem('curvycloud_templates');
            localStorage.removeItem('curvycloud_onboarding_seen');
            window.location.reload();
            setShowCustomPurgeModal(false);
          }}
          onCancel={() => setShowCustomPurgeModal(false)}
        />
      )}

        {/* Delete Confirmation Modal */}

        <ApiKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} hasApiKey={hasApiKey} onConnect={handleConnectKey} />

        <LibraryModal
          isOpen={isTemplatesOpen}
          onClose={() => setIsTemplatesOpen(false)}
          templates={templates}
          onTemplateUpdate={addTemplate}
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
            newTodos.forEach(todo => addTodo(todo));
            setReviewingTemplate(null);
          }}
          onAddItem={(item) => {
            if (!item.trim() || !reviewingTemplate) return;
            const newItem = capitalize(item.trim());
            const newItems = [...reviewingTemplate.items, newItem];
            const newIndex = newItems.length - 1;
            const updatedTemplate = { ...reviewingTemplate, items: newItems };
            addTemplate(updatedTemplate);
            setReviewingTemplate(updatedTemplate);
            setSelectedReviewIndices(prev => new Set(prev).add(newIndex));
            triggerHaptic('light');
          }}
          capitalize={capitalize}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          hasApiKey={hasApiKey}
          onConnect={handleConnectKey}
        />

        {/* Neural Nudge Dashboard */}
        {neuralNudgeData && (
          <NeuralNudgeDashboard
            isOpen={isNeuralNudgeOpen}
            onClose={() => setIsNeuralNudgeOpen(false)}
            insights={neuralNudgeData}
            stats={neuralNudgeData}
          />
        )}
      </div>
    </div>
  );
};

export default App;
