/**
 * Storage Health Analyzer - Minimal Build Version
 */

import { offlineStorageService } from './offlineStorageService';
import { userPreferencesService } from './userPreferencesService';

interface StorageHealthReport {
  overall: string;
  details: {
    capacity: { used: number; available: number; percentage: number };
    integrity: { todos: boolean; templates: boolean; preferences: boolean };
    performance: { readTime: number; writeTime: number };
    fragmentation: number;
    redundancy: boolean;
    corruption: string[];
  };
  recommendations: string[];
}

class StorageHealthAnalyzer {
  private readonly MAX_STORAGE = 5 * 1024 * 1024;
  
  async analyzeHealth(): Promise<StorageHealthReport> {
    const capacity = this.analyzeCapacity();
    const integrity = this.analyzeIntegrity();
    const performance = await this.analyzePerformance();
    const fragmentation = this.analyzeFragmentation();
    const redundancy = this.checkRedundancy();
    const corruption = this.detectCorruption();
    
    const overall = this.calculateOverallHealth(capacity, integrity, performance, fragmentation, corruption);
    const recommendations = this.generateRecommendations(capacity, integrity, performance, fragmentation, corruption);
    
    return {
      overall,
      details: { capacity, integrity, performance, fragmentation, redundancy, corruption },
      recommendations
    };
  }

  private analyzeCapacity() {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    const percentage = (totalSize / this.MAX_STORAGE) * 100;
    return {
      used: totalSize,
      available: this.MAX_STORAGE - totalSize,
      percentage: Math.round(percentage * 100) / 100
    };
  }

  private analyzeIntegrity() {
    const todos = this.validateTodosIntegrity();
    const templates = this.validateTemplatesIntegrity();
    const preferences = this.validatePreferencesIntegrity();
    return { todos, templates, preferences };
  }

  private validateTodosIntegrity(): boolean {
    try {
      const todos = offlineStorageService.getTodos();
      return Array.isArray(todos);
    } catch {
      return false;
    }
  }

  private validateTemplatesIntegrity(): boolean {
    try {
      const templates = offlineStorageService.getTemplates();
      return Array.isArray(templates);
    } catch {
      return false;
    }
  }

  private validatePreferencesIntegrity(): boolean {
    try {
      const prefs = userPreferencesService.getPreferences();
      return !!prefs;
    } catch {
      return false;
    }
  }

  private async analyzePerformance() {
    const writeStart = performance.now();
    try {
      localStorage.setItem('perf_test', 'test');
    } catch {
      return { readTime: -1, writeTime: -1 };
    }
    const writeTime = performance.now() - writeStart;
    
    const readStart = performance.now();
    try {
      localStorage.getItem('perf_test');
    } catch {
      return { readTime: -1, writeTime };
    }
    const readTime = performance.now() - readStart;
    
    localStorage.removeItem('perf_test');
    return { readTime, writeTime };
  }

  private analyzeFragmentation(): number {
    const keys = Object.keys(localStorage);
    const otherKeys = keys.filter(key => !key.startsWith('curvycloud_'));
    return keys.length > 0 ? (otherKeys.length / keys.length) * 100 : 0;
  }

  private checkRedundancy(): boolean {
    try {
      // Check if critical data exists in multiple forms
      const todos = localStorage.getItem('curvycloud_todos');
      const templates = localStorage.getItem('curvycloud_templates');
      const preferences = localStorage.getItem('curvycloud_user_preferences');
      
      return !!(todos && templates && preferences);
    } catch {
      return false;
    }
  }

  private detectCorruption(): string[] {
    const corruption: string[] = [];
    const keys = ['curvycloud_todos', 'curvycloud_templates'];
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          JSON.parse(value);
        } catch {
          corruption.push(`Corrupted JSON in ${key}`);
        }
      }
    });
    
    return corruption;
  }

  private calculateOverallHealth(capacity: any, integrity: any, performance: any, fragmentation: number, corruption: string[]): string {
    let score = 100;
    if (capacity.percentage > 90) score -= 30;
    if (!integrity.todos) score -= 40;
    if (performance.readTime < 0) score -= 50;
    if (corruption.length > 0) score -= 20;
    
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 40) return 'warning';
    return 'critical';
  }

  private generateRecommendations(capacity: any, integrity: any, performance: any, fragmentation: number, corruption: string[]): string[] {
    const recommendations: string[] = [];
    if (capacity.percentage > 75) recommendations.push('Consider cleaning old data');
    if (corruption.length > 0) recommendations.push('Data corruption detected');
    if (recommendations.length === 0) recommendations.push('Storage system is healthy');
    return recommendations;
  }

  async optimizeStorage(): Promise<void> {
    try {
      // Clean up old todos (soft deleted > 30 days)
      const todos = offlineStorageService.getTodos();
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const cleanedTodos = todos.filter(todo => 
        !todo.deletedAt || todo.deletedAt > thirtyDaysAgo
      );
      
      if (cleanedTodos.length !== todos.length) {
        offlineStorageService.saveTodos(cleanedTodos);
      }
      
      // Limit templates to last 100
      const templates = offlineStorageService.getTemplates();
      if (templates.length > 100) {
        const limitedTemplates = templates.slice(-100);
        offlineStorageService.saveTemplates(limitedTemplates);
      }
      
      // Clean up old cache entries
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes('cache') || key.includes('temp')
      );
      cacheKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Remove corrupted cache entries
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Storage optimization failed:', error);
    }
  }

  async repairCorruption(): Promise<boolean> {
    try {
      const corruption = this.detectCorruption();
      let repaired = false;
      
      for (const issue of corruption) {
        if (issue.includes('curvycloud_todos')) {
          // Try to repair todos
          try {
            const raw = localStorage.getItem('curvycloud_todos');
            if (raw) {
              // Attempt to fix common JSON issues
              const fixed = raw.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
              JSON.parse(fixed); // Test if fix worked
              localStorage.setItem('curvycloud_todos', fixed);
              repaired = true;
            }
          } catch {
            // If repair fails, reset to empty array
            localStorage.setItem('curvycloud_todos', '[]');
            repaired = true;
          }
        }
        
        if (issue.includes('curvycloud_templates')) {
          try {
            const raw = localStorage.getItem('curvycloud_templates');
            if (raw) {
              const fixed = raw.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
              JSON.parse(fixed);
              localStorage.setItem('curvycloud_templates', fixed);
              repaired = true;
            }
          } catch {
            localStorage.setItem('curvycloud_templates', '[]');
            repaired = true;
          }
        }
      }
      
      return repaired;
    } catch {
      return false;
    }
  }

  getStorageBreakdown() {
    const breakdown: Record<string, number> = {};
    let total = 0;
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length + key.length;
        breakdown[key] = size;
        total += size;
      }
    }
    
    const percentages: Record<string, number> = {};
    for (let key in breakdown) {
      percentages[key] = Math.round((breakdown[key] / total) * 100 * 100) / 100;
    }
    
    return { breakdown, percentages, total };
  }
}

export const storageHealthAnalyzer = new StorageHealthAnalyzer();