// IndexedDB Service for Loop Community
// Provides async, non-blocking storage operations

import { safeJsonParse } from '../utils/safeJson';
import { logger } from '../utils/logger';
import { Todo, Template } from '../types';
import { INDEXEDDB_CONFIG, STORAGE_KEYS } from '../constants/storageConstants';

interface LoopDB {
  todos: Todo[];
  templates: Template[];
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly dbName = INDEXEDDB_CONFIG.DATABASE_NAME;
  private readonly version = INDEXEDDB_CONFIG.VERSION;
  private useIndexedDB = true; // Flag to track if IndexedDB is available

  /**
   * Fallback to localStorage if IndexedDB fails
   */
  private getTodosFromLocalStorage(): Todo[] {
    try {
      return safeJsonParse<Todo[]>(localStorage.getItem(STORAGE_KEYS.TODOS), []);
    } catch {
      return [];
    }
  }

  private saveTodosToLocalStorage(todos: Todo[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
    } catch (error) {
      logger.error('[IndexedDB] Failed to save to localStorage fallback:', error);
    }
  }

  private getTemplatesFromLocalStorage(): Template[] {
    try {
      return safeJsonParse<Template[]>(localStorage.getItem(STORAGE_KEYS.TEMPLATES), []);
    } catch {
      return [];
    }
  }

  private saveTemplatesToLocalStorage(templates: Template[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    } catch (error) {
      logger.error('[IndexedDB] Failed to save to localStorage fallback:', error);
    }
  }

