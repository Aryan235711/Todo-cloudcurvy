import { errorHandler } from '../../services/errorHandlerService';

export const testErrorHandler = () => {
  let passed = 0;
  let total = 0;

  const runTest = (name: string, testFn: () => void | Promise<void>) => {
    total++;
    try {
      const result = testFn();
      if (result instanceof Promise) {
        return result.then(() => {
          passed++;
          console.log(`✓ ${name}`);
        }).catch(err => {
          console.log(`✗ ${name}: ${err.message}`);
        });
      } else {
        passed++;
        console.log(`✓ ${name}`);
      }
    } catch (err: any) {
      console.log(`✗ ${name}: ${err.message}`);
    }
  };

  errorHandler.resetErrorCount();

  runTest('handleError does not crash', () => {
    const testError = new Error('Test error');
    errorHandler.handleError(testError, 'test-context');
  });

  runTest('handleAsyncError returns null on error', async () => {
    const failingPromise = Promise.reject(new Error('Async error'));
    const result = await errorHandler.handleAsyncError(failingPromise, 'test-async');
    if (result !== null) throw new Error('Expected null');
  });

  runTest('tracks error count correctly', () => {
    const testError = new Error('Test error');
    errorHandler.handleError(testError, 'test-1');
    errorHandler.handleError(testError, 'test-2');
    if (errorHandler.getErrorCount() !== 2) throw new Error('Expected count 2');
  });

  runTest('resetErrorCount works', () => {
    const testError = new Error('Test error');
    errorHandler.handleError(testError, 'test');
    errorHandler.resetErrorCount();
    if (errorHandler.getErrorCount() !== 0) throw new Error('Expected count 0');
  });

  return { passed, total, success: passed === total };
};