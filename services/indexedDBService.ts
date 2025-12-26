// IndexedDB Service for Loop Community
// Provides async, non-blocking storage operations

interface LoopDB {
  todos: any[];
  templates: any[];
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'LoopCommunityDB';
  private readonly version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
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

  async getTodos(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['todos'], 'readonly');
      const store = transaction.objectStore('todos');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveTodos(todos: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['todos'], 'readwrite');
      const store = transaction.objectStore('todos');
      
      // Clear and batch insert
      store.clear();
      todos.forEach(todo => store.add(todo));
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getTemplates(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['templates'], 'readonly');
      const store = transaction.objectStore('templates');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveTemplates(templates: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['templates'], 'readwrite');
      const store = transaction.objectStore('templates');
      
      store.clear();
      templates.forEach(template => store.add(template));
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Fallback to localStorage if IndexedDB fails
  async migrateFromLocalStorage(): Promise<void> {
    try {
      const todos = localStorage.getItem('curvycloud_todos');
      const templates = localStorage.getItem('curvycloud_templates');
      
      if (todos) {
        await this.saveTodos(JSON.parse(todos));
        localStorage.removeItem('curvycloud_todos');
      }
      
      if (templates) {
        await this.saveTemplates(JSON.parse(templates));
        localStorage.removeItem('curvycloud_templates');
      }
    } catch (error) {
      console.warn('Migration from localStorage failed:', error);
    }
  }
}

export const dbService = new IndexedDBService();