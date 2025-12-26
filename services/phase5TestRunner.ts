// Phase 5 Test Runner - Data Management Enhancement Validation
import { dataMigrationService } from './dataMigrationService';
import { backupService } from './backupService';

export interface Phase5TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  details?: string;
  duration?: number;
  metrics?: {
    migratedItems?: number;
    backupSize?: number;
    restoredItems?: number;
  };
}

export async function runPhase5Tests(): Promise<Phase5TestResult[]> {
  console.log('🧪 Starting Phase 5: Data Management Enhancement Tests...');
  
  const results: Phase5TestResult[] = [
    { name: '5.1 Data Migration Service', status: 'pending' },
    { name: '5.2 Backup Export', status: 'pending' },
    { name: '5.3 Data Import/Restore', status: 'pending' },
    { name: 'Migration Compatibility', status: 'pending' }
  ];

  // Test 1: 5.1 Data Migration Service
  results[0].status = 'running';
  const startTime1 = Date.now();
  try {
    // Test migration from v1 to v2
    const testDataV1 = {
      todos: [
        { id: '1', text: 'Test todo', completed: false, createdAt: Date.now() }
      ],
      templates: [
        { id: '1', name: 'Test template', items: ['Item 1'] }
      ]
    };
    
    const migrationResult = dataMigrationService.migrate(testDataV1, 1, 2);
    const isValid = dataMigrationService.validateData(testDataV1);
    
    results[0] = {
      ...results[0],
      status: migrationResult.success && isValid ? 'passed' : 'failed',
      details: `Migration: ${migrationResult.success ? 'Success' : 'Failed'} - ${migrationResult.migratedItems} items migrated`,
      duration: Date.now() - startTime1,
      metrics: { migratedItems: migrationResult.migratedItems }
    };
  } catch (error) {
    results[0] = {
      ...results[0],
      status: 'failed',
      details: 'Data migration service failed',
      duration: Date.now() - startTime1
    };
  }

  // Test 2: 5.2 Backup Export
  await new Promise(resolve => setTimeout(resolve, 100));
  results[1].status = 'running';
  const startTime2 = Date.now();
  try {
    // Create test data in localStorage
    const testTodos = [{ id: 'test1', text: 'Test backup', completed: false }];
    const testTemplates = [{ id: 'template1', name: 'Test template' }];
    
    localStorage.setItem('curvycloud_todos', JSON.stringify(testTodos));
    localStorage.setItem('curvycloud_templates', JSON.stringify(testTemplates));
    
    const backupData = backupService.exportData();
    const parsed = JSON.parse(backupData);
    const hasValidStructure = parsed.todos && parsed.templates && parsed.version && parsed.timestamp;
    
    results[1] = {
      ...results[1],
      status: hasValidStructure ? 'passed' : 'failed',
      details: `Backup export: ${hasValidStructure ? 'Valid structure' : 'Invalid'} - ${backupData.length} bytes`,
      duration: Date.now() - startTime2,
      metrics: { backupSize: Math.round(backupData.length / 1024) }
    };
  } catch (error) {
    results[1] = {
      ...results[1],
      status: 'failed',
      details: 'Backup export failed',
      duration: Date.now() - startTime2
    };
  }

  // Test 3: 5.3 Data Import/Restore
  await new Promise(resolve => setTimeout(resolve, 100));
  results[2].status = 'running';
  const startTime3 = Date.now();
  try {
    // Test restore functionality
    const testBackup = {
      todos: [{ id: 'restore1', text: 'Restored todo', completed: false }],
      templates: [{ id: 'restore_template', name: 'Restored template' }],
      version: 2,
      timestamp: Date.now(),
      appVersion: '1.0.0'
    };
    
    const restoreResult = backupService.importData(JSON.stringify(testBackup));
    
    results[2] = {
      ...results[2],
      status: restoreResult.success ? 'passed' : 'failed',
      details: `Restore: ${restoreResult.success ? 'Success' : 'Failed'} - ${restoreResult.itemsRestored} items restored`,
      duration: Date.now() - startTime3,
      metrics: { restoredItems: restoreResult.itemsRestored }
    };
  } catch (error) {
    results[2] = {
      ...results[2],
      status: 'failed',
      details: 'Data import/restore failed',
      duration: Date.now() - startTime3
    };
  }

  // Test 4: Migration Compatibility
  await new Promise(resolve => setTimeout(resolve, 100));
  results[3].status = 'running';
  const startTime4 = Date.now();
  try {
    // Test v1 to v2 migration during restore
    const oldBackup = {
      todos: [{ id: 'old1', text: 'Old todo', completed: false }],
      templates: [{ id: 'old_template', name: 'Old template' }],
      version: 1
    };
    
    const restoreResult = backupService.importData(JSON.stringify(oldBackup));
    
    results[3] = {
      ...results[3],
      status: restoreResult.success && restoreResult.migrationApplied ? 'passed' : 'failed',
      details: `Migration compatibility: ${restoreResult.migrationApplied ? 'Applied' : 'Not needed'} - ${restoreResult.success ? 'Success' : 'Failed'}`,
      duration: Date.now() - startTime4
    };
  } catch (error) {
    results[3] = {
      ...results[3],
      status: 'failed',
      details: 'Migration compatibility test failed',
      duration: Date.now() - startTime4
    };
  }

  console.log('✅ Phase 5 tests completed!');
  return results;
}

export function logPhase5Results(results: Phase5TestResult[]): void {
  console.log('\\n🧪 PHASE 5 TEST RESULTS 🧪');
  console.log('================================');
  
  results.forEach((result, index) => {
    console.log(`\\n${index + 1}. ${result.name}`);
    console.log(`   Status: ${result.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Time: ${result.duration}ms`);
    console.log(`   Details: ${result.details}`);
    if (result.metrics) {
      Object.entries(result.metrics).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}${key.includes('Size') ? 'KB' : ''}`);
      });
    }
  });
  
  const passedTests = results.filter(r => r.status === 'passed').length;
  const totalTests = results.length;
  
  console.log('\\n📊 SUMMARY');
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Status: ${passedTests >= 3 ? '✅ PHASE 5 COMPLETE' : '⚠️ NEEDS ATTENTION'}`);
}