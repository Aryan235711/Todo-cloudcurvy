// Simple error handler tests
import { errorHandler } from '../../services/errorHandlerService';

export function testErrorHandler() {
  const results = [];
  
  try {
    // Test 1: handleError doesn't crash
    const testError = new Error('Test error');
    errorHandler.handleError(testError, 'test');
    results.push({ test: 'handleError', passed: true });
  } catch (error) {
    results.push({ test: 'handleError', passed: false, error: error.message });
  }
  
  try {
    // Test 2: error count tracking
    errorHandler.resetErrorCount();
    errorHandler.handleError(new Error('Test'), 'test');
    const count = errorHandler.getErrorCount();
    results.push({ test: 'errorCount', passed: count === 1 });
  } catch (error) {
    results.push({ test: 'errorCount', passed: false, error: error.message });
  }
  
  return results;
}