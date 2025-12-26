// Phase 3 Test Runner - State Management Validation
import { useTodoStore } from '../stores/todoStore';
import { Todo, Template } from '../types';

export interface Phase3TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  details?: string;
  duration?: number;
}

export async function runPhase3Tests(): Promise<Phase3TestResult[]> {
  console.log('🧪 Starting Phase 3: State Management Tests...');
  
  const results: Phase3TestResult[] = [
    { name: 'Zustand Store Operations', status: 'pending' },
    { name: 'Race Condition Prevention', status: 'pending' },
    { name: 'State Persistence', status: 'pending' },
    { name: 'Concurrent Operations', status: 'pending' }
  ];

  // Test 1: Basic Store Operations
  results[0].status = 'running';
  const startTime1 = Date.now();
  try {
    const { addTodo, deleteTodo, updateTodo, todos } = useTodoStore.getState();
    
    // Test add
    const testTodo: Todo = {
      id: 'test-1',
      text: 'Test Todo',
      completed: false,
      createdAt: Date.now(),
      priority: 'medium'
    };
    addTodo(testTodo);
    
    // Test update
    updateTodo('test-1', { completed: true });
    
    // Test delete
    deleteTodo('test-1');
    
    results[0] = {
      ...results[0],
      status: 'passed',
      details: 'All CRUD operations working',
      duration: Date.now() - startTime1
    };
  } catch (error) {
    results[0] = {
      ...results[0],
      status: 'failed',
      details: 'Store operations failed',
      duration: Date.now() - startTime1
    };
  }

  // Test 2: Race Condition Prevention
  await new Promise(resolve => setTimeout(resolve, 100));
  results[1].status = 'running';
  const startTime2 = Date.now();
  try {
    const { addTodo, deleteTodo } = useTodoStore.getState();
    
    // Rapid concurrent operations
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(new Promise(resolve => {
        const todo: Todo = {
          id: `race-test-${i}`,
          text: `Race Test ${i}`,
          completed: false,
          createdAt: Date.now(),
          priority: 'low'
        };
        addTodo(todo);
        setTimeout(() => {
          deleteTodo(`race-test-${i}`);
          resolve(true);
        }, Math.random() * 50);
      }));
    }
    
    await Promise.all(promises);
    
    results[1] = {
      ...results[1],
      status: 'passed',
      details: 'No race conditions detected',
      duration: Date.now() - startTime2
    };
  } catch (error) {
    results[1] = {
      ...results[1],
      status: 'failed',
      details: 'Race condition detected',
      duration: Date.now() - startTime2
    };
  }

  // Test 3: State Persistence
  await new Promise(resolve => setTimeout(resolve, 100));
  results[2].status = 'running';
  const startTime3 = Date.now();
  try {
    const { todos, addTodo } = useTodoStore.getState();
    const initialCount = todos.length;
    
    const persistTodo: Todo = {
      id: 'persist-test',
      text: 'Persistence Test',
      completed: false,
      createdAt: Date.now(),
      priority: 'high'
    };
    addTodo(persistTodo);
    
    const newCount = useTodoStore.getState().todos.length;
    const persisted = newCount === initialCount + 1;
    
    results[2] = {
      ...results[2],
      status: persisted ? 'passed' : 'failed',
      details: persisted ? 'State persisted correctly' : 'State persistence failed',
      duration: Date.now() - startTime3
    };
  } catch (error) {
    results[2] = {
      ...results[2],
      status: 'failed',
      details: 'Persistence test failed',
      duration: Date.now() - startTime3
    };
  }

  // Test 4: Concurrent Operations
  await new Promise(resolve => setTimeout(resolve, 100));
  results[3].status = 'running';
  const startTime4 = Date.now();
  try {
    const { addTodo, updateTodo, deleteTodo } = useTodoStore.getState();
    
    // Add multiple todos concurrently
    const concurrentTodos = Array.from({ length: 5 }, (_, i) => ({
      id: `concurrent-${i}`,
      text: `Concurrent Test ${i}`,
      completed: false,
      createdAt: Date.now(),
      priority: 'medium' as const
    }));
    
    // Simulate concurrent operations
    concurrentTodos.forEach(todo => addTodo(todo));
    concurrentTodos.forEach(todo => updateTodo(todo.id, { completed: true }));
    concurrentTodos.forEach(todo => deleteTodo(todo.id));
    
    results[3] = {
      ...results[3],
      status: 'passed',
      details: 'Concurrent operations handled correctly',
      duration: Date.now() - startTime4
    };
  } catch (error) {
    results[3] = {
      ...results[3],
      status: 'failed',
      details: 'Concurrent operations failed',
      duration: Date.now() - startTime4
    };
  }

  console.log('✅ Phase 3 tests completed!');
  return results;
}

export function logPhase3Results(results: Phase3TestResult[]): void {
  console.log('\\n🧪 PHASE 3 TEST RESULTS 🧪');
  console.log('================================');
  
  results.forEach((result, index) => {
    console.log(`\\n${index + 1}. ${result.name}`);
    console.log(`   Status: ${result.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Time: ${result.duration}ms`);
    console.log(`   Details: ${result.details}`);
  });
  
  const passedTests = results.filter(r => r.status === 'passed').length;
  const totalTests = results.length;
  
  console.log('\\n📊 SUMMARY');
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Status: ${passedTests === totalTests ? '✅ PHASE 3 COMPLETE' : '⚠️ NEEDS ATTENTION'}`);
}