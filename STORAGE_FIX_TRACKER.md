# Storage System - Fix Tracker

**Created:** January 3, 2026  
**Total Issues:** 18  
**Status:** In Progress

---

## Phase 1: Critical Fixes (MUST FIX) 🔴

### ✅ Fix #1: Replace Unsafe JSON.parse
**Priority:** Critical  
**Status:** ⏳ In Progress  
**Files:** `offlineStorageService.ts`, `userPreferencesService.ts`, `indexedDBService.ts`, `crashReportingService.ts`, `preferencesService.ts`  
**Issue:** Direct JSON.parse can crash app on corrupted data  
**Fix:** Use safeJsonParse utility throughout

**Changes:**
- [ ] offlineStorageService.ts - 4 instances (getTodos, getTemplates, getQueue)
- [ ] userPreferencesService.ts - 1 instance (loadPreferences)
- [ ] indexedDBService.ts - 1 instance (migrateFromLocalStorage)
- [ ] crashReportingService.ts - 1 instance (getReports)
- [ ] preferencesService.ts - 1 instance (loadFromStorage)

---

### ⏸️ Fix #2: IndexedDB Error Boundaries
**Priority:** Critical  
**Status:** Not Started  
**Files:** `indexedDBService.ts`  
**Issue:** No fallback when IndexedDB fails  
**Fix:** Add try-catch with localStorage fallback

**Changes:**
- [ ] Add fallback methods for getTodos, saveTodos
- [ ] Add fallback methods for getTemplates, saveTemplates
- [ ] Wrap init() calls in error handlers
- [ ] Log IndexedDB failures with logger

---

### ⏸️ Fix #3: Quota Handling
**Priority:** Critical  
**Status:** Not Started  
**Files:** All storage services  
**Issue:** No QuotaExceededError handling  
**Fix:** Catch quota errors, cleanup old data, retry

**Changes:**
- [ ] Create utils/storageQuota.ts helper
- [ ] Add quota check wrapper for setItem operations
- [ ] Implement cleanOldData() function
- [ ] Add user notification when quota exceeded

---

### ⏸️ Fix #4: Race Condition Fixes
**Priority:** Critical  
**Status:** Not Started  
**Files:** `behavioralStorage.ts`, `offlineStorageService.ts`  
**Issue:** Concurrent updates cause data loss  
**Fix:** Implement debouncing for write operations

**Changes:**
- [ ] Create utils/debounce.ts utility
- [ ] Add debounced save in behavioralStorage
- [ ] Add debounced save in offlineStorageService
- [ ] Use staged writes pattern

---

## Phase 2: High Priority Fixes 🟠

### ⏸️ Fix #5: Consistent Logging
**Priority:** High  
**Status:** Not Started  
**Files:** `offlineStorageService.ts`, `userPreferencesService.ts`, `indexedDBService.ts`  
**Issue:** console.* used instead of logger  
**Fix:** Replace all console.* with logger.*

**Count:** 11 instances
- [ ] offlineStorageService.ts - 3 instances
- [ ] userPreferencesService.ts - 2 instances
- [ ] indexedDBService.ts - 2 instances
- [ ] crashReportingService.ts - 3 instances
- [ ] preferencesService.ts - 1 instance

---

### ⏸️ Fix #6: Type Safety
**Priority:** High  
**Status:** Not Started  
**Files:** `indexedDBService.ts`, `offlineStorageService.ts`  
**Issue:** Returns any[] instead of proper types  
**Fix:** Use Todo[] and Template[] types

**Changes:**
- [ ] Import Todo and Template types
- [ ] Update all method signatures
- [ ] Add type guards where needed

---

### ⏸️ Fix #7: Bounded Queue Growth
**Priority:** High  
**Status:** Not Started  
**Files:** `offlineStorageService.ts`  
**Issue:** Queue can grow unbounded  
**Fix:** Add MAX_QUEUE_SIZE limit

**Changes:**
- [ ] Add MAX_QUEUE_SIZE constant (100)
- [ ] Check size before adding to queue
- [ ] Remove oldest items when full
- [ ] Log when queue is pruned

---

### ⏸️ Fix #8: Data Validation on Load
**Priority:** High  
**Status:** Not Started  
**Files:** `offlineStorageService.ts`, `userPreferencesService.ts`  
**Issue:** No validation of loaded data structure  
**Fix:** Validate arrays and object structures

