
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
  isUrgent?: boolean; // 170 IQ: Detects time-sensitive tasks
  extractedTime?: string; // 170 IQ: Stores the detected deadline/time
  lastNotified?: number;
}

export interface Template {
  id: string;
  name: string;
  items: string[];
  category: Category;
  tags: string[];
  priority?: Priority; // 201 IQ: Priority logic for templates
}

export interface AIStatus {
  loading: boolean;
  error: string | null;
}
