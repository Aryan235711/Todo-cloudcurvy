import { create } from 'zustand';
import { Todo, Template } from '../types';

interface TodoStore {
  todos: Todo[];
  templates: Template[];
  addTodo: (todo: Todo) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  addTemplate: (template: Template) => void;
  deleteTemplate: (id: string) => void;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  setTemplates: (templates: Template[]) => void;
  loadTodos: (todos: Todo[]) => void;
  loadTemplates: (templates: Template[]) => void;
}

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  templates: [],
  
  addTodo: (todo) => set((state) => ({ 
    todos: [todo, ...state.todos] 
  })),
  
  deleteTodo: (id) => set((state) => ({ 
    todos: state.todos.filter(t => t.id !== id) 
  })),
  
  updateTodo: (id, updates) => set((state) => ({
    todos: state.todos.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  
  addTemplate: (template) => set((state) => ({ 
    templates: [template, ...state.templates] 
  })),
  
  deleteTemplate: (id) => set((state) => ({ 
    templates: state.templates.filter(t => t.id !== id) 
  })),
  
  updateTemplate: (id, updates) => set((state) => ({
    templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  
  setTemplates: (templates) => set({ templates }),
  
  loadTodos: (todos) => set({ todos }),
  
  loadTemplates: (templates) => set({ templates }),
}));