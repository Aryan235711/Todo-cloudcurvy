/**
 * Offline Storage Service
 * Handles core todo functionality when offline
 */

import { Todo, Template } from '../types';
import { safeJsonParse } from '../utils/safeJson';
import { storageQuota, defaultCleanupStrategies } from '../utils/storageQuota';
import { logger } from '../utils/logger';
import { validateTodo, validateTemplate } from '../utils/validators';
import { STORAGE_KEYS, STORAGE_LIMITS } from '../constants/storageConstants';

interface OfflineQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  type: 'todo' | 'template';
  data: Todo | Template;
  timestamp: number;
}

class OfflineStorageService {
  private readonly TODOS_KEY = STORAGE_KEYS.TODOS;
  private readonly TEMPLATES_KEY = STORAGE_KEYS.TEMPLATES;
  private readonly QUEUE_KEY = STORAGE_KEYS.OFFLINE_QUEUE;
  private readonly LAST_SYNC_KEY = STORAGE_KEYS.LAST_SYNC;
  
  // Storage limits
  private readonly MAX_QUEUE_SIZE = STORAGE_LIMITS.MAX_QUEUE_SIZE;
  private readonly MAX_TODOS = STORAGE_LIMITS.MAX_TODOS;
  private readonly MAX_TEMPLATES = STORAGE_LIMITS.MAX_TEMPLATES;

  // Core offline functionality
  
  /**
   * Retrieves all todos from localStorage with validation
   * Automatically filters out corrupted entries and enforces size limits
   * @returns Array of validated Todo objects
   */
  getTodos(): Todo[] {
    try {
      const stored = localStorage.getItem(this.TODOS_KEY);
      const todos = safeJsonParse<Todo[]>(stored, []);
      
      // Validate and filter out corrupted todos
      const validTodos = todos.filter(todo => {
        if (!validateTodo(todo)) {
          logger.warn('[OfflineStorage] Invalid todo detected and removed:', todo);
          return false;
        }
        return true;
      });
      
      // Enforce max limit
      if (validTodos.length > this.MAX_TODOS) {
        logger.warn(`[OfflineStorage] Too many todos (${validTodos.length}), keeping latest ${this.MAX_TODOS}`);
        return validTodos.slice(-this.MAX_TODOS);
      }
      
      return validTodos;
    } catch {
      return [];
    }
  }

  /**
   * Saves todos to localStorage with quota handling
   * Automatically triggers cleanup if quota exceeded
   * @param todos - Array of todos to save
   */
  saveTodos(todos: Todo[]): void {
    const success = storageQuota.safeWrite(
      this.TODOS_KEY,
      JSON.stringify(todos),
      localStorage,
      async () => {
        // Cleanup callback on quota exceeded
        logger.warn('[OfflineStorage] Quota exceeded, running cleanup...');
        await storageQuota.cleanupStorage(defaultCleanupStrategies);
      }
    );

    if (success) {
      this.updateLastSync();
    } else {
      logger.error('[OfflineStorage] Failed to save todos even after cleanup');
    }
  }

  getTemplates(): Template[] {
    try {
      const stored = localStorage.getItem(this.TEMPLATES_KEY);
      const templates = safeJsonParse<Template[]>(stored, []);
      
      // Validate and filter out corrupted templates
      const validTemplates = templates.filter(template => {
        if (!validateTemplate(template)) {
          logger.warn('[OfflineStorage] Invalid template detected and removed:', template);
          return false;
        }
        return true;
      });
      
      // Enforce max limit
      if (validTemplates.length > this.MAX_TEMPLATES) {
        logger.warn(`[OfflineStorage] Too many templates (${validTemplates.length}), keeping latest ${this.MAX_TEMPLATES}`);
        return validTemplates.slice(-this.MAX_TEMPLATES);
      }
      
      return validTemplates;
    } catch {
      return [];
    }
  }

  saveTemplates(templates: Template[]): void {
    const success = storageQuota.safeWrite(
      this.TEMPLATES_KEY,
      JSON.stringify(templates),
      localStorage,
      async () => {
        logger.warn('[OfflineStorage] Quota exceeded, running cleanup...');
        await storageQuota.cleanupStorage(defaultCleanupStrategies);
      }
    );

    if (success) {
      this.updateLastSync();
    } else {
      logger.error('[OfflineStorage] Failed to save templates even after cleanup');
    }
  }

  // Offline queue management
  
  /**
   * Adds an operation to the offline sync queue
   * Automatically enforces MAX_QUEUE_SIZE limit
   * @param action - Type of operation (create, update, delete)
   * @param type - Data type (todo or template)
   * @param data - The todo or template object
   */
  addToQueue(action: OfflineQueue['action'], type: OfflineQueue['type'], data: Todo | Template): void {
    const queue = this.getQueue();
    
    // Enforce queue size limit
    if (queue.length >= this.MAX_QUEUE_SIZE) {
      logger.warn(`[OfflineStorage] Queue full (${queue.length}/${this.MAX_QUEUE_SIZE}), removing oldest items`);
      // Keep only the most recent items
      queue.splice(0, queue.length - this.MAX_QUEUE_SIZE + 10); // Remove oldest, keep room for 10 more
    }
    
    const queueItem: OfflineQueue = {
      id: Math.random().toString(36).substring(2, 9),
      action,
      type,
      data,
      timestamp: Date.now()
    };
    queue.push(queueItem);
    this.saveQueue(queue);
  }

  getQueue(): OfflineQueue[] {
    try {
      const stored = localStorage.getItem(this.QUEUE_KEY);
      return safeJsonParse<OfflineQueue[]>(stored, []);
    } catch {
      return [];
    }
  }

  private saveQueue(queue: OfflineQueue[]): void {
    const success = storageQuota.safeWrite(
      this.QUEUE_KEY,
      JSON.stringify(queue),
      localStorage,
      async () => {
        // On quota exceeded, remove older completed items
        logger.warn('[OfflineStorage] Queue quota exceeded, cleaning completed items...');
        const pending = queue.filter(item => item.timestamp > Date.now() - 86400000); // Keep only last 24h
        storageQuota.safeWrite(this.QUEUE_KEY, JSON.stringify(pending));
      }
    );

    if (!success) {
      logger.error('[OfflineStorage] Failed to save queue even after cleanup');
    }
  }

  clearQueue(): void {
    localStorage.removeItem(this.QUEUE_KEY);
  }

  // Network status
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Sync status
  private updateLastSync(): void {
    localStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());
  }

  getLastSync(): number {
    const stored = localStorage.getItem(this.LAST_SYNC_KEY);
    return stored ? parseInt(stored) : 0;
  }

  // Storage info
  getStorageInfo(): { used: number; available: boolean } {
    try {
      const testKey = 'storage_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      return { used, available: true };
    } catch {
      return { used: 0, available: false };
    }
  }
}

export const offlineStorageService = new OfflineStorageService();