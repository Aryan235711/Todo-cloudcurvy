
import { useState, useEffect, useCallback, useRef, useMemo, type FormEvent } from 'react';
import { Todo, Template, Priority, Category } from '../types';
import { getSmartMotivation, generateTemplateFromPrompt, refineTaskMetadata } from '../services/geminiService';
import { triggerHaptic, sendNudge, requestNotificationPermission } from '../services/notificationService';
import { getStoredApiKey } from '../services/apiKeyService';
import { getVoiceMode, startNativeVoice, stopNativeVoice } from '../services/speechService';

export const useTodoLogic = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activePriority, setActivePriority] = useState<Priority>('low');
  const [sortMode, setSortMode] = useState<'smart' | 'newest' | 'priority' | 'category'>('smart');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [motivation, setMotivation] = useState("Let's make today productive!");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'native' | 'web' | 'none'>('none');
  
  const [reviewingTemplate, setReviewingTemplate] = useState<Template | null>(null);
  const [selectedReviewIndices, setSelectedReviewIndices] = useState<Set<number>>(new Set());
  
  const recognitionRef = useRef<any>(null);
  const lastMotivationUpdate = useRef<number>(0);

  const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  // API Key Check
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
        return;
      }

      // Local dev fallback: when running via Vite, `vite.config.ts` injects
      // `process.env.API_KEY`/`process.env.GEMINI_API_KEY` from `.env.local`.
      // This keeps AI features usable outside AI Studio.
      const envKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
      if (envKey) {
        setHasApiKey(true);
        return;
      }

      const stored = await getStoredApiKey();
      setHasApiKey(Boolean(stored));
    };
    checkKey();
  }, []);

  // Neural Nudge Logic
  useEffect(() => {
    const nudgeInterval = setInterval(() => {
      const pending = todos.filter(t => !t.completed);
      if (pending.length === 0) return;
      const staleHigh = pending.find(t => t.priority === 'high' && (!t.lastNotified || Date.now() - t.lastNotified > 7200000));
      if (staleHigh) {
        void (async () => {
          const sent = await sendNudge("Urgent Intent", `"${staleHigh.text}" is drifting. Re-center your focus.`);
          if (!sent) return;
          setTodos(prev => prev.map(t => t.id === staleHigh.id ? { ...t, lastNotified: Date.now() } : t));
        })();
      }
    }, 60000); 
    return () => clearInterval(nudgeInterval);
  }, [todos]);

  // Storage Persistence
  useEffect(() => {
    const savedTodos = localStorage.getItem('curvycloud_todos');
    const savedTemplates = localStorage.getItem('curvycloud_templates');
    if (savedTodos) try { setTodos(JSON.parse(savedTodos)); } catch (e) {}
    if (savedTemplates) try { setTemplates(JSON.parse(savedTemplates)); } catch (e) {}
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem('curvycloud_todos', JSON.stringify(todos));
      localStorage.setItem('curvycloud_templates', JSON.stringify(templates));
    }
  }, [todos, templates, isInitialLoad]);

  // AI Motivation
  useEffect(() => {
    const updateMotivation = async () => {
      if (!hasApiKey) return;
      if (Date.now() - lastMotivationUpdate.current < 15000) return;
      try {
        const msg = await getSmartMotivation(todos.filter(t => !t.completed).length);
        setMotivation(msg);
        lastMotivationUpdate.current = Date.now();
      } catch (e) {}
    };
    if (todos.length > 0) {
      const timeout = setTimeout(updateMotivation, 2000);
      return () => clearTimeout(timeout);
    }
  }, [todos.length, hasApiKey]);

  // Voice recognition init (native plugin on mobile, Web Speech on browser)
  useEffect(() => {
    void (async () => {
      const mode = await getVoiceMode();
      setVoiceMode(mode);

      if (mode !== 'web') return;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => (prev ? prev + ' ' + capitalize(transcript) : capitalize(transcript)));
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    })();
  }, []);

  const toggleVoice = () => {
    if (voiceMode === 'none') {
      triggerHaptic('warning');
      return;
    }

    if (voiceMode === 'native') {
      if (isListening) {
        void stopNativeVoice().finally(() => setIsListening(false));
        return;
      }
      setIsListening(true);
      void (async () => {
        try {
          const transcript = await startNativeVoice({ prompt: 'Speak your task' });
          if (transcript) setInputValue(prev => (prev ? prev + ' ' + capitalize(transcript) : capitalize(transcript)));
        } finally {
          setIsListening(false);
        }
      })();
      return;
    }

    // web
    if (isListening) recognitionRef.current?.stop();
    else { setIsListening(true); recognitionRef.current?.start(); }
  };

  const handleError = (err: any) => {
    const msg = err.message || "";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      setAiError("AI Quota Exhausted. Please check your Gemini plan/billing.");
      triggerHaptic('warning');
    } else if (msg.includes("Requested entity was not found")) {
      setHasApiKey(false);
      setAiError("API Key invalid or not found. Please re-link.");
    } else {
      setAiError("AI Manifestation interrupted. Please try again.");
    }
    setTimeout(() => setAiError(null), 6000);
  };

  const handleAddTodo = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    triggerHaptic(activePriority === 'high' ? 'heavy' : 'light');
    const newId = Math.random().toString(36).substring(2, 9);
    const initialTodo: Todo = {
      id: newId,
      text: capitalize(inputValue.trim()),
      completed: false,
      createdAt: Date.now(),
      category: 'other',
      priority: activePriority,
      tags: []
    };
    
    setTodos(prev => [initialTodo, ...prev]);
    setInputValue('');

    if (hasApiKey) {
      try {
        const refined = await refineTaskMetadata(initialTodo.text);
        setTodos(prev => prev.map(t => t.id === newId ? { 
          ...t, 
          ...refined, 
          category: refined.category as Category, 
          priority: refined.isUrgent ? 'high' : t.priority 
        } : t));
      } catch (err) {
        handleError(err);
      }
    }
  };

  const handleMagicTemplate = async () => {
    if (!inputValue.trim()) return;
    if (!hasApiKey) return 'OPEN_KEY_MODAL';
    
    setIsMagicLoading(true);
    setAiError(null);
    triggerHaptic('medium');
    try {
      const data = await generateTemplateFromPrompt(inputValue);
      const newTemplate: Template = {
        id: Math.random().toString(36).substring(2, 9),
        name: capitalize(data.name),
        items: data.items.map(i => capitalize(i)),
        category: data.category as Category,
        tags: data.tags,
        priority: 'medium'
      };
      setTemplates(prev => [newTemplate, ...prev]);
      setInputValue('');
      setReviewingTemplate(newTemplate);
      setSelectedReviewIndices(new Set(newTemplate.items.map((_, i) => i)));
    } catch (err) {
       handleError(err);
    } finally {
      setIsMagicLoading(false);
    }
  };

  const filteredTodos = useMemo(() => {
    let list = [...todos];
    if (filterCategory !== 'all') list = list.filter(t => t.category === filterCategory);
    const pMap = { high: 3, medium: 2, low: 1 };
    if (sortMode === 'smart') {
      return list.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        if (pMap[a.priority] !== pMap[b.priority]) return pMap[b.priority] - pMap[a.priority];
        return b.createdAt - a.createdAt;
      });
    }
    if (sortMode === 'newest') list.sort((a, b) => b.createdAt - a.createdAt);
    else if (sortMode === 'priority') {
      list.sort((a, b) => {
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        return pMap[b.priority] - pMap[a.priority];
      });
    }
    return list;
  }, [todos, sortMode, filterCategory]);

  const groupedTodos = useMemo(() => {
    const groups: Record<string, Todo[]> = { Today: [], Yesterday: [], Earlier: [] };
    const now = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    filteredTodos.forEach(t => {
      const d = new Date(t.createdAt).toDateString();
      if (d === now) groups.Today.push(t);
      else if (d === yesterday) groups.Yesterday.push(t);
      else groups.Earlier.push(t);
    });
    return groups;
  }, [filteredTodos]);

  return {
    todos, setTodos,
    templates, setTemplates,
    inputValue, setInputValue,
    activePriority, setActivePriority,
    sortMode, setSortMode,
    filterCategory, setFilterCategory,
    motivation,
    isListening, toggleVoice,
    voiceMode,
    hasApiKey, setHasApiKey,
    aiError, setAiError,
    isMagicLoading,
    reviewingTemplate, setReviewingTemplate,
    selectedReviewIndices, setSelectedReviewIndices,
    groupedTodos,
    handleAddTodo,
    handleMagicTemplate,
    capitalize
  };
};
