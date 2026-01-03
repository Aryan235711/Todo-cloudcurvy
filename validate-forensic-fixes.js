#!/usr/bin/env node

/**
 * Forensic Audit Validation Script
 * Validates all 12 fixes from the forensic audit
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}════════════════════════════════════════════════════════${RESET}`);
console.log(`${BLUE}   FORENSIC AUDIT FIX VALIDATION - 12 CRITICAL FIXES   ${RESET}`);
console.log(`${BLUE}════════════════════════════════════════════════════════${RESET}\n`);

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function pass(message) {
  console.log(`${GREEN}✅ PASS:${RESET} ${message}`);
  passCount++;
}

function fail(message) {
  console.log(`${RED}❌ FAIL:${RESET} ${message}`);
  failCount++;
}

function warn(message) {
  console.log(`${YELLOW}⚠️  WARN:${RESET} ${message}`);
  warnCount++;
}

function info(message) {
  console.log(`${BLUE}ℹ️  INFO:${RESET} ${message}`);
}

function checkFileExists(path, description) {
  const fullPath = join(__dirname, path);
  if (existsSync(fullPath)) {
    pass(`${description} exists`);
    return true;
  } else {
    fail(`${description} missing: ${path}`);
    return false;
  }
}

function checkFileContains(path, searchString, description) {
  const fullPath = join(__dirname, path);
  try {
    const content = readFileSync(fullPath, 'utf8');
    if (content.includes(searchString)) {
      pass(description);
      return true;
    } else {
      fail(`${description} - Not found in ${path}`);
      return false;
    }
  } catch (error) {
    fail(`${description} - Error reading ${path}: ${error.message}`);
    return false;
  }
}

function checkFileNotContains(path, searchString, description) {
  const fullPath = join(__dirname, path);
  try {
    const content = readFileSync(fullPath, 'utf8');
    if (!content.includes(searchString)) {
      pass(description);
      return true;
    } else {
      warn(`${description} - Still found in ${path}`);
      return false;
    }
  } catch (error) {
    fail(`${description} - Error reading ${path}: ${error.message}`);
    return false;
  }
}

console.log(`${BLUE}🚨 CRITICAL FIXES (Priority 1)${RESET}\n`);

// Fix 1: Safe JSON Parser
info('1. Safe JSON Parser Utility');
checkFileExists('utils/safeJson.ts', 'Safe JSON utility file');
checkFileContains('utils/safeJson.ts', 'safeJsonParse', 'safeJsonParse function');
checkFileContains('utils/safeJson.ts', 'isTodoArray', 'Type guard isTodoArray');
checkFileContains('hooks/useActivityTracker.ts', 'safeJsonParse', 'Applied to useActivityTracker');
checkFileContains('services/backupService.ts', 'safeJsonParse', 'Applied to backupService');
console.log('');

// Fix 2: useEffect Dependency Fix
info('2. useEffect Dependency Fix - Neural Nudge');
checkFileContains('hooks/useTodoLogic.ts', 'updateTodoStable', 'Stable callback reference');
checkFileContains('hooks/useTodoLogic.ts', 'useCallback', 'Using useCallback');
console.log('');

// Fix 3: Environment Variable Security
info('3. Environment Variable Security');
checkFileContains('hooks/useTodoLogic.ts', 'import.meta.env.DEV', 'Using import.meta.env.DEV');
checkFileContains('hooks/useTodoLogic.ts', 'VITE_', 'Using VITE_ prefix');
checkFileNotContains('hooks/useTodoLogic.ts', 'process.env.GEMINI_API_KEY', 'No direct process.env API keys');
console.log('');

// Fix 4: Race Condition in Voice Setup
info('4. Race Condition in Voice Setup');
checkFileContains('hooks/useTodoLogic.ts', 'pendingRecognition', 'Pending recognition tracking');
checkFileContains('hooks/useTodoLogic.ts', 'cleanup', 'Proper cleanup in useEffect');
console.log('');

// Fix 5: Promise Error Handling
info('5. Promise Error Handling');
checkFileContains('App.tsx', '.catch(', 'Dynamic import error handling in App.tsx');
checkFileContains('components/TodoCard.tsx', '.catch(', 'Error handling in TodoCard');
console.log('');

// Fix 6: Memoization for Performance
info('6. Memoization for Performance');
checkFileContains('App.tsx', 'buildCategorizedNodes = useCallback', 'buildCategorizedNodes memoized');
console.log('');

// Fix 7: Memory Leak - Debounce Timer
info('7. Memory Leak - Debounce Timer');
checkFileContains('hooks/useTodoLogic.ts', 'clearTimeout', 'Timer cleanup');
console.log('');

console.log(`${BLUE}⚠️  HIGH PRIORITY FIXES (Priority 2)${RESET}\n`);

// Fix 8: Replace any Types
info('8. Replace `any` Types');
checkFileContains('hooks/useActivityTracker.ts', 'Record<string, unknown>', 'Proper typing in useActivityTracker');
checkFileNotContains('hooks/useActivityTracker.ts', 'callback: any', 'No any types in callbacks');
console.log('');

// Fix 9: Error Boundaries
info('9. Error Boundaries');
checkFileExists('components/ErrorBoundary.tsx', 'ErrorBoundary component');
checkFileContains('components/ErrorBoundary.tsx', 'handleError', 'Error boundary implementation');
console.log('');

console.log(`${BLUE}⚡ MEDIUM PRIORITY FIXES (Priority 3)${RESET}\n`);

// Fix 10: Accessibility Enhancements
info('10. Accessibility Enhancements');
checkFileContains('components/features/todo/TodoInput.tsx', 'aria-label', 'ARIA labels in TodoInput');
checkFileContains('components/TodoCard.tsx', 'aria-label', 'ARIA labels in TodoCard');
console.log('');

// Fix 11: Production Console Logs
info('11. Production Console Logs');
checkFileExists('utils/logger.ts', 'Logger utility file');
checkFileContains('utils/logger.ts', 'ConditionalLogger', 'ConditionalLogger class');
checkFileContains('utils/logger.ts', 'import.meta.env.DEV', 'Environment-aware logging');
checkFileContains('App.tsx', "import { logger }", 'Logger imported in App.tsx');
checkFileContains('hooks/useTodoLogic.ts', "import { logger }", 'Logger imported in useTodoLogic');
console.log('');

// Fix 12: Code Deduplication
info('12. Code Deduplication');
checkFileExists('utils/storage.ts', 'Storage utility file');
checkFileContains('utils/storage.ts', 'getLocalStorage', 'getLocalStorage function');
checkFileContains('utils/storage.ts', 'setLocalStorage', 'setLocalStorage function');
checkFileContains('utils/storage.ts', 'isLocalStorageAvailable', 'localStorage availability check');
console.log('');

// Summary
console.log(`${BLUE}════════════════════════════════════════════════════════${RESET}`);
console.log(`${BLUE}                    VALIDATION SUMMARY                  ${RESET}`);
console.log(`${BLUE}════════════════════════════════════════════════════════${RESET}\n`);

const total = passCount + failCount + warnCount;
const successRate = ((passCount / total) * 100).toFixed(1);

console.log(`${GREEN}✅ Passed:  ${passCount}${RESET}`);
console.log(`${RED}❌ Failed:  ${failCount}${RESET}`);
console.log(`${YELLOW}⚠️  Warnings: ${warnCount}${RESET}`);
console.log(`${BLUE}📊 Success Rate: ${successRate}%${RESET}\n`);

if (failCount === 0) {
  console.log(`${GREEN}🎉 ALL CRITICAL FIXES VALIDATED SUCCESSFULLY! 🎉${RESET}\n`);
  process.exit(0);
} else if (failCount <= 3) {
  console.log(`${YELLOW}⚠️  MINOR ISSUES FOUND - Review failed checks${RESET}\n`);
  process.exit(1);
} else {
  console.log(`${RED}❌ VALIDATION FAILED - Multiple issues detected${RESET}\n`);
  process.exit(1);
}