  async init(): Promise<void> {
    // Check if IndexedDB is available
    if (typeof indexedDB === 'undefined') {
      logger.warn('[IndexedDB] IndexedDB not available, using localStorage fallback');
      this.useIndexedDB = false;
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        logger.error('[IndexedDB] Failed to open database:', request.error);
        this.useIndexedDB = false; // Fallback to localStorage
        resolve(); // Don't reject - we have fallback
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        logger.log('[IndexedDB] Database opened successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('todos')) {
          const todoStore = db.createObjectStore('todos', { keyPath: 'id' });
          todoStore.createIndex('createdAt', 'createdAt');
          todoStore.createIndex('completed', 'completed');
        }
        
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      };
    });
  }

  async getTodos(): Promise<Todo[]> {
    // Use localStorage fallback if IndexedDB unavailable
    if (!this.useIndexedDB) {
      return this.getTodosFromLocalStorage();
    }

    try {
      if (!this.db) await this.init();
      
      // Check again after init
      if (!this.useIndexedDB) {
        return this.getTodosFromLocalStorage();
      }
    
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['todos'], 'readonly');
        const store = transaction.objectStore('todos');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => {
          logger.warn('[IndexedDB] getTodos failed, falling back to localStorage:', request.error);
          resolve(this.getTodosFromLocalStorage());
        };
      });
    } catch (error) {
      logger.warn('[IndexedDB] getTodos error, using localStorage:', error);
      return this.getTodosFromLocalStorage();
    }
  }

  async saveTodos(todos: Todo[]): Promise<void> {
    // Use localStorage fallback if IndexedDB unavailable
    if (!this.useIndexedDB) {
      return this.saveTodosToLocalStorage(todos);
    }

    try {
      if (!this.db) await this.init();
      
      // Check again after init
      if (!this.useIndexedDB) {
        return this.saveTodosToLocalStorage(todos);
      }
    
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['todos'], 'readwrite');
        const store = transaction.objectStore('todos');
        
        // Set timeout for transaction (30 seconds)
        const timeoutId = setTimeout(() => {
          logger.error('[IndexedDB] saveTodos transaction timeout');
          transaction.abort();
        }, 30000);
        
        transaction.oncomplete = () => {
          clearTimeout(timeoutId);
          logger.log('[IndexedDB] Todos saved successfully');
          resolve();
        };
        
        transaction.onerror = () => {
          clearTimeout(timeoutId);
          logger.error('[IndexedDB] saveTodos transaction failed:', transaction.error);
          // Try localStorage fallback
          this.saveTodosToLocalStorage(todos);
          resolve(); // Don't reject, we saved to fallback
        };
        
        transaction.onabort = () => {
          clearTimeout(timeoutId);
          logger.warn('[IndexedDB] saveTodos transaction aborted');
          this.saveTodosToLocalStorage(todos);
          resolve();
        };
        
        try {
          // Clear and batch insert
          const clearRequest = store.clear();
          clearRequest.onsuccess = () => {
            todos.forEach(todo => store.add(todo));
          };
          clearRequest.onerror = () => {
            logger.error('[IndexedDB] Failed to clear todos store:', clearRequest.error);
            transaction.abort();
          };
        } catch (error) {
          logger.error('[IndexedDB] Error during saveTodos operations:', error);
          transaction.abort();
        }
      });
    } catch (error) {
      logger.warn('[IndexedDB] saveTodos error, using localStorage:', error);
      this.saveTodosToLocalStorage(todos);
    }
  }

  async getTemplates(): Promise<Template[]> {
    // Use localStorage fallback if IndexedDB unavailable
    if (!this.useIndexedDB) {
      return this.getTemplatesFromLocalStorage();
    }

    try {
      if (!this.db) await this.init();
      
      // Check again after init
      if (!this.useIndexedDB) {
        return this.getTemplatesFromLocalStorage();
      }
    
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['templates'], 'readonly');
        const store = transaction.objectStore('templates');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => {
          logger.warn('[IndexedDB] getTemplates failed, falling back to localStorage:', request.error);
          resolve(this.getTemplatesFromLocalStorage());
        };
      });
    } catch (error) {
      logger.warn('[IndexedDB] getTemplates error, using localStorage:', error);
      return this.getTemplatesFromLocalStorage();
    }
  }

  async saveTemplates(templates: Template[]): Promise<void> {
    // Use localStorage fallback if IndexedDB unavailable
    if (!this.useIndexedDB) {
      return this.saveTemplatesToLocalStorage(templates);
    }

    try {
      if (!this.db) await this.init();
      
      // Check again after init
      if (!this.useIndexedDB) {
        return this.saveTemplatesToLocalStorage(templates);
      }
    
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['templates'], 'readwrite');
        const store = transaction.objectStore('templates');
        
        // Set timeout for transaction (30 seconds)
        const timeoutId = setTimeout(() => {
          logger.error('[IndexedDB] saveTemplates transaction timeout');
          transaction.abort();
        }, 30000);
        
        transaction.oncomplete = () => {
          clearTimeout(timeoutId);
          logger.log('[IndexedDB] Templates saved successfully');
          resolve();
        };
        
        transaction.onerror = () => {
          clearTimeout(timeoutId);
          logger.error('[IndexedDB] saveTemplates transaction failed:', transaction.error);
          // Try localStorage fallback
          this.saveTemplatesToLocalStorage(templates);
          resolve(); // Don't reject, we saved to fallback
        };
        
        transaction.onabort = () => {
          clearTimeout(timeoutId);
          logger.warn('[IndexedDB] saveTemplates transaction aborted');
          this.saveTemplatesToLocalStorage(templates);
          resolve();
        };
        
        try {
          const clearRequest = store.clear();
          clearRequest.onsuccess = () => {
            templates.forEach(template => store.add(template));
          };
          clearRequest.onerror = () => {
            logger.error('[IndexedDB] Failed to clear templates store:', clearRequest.error);
            transaction.abort();
          };
        } catch (error) {
          logger.error('[IndexedDB] Error during saveTemplates operations:', error);
          transaction.abort();
        }
      });
    } catch (error) {
      logger.warn('[IndexedDB] saveTemplates error, using localStorage:', error);
      this.saveTemplatesToLocalStorage(templates);
    }
  }

  // Fallback to localStorage if IndexedDB fails
  async migrateFromLocalStorage(): Promise<void> {
    try {
      const todos = localStorage.getItem('curvycloud_todos');
      const templates = localStorage.getItem('curvycloud_templates');
      
      if (todos) {
        await this.saveTodos(safeJsonParse(todos, []));
        localStorage.removeItem('curvycloud_todos');
      }
      
      if (templates) {
        await this.saveTemplates(safeJsonParse(templates, []));
        localStorage.removeItem('curvycloud_templates');
      }
    } catch (error) {
      logger.warn('[IndexedDB] Migration from localStorage failed:', error);
    }
  }
}

export const dbService = new IndexedDBService();