import { triggerHaptic, sendNudge } from '../../services/notificationService';

export const testNotificationService = () => {
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

  runTest('triggerHaptic does not crash', () => {
    triggerHaptic('light');
  });

  runTest('triggerHaptic handles different intensities', () => {
    triggerHaptic('medium');
    triggerHaptic('heavy');
  });

  runTest('sendNudge handles invalid input', async () => {
    const result = await sendNudge('', '');
    if (typeof result !== 'boolean') throw new Error('Expected boolean');
  });

  runTest('sendNudge handles valid input', async () => {
    const result = await sendNudge('Test message', 'test-context');
    if (typeof result !== 'boolean') throw new Error('Expected boolean');
  });

  return { passed, total, success: passed === total };
};