
import { useState, useEffect, useCallback, useRef, useMemo, type FormEvent } from 'react';
import { Todo, Template, Priority, Category } from '../types';
import { generateTemplateFromPrompt } from '../services/geminiService';
import { triggerHaptic, sendNudge } from '../services/notificationService';
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
  const [notificationHint, setNotificationHint] = useState<string | null>(null);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState<'native' | 'web' | 'none'>('none');
  
  const [reviewingTemplate, setReviewingTemplate] = useState<Template | null>(null);
  const [selectedReviewIndices, setSelectedReviewIndices] = useState<Set<number>>(new Set());
  
  const recognitionRef = useRef<any>(null);
  const lastMotivationUpdate = useRef<number>(0);
  const lastMotivationPending = useRef<number | null>(null);
  const persistTimerRef = useRef<number | null>(null);

  const getLocalMotivation = (pendingCount: number) => {
    if (pendingCount <= 0) return 'Clear skies. Enjoy the calm.';
    const pool = [
      `One intent at a time. (${pendingCount} left)` ,
      `Lightwork. Let’s close one. (${pendingCount} left)`,
      `Small steps compound. (${pendingCount} left)`,
      `Pick the easiest win first. (${pendingCount} left)`,
      `Keep it breezy—just one more. (${pendingCount} left)`,
    ];
    const day = Math.floor(Date.now() / 86_400_000);
    const idx = Math.abs((pendingCount * 31 + day * 7) % pool.length);
    return pool[idx];
  };

  const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  const createId = () => {
    try {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
    } catch {
      // ignore
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  };

  // API Key Check
  useEffect(() => {
    const checkKey = async () => {
      // BYOK precedence: user-provided (stored) key should always win.
      const stored = await getStoredApiKey();
      if (stored) {
        setHasApiKey(true);
        return;
      }

      // Local dev fallback: when running via Vite, `vite.config.ts` injects
      // `process.env.API_KEY`/`process.env.GEMINI_API_KEY` from `.env.local`.
      const envKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
      if (envKey) {
        setHasApiKey(true);
        return;
      }

      // AI Studio (if present) is last.
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
        return;
      }

      setHasApiKey(false);
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
            (async () => {
              try {
                const sent = await sendNudge("Urgent Intent", `"${staleHigh.text}" is drifting. Re-center your focus.`);
                const alreadyShown = localStorage.getItem('curvycloud_notifications_hint_shown') === 'true';
                if (!sent && !alreadyShown) {
                  localStorage.setItem('curvycloud_notifications_hint_shown', 'true');
                  setNotificationHint('Enable notifications to receive nudges.');
                  setTimeout(() => setNotificationHint(null), 8000);
                }
                setTodos(prev => prev.map(t => t.id === staleHigh.id ? { ...t, lastNotified: Date.now() } : t));
              } catch (error) {
                console.error('Nudge notification failed:', error);
                setNotificationHint('Failed to send nudge notification.');
                setTimeout(() => setNotificationHint(null), 8000);
              }
            })();
      }
    }, 60000); 
    return () => clearInterval(nudgeInterval);
  }, [todos]);

  // Storage Persistence
  useEffect(() => {
    const savedTodos = localStorage.getItem('curvycloud_todos');
    const savedTemplates = localStorage.getItem('curvycloud_templates');
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Failed to parse saved todos', e);
      }
    }
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Failed to parse saved templates', e);
      }
    }
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;

    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current);
    }

    // Debounce persistence to keep UI interactions instant.
    persistTimerRef.current = window.setTimeout(() => {
      try {
        // Limit templates to last 500 to prevent storage bloat.
        const limitedTemplates = templates.slice(-500);
        localStorage.setItem('curvycloud_todos', JSON.stringify(todos));
        localStorage.setItem('curvycloud_templates', JSON.stringify(limitedTemplates));
      } catch {
        // ignore storage failures
      }
      persistTimerRef.current = null;
    }, 250);

    return () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [todos, templates, isInitialLoad]);

  // Motivation (local-only; avoids burning API quota)
  // Keep it correct: if pending count changes (esp. to 0), update even if within throttle.
  useEffect(() => {
    if (todos.length === 0) return;

    const pending = todos.filter(t => !t.completed).length;
    const pendingChanged = lastMotivationPending.current === null || pending !== lastMotivationPending.current;

    // When everything is completed, don't let a stale "(1 left)" message linger.
    if (pending === 0) {
      setMotivation(getLocalMotivation(0));
      lastMotivationPending.current = 0;
      lastMotivationUpdate.current = Date.now();
      return;
    }

    // If the count changed, prefer correctness over throttling.
    if (!pendingChanged && Date.now() - lastMotivationUpdate.current < 15000) return;

    const timeout = window.setTimeout(() => {
      setMotivation(getLocalMotivation(pending));
      lastMotivationPending.current = pending;
      lastMotivationUpdate.current = Date.now();
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [todos]);

  // Voice recognition init (native plugin on mobile, Web Speech on browser)
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const mode = await getVoiceMode();
      if (cancelled) return;
      setVoiceMode(mode);

      if (mode !== 'web') return;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => (prev ? prev + ' ' + capitalize(transcript) : capitalize(transcript)));
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => {
        setIsListening(false);
        triggerHaptic('warning');
      };
      recognitionRef.current.onend = () => setIsListening(false);
    })();

    return () => {
      cancelled = true;
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  const toggleVoice = () => {
    if (voiceMode === 'none') {
      const alreadyShown = localStorage.getItem('curvycloud_voice_hint_shown') === 'true';
      if (!alreadyShown) {
        localStorage.setItem('curvycloud_voice_hint_shown', 'true');
        setVoiceHint('Voice input isn’t available on this device/build. Type your intent instead.');
        setTimeout(() => setVoiceHint(null), 8000);
      }
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
        } catch (e: any) {
          const code = (typeof e?.message === 'string' && e.message) ? e.message : '';
          const alreadyShown = localStorage.getItem('curvycloud_voice_hint_shown') === 'true';
          if (!alreadyShown) {
            localStorage.setItem('curvycloud_voice_hint_shown', 'true');
            if (code === 'VOICE_PERMISSION_DENIED') {
              setVoiceHint('Enable microphone & speech permissions to use voice input.');
            } else {
              setVoiceHint('Voice input is unavailable right now.');
            }
            setTimeout(() => setVoiceHint(null), 8000);
          }
          triggerHaptic('warning');
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
    const msg =
      (typeof err?.message === 'string' && err.message) ||
      (typeof err === 'string' && err) ||
      '';
    const upperMsg = msg.toUpperCase();
    const status = err?.status || err?.response?.status;
    const code = err?.code || err?.error?.code;

    if (code === 'AI_COOLDOWN' || upperMsg.includes('AI_COOLDOWN')) {
      setAiError('AI is cooling down to protect your quota. Try again later.');
      triggerHaptic('warning');
    } else if (status === 429 || code === 429 || upperMsg.includes('429') || upperMsg.includes('RESOURCE_EXHAUSTED') || upperMsg.includes('QUOTA')) {
      setAiError('AI quota exhausted. Please check your plan/billing.');
      triggerHaptic('warning');
    } else if (upperMsg.includes('REQUESTED ENTITY WAS NOT FOUND')) {
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
    const newId = createId();
    const initialTodo: Todo = {
      id: newId,
      text: capitalize(inputValue.trim()),
      completed: false,
      createdAt: Date.now(),
      category: 'other',
      priority: activePriority,
      tags: [],
      isUrgent: false
    };
    
    setTodos(prev => [initialTodo, ...prev]);
    setInputValue('');
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
        id: createId(),
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
    notificationHint, setNotificationHint,
    voiceHint, setVoiceHint,
    isMagicLoading,
    reviewingTemplate, setReviewingTemplate,
    selectedReviewIndices, setSelectedReviewIndices,
    groupedTodos,
    handleAddTodo,
    handleMagicTemplate,
    capitalize
  };
};
