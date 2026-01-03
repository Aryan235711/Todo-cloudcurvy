import { safeJsonParse, safeJsonStringify } from '../utils/safeJson';

interface TaskEvent {
  id: string;
  taskId: string;
  type: 'created' | 'edited' | 'completed' | 'abandoned' | 'priority_changed';
  timestamp: number;
  data?: {
    oldText?: string;
    newText?: string;
    oldPriority?: string;
    newPriority?: string;
    category?: string;
    templateName?: string;
  };
}

interface TaskLifecycle {
  taskId: string;
  created: number;
  events: TaskEvent[];
  status: 'active' | 'completed' | 'abandoned';
  editCount: number;
  timeToCompletion?: number;
}

class AnalyticsService {
  private events: TaskEvent[] = [];
  private lifecycles: Map<string, TaskLifecycle> = new Map();

  init() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('loop_analytics');
      if (stored) {
        const data = safeJsonParse(stored, { events: [], lifecycles: [] });
        this.events = data.events || [];
        this.lifecycles = new Map(data.lifecycles || []);
      }
    } catch {
      // Silent fail
    }
  }

  private saveToStorage() {
    try {
      const data = safeJsonStringify({
        events: this.events.slice(-1000), // Keep last 1000 events
        lifecycles: Array.from(this.lifecycles.entries())
      });
      localStorage.setItem('loop_analytics', data);
    } catch {
      // Silent fail
    }
  }

  trackTaskCreated(taskId: string, text: string, category?: string, templateName?: string) {
    const event: TaskEvent = {
      id: Math.random().toString(36).substring(2, 9),
      taskId,
      type: 'created',
      timestamp: Date.now(),
      data: { newText: text, category, templateName }
    };

    this.events.push(event);
    this.lifecycles.set(taskId, {
      taskId,
      created: Date.now(),
      events: [event],
      status: 'active',
      editCount: 0
    });

    this.saveToStorage();
  }

  trackTaskEdited(taskId: string, oldText: string, newText: string) {
    const event: TaskEvent = {
      id: Math.random().toString(36).substring(2, 9),
      taskId,
      type: 'edited',
      timestamp: Date.now(),
      data: { oldText, newText }
    };

    this.events.push(event);
    
    const lifecycle = this.lifecycles.get(taskId);
    if (lifecycle) {
      lifecycle.events.push(event);
      lifecycle.editCount++;
      this.lifecycles.set(taskId, lifecycle);
    }

    this.saveToStorage();
  }

  trackTaskCompleted(taskId: string) {
    const event: TaskEvent = {
      id: Math.random().toString(36).substring(2, 9),
      taskId,
      type: 'completed',
      timestamp: Date.now()
    };

    this.events.push(event);
    
    const lifecycle = this.lifecycles.get(taskId);
    if (lifecycle) {
      lifecycle.events.push(event);
      lifecycle.status = 'completed';
      lifecycle.timeToCompletion = Date.now() - lifecycle.created;
      this.lifecycles.set(taskId, lifecycle);
    }

    this.saveToStorage();
  }

  trackTaskAbandoned(taskId: string) {
    const event: TaskEvent = {
      id: Math.random().toString(36).substring(2, 9),
      taskId,
      type: 'abandoned',
      timestamp: Date.now()
    };

    this.events.push(event);
    
    const lifecycle = this.lifecycles.get(taskId);
    if (lifecycle) {
      lifecycle.events.push(event);
      lifecycle.status = 'abandoned';
      this.lifecycles.set(taskId, lifecycle);
    }

    this.saveToStorage();
  }

  trackPriorityChanged(taskId: string, oldPriority: string, newPriority: string) {
    const event: TaskEvent = {
      id: Math.random().toString(36).substring(2, 9),
      taskId,
      type: 'priority_changed',
      timestamp: Date.now(),
      data: { oldPriority, newPriority }
    };

    this.events.push(event);
    
    const lifecycle = this.lifecycles.get(taskId);
    if (lifecycle) {
      lifecycle.events.push(event);
      this.lifecycles.set(taskId, lifecycle);
    }

    this.saveToStorage();
  }

  getInsights() {
    const lifecycles = Array.from(this.lifecycles.values());
    const completed = lifecycles.filter(l => l.status === 'completed');
    const abandoned = lifecycles.filter(l => l.status === 'abandoned');
    const active = lifecycles.filter(l => l.status === 'active');

    const completionRate = lifecycles.length > 0 
      ? (completed.length / (completed.length + abandoned.length)) * 100 
      : 0;

    const avgEditCount = lifecycles.length > 0
      ? lifecycles.reduce((sum, l) => sum + l.editCount, 0) / lifecycles.length
      : 0;

    const avgTimeToCompletion = completed.length > 0
      ? completed.reduce((sum, l) => sum + (l.timeToCompletion || 0), 0) / completed.length
      : 0;

    return {
      totalTasks: lifecycles.length,
      completed: completed.length,
      abandoned: abandoned.length,
      active: active.length,
      completionRate: Math.round(completionRate),
      avgEditCount: Math.round(avgEditCount * 10) / 10,
      avgTimeToCompletion: Math.round(avgTimeToCompletion / (1000 * 60 * 60)), // hours
      mostEditedCategories: this.getMostEditedCategories(),
      editPatterns: this.getEditPatterns()
    };
  }

  private getMostEditedCategories() {
    const categoryEdits = new Map<string, number>();
    
    for (const lifecycle of this.lifecycles.values()) {
      const createEvent = lifecycle.events.find(e => e.type === 'created');
      const category = createEvent?.data?.category || 'uncategorized';
      categoryEdits.set(category, (categoryEdits.get(category) || 0) + lifecycle.editCount);
    }

    return Array.from(categoryEdits.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, edits]) => ({ category, edits }));
  }

  private getEditPatterns() {
    const now = Date.now();
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);
    
    const recentEdits = this.events.filter(e => 
      e.type === 'edited' && e.timestamp > last7Days
    );

    const editsByDay = new Map<string, number>();
    recentEdits.forEach(event => {
      const day = new Date(event.timestamp).toDateString();
      editsByDay.set(day, (editsByDay.get(day) || 0) + 1);
    });

    return Array.from(editsByDay.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([day, count]) => ({ day, count }));
  }
}

export const analyticsService = new AnalyticsService();