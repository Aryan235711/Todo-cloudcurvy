/**
 * Offline Storage Service
 * Handles core todo functionality when offline
 */

import { Todo, Template } from '../types';

interface OfflineQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  type: 'todo' | 'template';
  data: any;
  timestamp: number;
}

class OfflineStorageService {
  private readonly TODOS_KEY = 'curvycloud_todos';
  private readonly TEMPLATES_KEY = 'curvycloud_templates';
  private readonly QUEUE_KEY = 'curvycloud_offline_queue';
  private readonly LAST_SYNC_KEY = 'curvycloud_last_sync';

  // Core offline functionality
  getTodos(): Todo[] {
    try {
      const stored = localStorage.getItem(this.TODOS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveTodos(todos: Todo[]): void {
    try {
      localStorage.setItem(this.TODOS_KEY, JSON.stringify(todos));
      this.updateLastSync();
    } catch (error) {
      console.warn('Failed to save todos offline:', error);
    }
  }

  getTemplates(): Template[] {
    try {
      const stored = localStorage.getItem(this.TEMPLATES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveTemplates(templates: Template[]): void {
    try {
      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
      this.updateLastSync();
    } catch (error) {
      console.warn('Failed to save templates offline:', error);
    }
  }

  // Offline queue management
  addToQueue(action: OfflineQueue['action'], type: OfflineQueue['type'], data: any): void {
    const queue = this.getQueue();
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
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: OfflineQueue[]): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to save offline queue:', error);
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