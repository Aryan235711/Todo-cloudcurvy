// Phase 5.2: Backup/Restore Service
import { dataMigrationService } from './dataMigrationService';
import { safeJsonParse } from '../utils/safeJson';
import { Todo, Template } from '../types';

interface BackupData {
  todos: Todo[];
  templates: Template[];
  version: number;
  timestamp: number;
  appVersion: string;
}

export interface RestoreResult {
  success: boolean;
  itemsRestored: number;
  migrationApplied: boolean;
  errors?: string[];
}

class BackupService {
  exportData(): string {
    try {
      const todos = safeJsonParse(localStorage.getItem('curvycloud_todos'), []);
      const templates = safeJsonParse(localStorage.getItem('curvycloud_templates'), []);
      
      const backupData: BackupData = {
        todos,
        templates,
        version: dataMigrationService.getCurrentVersion(),
        timestamp: Date.now(),
        appVersion: '1.0.0'
      };
      
      return JSON.stringify(backupData, null, 2);
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  importData(jsonData: string): RestoreResult {
    const result: RestoreResult = {
      success: false,
      itemsRestored: 0,
      migrationApplied: false,
      errors: []
    };

    try {
      const data = JSON.parse(jsonData);
      
      if (!dataMigrationService.validateData(data)) {
        result.errors = ['Invalid backup data format'];
        return result;
      }

      // Apply migration if needed
      const currentVersion = dataMigrationService.getCurrentVersion();
      const dataVersion = data.version || 1;
      
      let finalData = data;
      if (dataVersion < currentVersion) {
        const migrationResult = dataMigrationService.migrate(data, dataVersion, currentVersion);
        if (!migrationResult.success) {
          result.errors = migrationResult.errors;
          return result;
        }
        finalData = data;
        result.migrationApplied = true;
      }

      // Restore data to localStorage
      localStorage.setItem('curvycloud_todos', JSON.stringify(finalData.todos));
      localStorage.setItem('curvycloud_templates', JSON.stringify(finalData.templates));
      
      result.success = true;
      result.itemsRestored = finalData.todos.length + finalData.templates.length;
      
      return result;
    } catch (error) {
      result.errors = [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`];
      return result;
    }
  }

  createBackupFilename(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `loop-community-backup-${dateStr}-${timeStr}.json`;
  }

  downloadBackup(): void {
    try {
      const backupData = this.exportData();
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = this.createBackupFilename();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const backupService = new BackupService();