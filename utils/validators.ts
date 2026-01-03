/**
 * Data Validation Utilities
 * Validates storage objects to prevent corruption
 */

import { Todo, Template } from '../types';

/**
 * Validates a Todo object has all required fields
 */
export function validateTodo(todo: unknown): todo is Todo {
  if (!todo || typeof todo !== 'object') {
    return false;
  }

  const t = todo as Partial<Todo>;

  return (
    typeof t.id === 'string' &&
    t.id.length > 0 &&
    typeof t.text === 'string' &&
    t.text.length > 0 &&
    typeof t.completed === 'boolean' &&
    (t.priority === undefined || ['low', 'medium', 'high'].includes(t.priority)) &&
    (t.createdAt === undefined || typeof t.createdAt === 'number') &&
    (t.completedAt === undefined || typeof t.completedAt === 'number') &&
    (t.deletedAt === undefined || typeof t.deletedAt === 'number') &&
    (t.tags === undefined || Array.isArray(t.tags)) &&
    (t.category === undefined || typeof t.category === 'string') &&
    (t.subTasks === undefined || Array.isArray(t.subTasks))
  );
}

/**
 * Validates a Template object has all required fields
 */
export function validateTemplate(template: unknown): template is Template {
  if (!template || typeof template !== 'object') {
    return false;
  }

  const t = template as Partial<Template>;

  return (
    typeof t.id === 'string' &&
    t.id.length > 0 &&
    typeof t.name === 'string' &&
    t.name.length > 0 &&
    Array.isArray(t.items) &&
    (t.category === undefined || typeof t.category === 'string') &&
    (t.tags === undefined || Array.isArray(t.tags)) &&
    (t.priority === undefined || ['low', 'medium', 'high'].includes(t.priority))
  );
}

/**
 * Validates an array of todos, filtering out invalid entries
 */
export function validateTodoArray(todos: unknown[]): Todo[] {
  return todos.filter((todo): todo is Todo => validateTodo(todo));
}

/**
 * Validates an array of templates, filtering out invalid entries
 */
export function validateTemplateArray(templates: unknown[]): Template[] {
  return templates.filter((template): template is Template => validateTemplate(template));
}

/**
 * Sanitizes a todo object by removing unexpected properties
 */
export function sanitizeTodo(todo: Todo): Todo {
  return {
    id: todo.id,
    text: todo.text,
    completed: todo.completed,
    priority: todo.priority,
    createdAt: todo.createdAt,
    completedAt: todo.completedAt,
    deletedAt: todo.deletedAt,
    tags: todo.tags,
    category: todo.category,
    subTasks: todo.subTasks,
    templateName: todo.templateName,
    isUrgent: todo.isUrgent,
    extractedTime: todo.extractedTime,
    lastNotified: todo.lastNotified,
    editHistory: todo.editHistory
  };
}

/**
 * Sanitizes a template object by removing unexpected properties
 */
export function sanitizeTemplate(template: Template): Template {
  return {
    id: template.id,
    name: template.name,
    items: template.items,
    category: template.category,
    tags: template.tags,
    priority: template.priority
  };
}

/**
 * Validates storage key format
 */
export function validateStorageKey(key: string): boolean {
  return (
    typeof key === 'string' &&
    key.length > 0 &&
    key.length < 256 && // Max key length
    /^[a-zA-Z0-9_-]+$/.test(key) // Alphanumeric, underscore, hyphen only
  );
}

/**
 * Validates JSON string is parseable and under size limit
 */
export function validateJSONString(json: string, maxSizeKB: number = 1024): boolean {
  if (typeof json !== 'string' || json.length === 0) {
    return false;
  }

  // Check size limit (in bytes, assuming UTF-16)
  const sizeKB = (json.length * 2) / 1024;
  if (sizeKB > maxSizeKB) {
    return false;
  }

  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}
