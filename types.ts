
export type Priority = 'low' | 'medium' | 'high';
export type Category = 'work' | 'personal' | 'health' | 'other';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: Priority;
  subTasks?: string[];
  category?: Category;
  tags?: string[];
  templateName?: string; 
  isUrgent?: boolean; // Indicates if the task is time-sensitive
  extractedTime?: string; // Stores the detected deadline/time
  lastNotified?: number;
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
