
export type Priority = 'low' | 'medium' | 'high';
export type Category = 'work' | 'personal' | 'health' | 'other';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  deletedAt?: number; // Soft delete timestamp
  priority: Priority;
  subTasks?: string[];
  category?: Category;
  tags?: string[];
  templateName?: string; 
  isUrgent?: boolean; // Indicates if the task is time-sensitive
  extractedTime?: string; // Stores the detected deadline/time
  lastNotified?: number;
  editHistory?: EditHistoryEntry[]; // Audit trail
}

export interface EditHistoryEntry {
  timestamp: number;
  oldText: string;
  newText: string;
  type: 'text' | 'priority' | 'category';
}

export interface Template {
  id: string;
  name: string;
  items: string[];
  category: Category;
  tags: string[];
  priority?: Priority; // Priority logic for templates
}

export interface AIStatus {
  loading: boolean;
  error: string | null;
}