**Changes:**
- [ ] Add isValidTodo() validator
- [ ] Add isValidTemplate() validator
- [ ] Filter out invalid items
- [ ] Log validation failures

---

### ⏸️ Fix #9: IndexedDB Transaction Safety
**Priority:** High  
**Status:** Not Started  
**Files:** `indexedDBService.ts`  
**Issue:** Partial writes can corrupt database  
**Fix:** Proper transaction error handling

**Changes:**
- [ ] Add transaction.onerror handlers
- [ ] Implement rollback on failure
- [ ] Add transaction.oncomplete logging
- [ ] Test atomic operations

---

### ⏸️ Fix #10: Compression
**Priority:** High  
**Status:** Not Started  
**Files:** All storage services  
**Issue:** No compression, wastes quota  
**Fix:** Compress large data before storage

**Changes:**
- [ ] Create utils/compression.ts
- [ ] Implement compress/decompress functions
- [ ] Update setItem operations
- [ ] Update getItem operations

---

## Phase 3: Medium Priority Fixes 🟡

### ⏸️ Fix #11: Extract Magic Strings
**Priority:** Medium  
**Status:** Not Started  
**Files:** Multiple  
**Issue:** Storage keys hardcoded everywhere  
**Fix:** Create storageConstants.ts

---

### ⏸️ Fix #12: Cross-Tab Sync
**Priority:** Medium  
**Status:** Not Started  
**Files:** All storage services  
**Issue:** No storage event listeners  
**Fix:** Add window.addEventListener('storage')

---

### ⏸️ Fix #13: Backup Validation
**Priority:** Medium  
**Status:** Not Started  
**Files:** `backupService.ts`  
**Issue:** Weak data integrity checks  
**Fix:** Comprehensive validation

---

### ⏸️ Fix #14: Efficient Iteration
**Priority:** Medium  
**Status:** Not Started  
**Files:** `storageHealthAnalyzer.ts`  
**Issue:** Slow hasOwnProperty iteration  
**Fix:** Use Object.keys()

---

### ⏸️ Fix #15: Encryption
**Priority:** Medium  
**Status:** Not Started  
**Files:** `apiKeyService.ts`, `userPreferencesService.ts`  
**Issue:** Sensitive data in plain text  
**Fix:** Encrypt API keys and preferences

---

## Phase 4: Low Priority Fixes 🔵

### ⏸️ Fix #16: Remove Unused Code
**Priority:** Low  
**Status:** Not Started  
**Files:** `indexedDBService.ts`  
**Issue:** migrateFromLocalStorage never called  
**Fix:** Call during init or remove

---

### ⏸️ Fix #17: Optimize Calculations
**Priority:** Low  
**Status:** Not Started  
**Files:** `storageHealthAnalyzer.ts`  
**Issue:** Inefficient size calculation  
**Fix:** Use reduce pattern

---

### ⏸️ Fix #18: Add Telemetry
**Priority:** Low  
**Status:** Not Started  
**Files:** All storage services  
**Issue:** No metrics tracking  
**Fix:** Create StorageMetrics service

---

## Progress Summary

| Phase | Total | Complete | In Progress | Not Started |
|-------|-------|----------|-------------|-------------|
| Phase 1 (Critical) | 4 | 0 | 1 | 3 |
| Phase 2 (High) | 6 | 0 | 0 | 6 |
| Phase 3 (Medium) | 5 | 0 | 0 | 5 |
| Phase 4 (Low) | 3 | 0 | 0 | 3 |
| **TOTAL** | **18** | **0** | **1** | **17** |

---

## Completion Checklist

### Fix #1 Completion
- [ ] All unsafe JSON.parse replaced with safeJsonParse
- [ ] Import safeJsonParse added to all files
- [ ] TypeScript compiles without errors
- [ ] No runtime errors in console
- [ ] Manual testing completed

### Phase 1 Completion
- [ ] All 4 critical fixes implemented
- [ ] Full test suite passes
- [ ] No console errors
- [ ] TypeScript clean
- [ ] Code review completed

### Phase 2 Completion
- [ ] All 6 high priority fixes implemented
- [ ] Logger integrated throughout
- [ ] Type safety enforced
- [ ] Queue limits tested
- [ ] Validation working

---

## Notes

- Focus on Phase 1 first - these are blocking issues
- Test each fix individually before moving to next
- Run `npm run typecheck` after each change
- Update this tracker as work progresses
- Mark items complete with ✅ when done

**Last Updated:** January 3, 2026
