// Phase 5.1: Data Migration Service
const SCHEMA_VERSION = 2;

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  migratedItems: number;
  errors?: string[];
}

class DataMigrationService {
  migrate(data: any, fromVersion: number, toVersion: number): MigrationResult {
    const result: MigrationResult = {
      success: false,
      fromVersion,
      toVersion,
      migratedItems: 0,
      errors: []
    };

    try {
      let migratedData = data;
      
      if (fromVersion < 2) {
        migratedData = this.migrateToV2(migratedData);
        result.migratedItems = Array.isArray(migratedData.todos) ? migratedData.todos.length : 0;
      }

      result.success = true;
      return result;
    } catch (error) {
      result.errors = [`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`];
      return result;
    }
  }

  private migrateToV2(data: any) {
    // Add new fields, update structure for v2
    const migrated = {
      version: 2,
      todos: Array.isArray(data.todos) ? data.todos.map(todo => ({
        ...todo,
        deletedAt: null,
        editHistory: todo.editHistory || [],
        migrated: true
      })) : [],
      templates: Array.isArray(data.templates) ? data.templates.map(template => ({
        ...template,
        version: 2,
        migrated: true
      })) : []
    };
    
    return migrated;
  }

  getCurrentVersion(): number {
    return SCHEMA_VERSION;
  }

  validateData(data: any): boolean {
    return data && 
           typeof data === 'object' && 
           Array.isArray(data.todos) && 
           Array.isArray(data.templates);
  }
}

export const dataMigrationService = new DataMigrationService();