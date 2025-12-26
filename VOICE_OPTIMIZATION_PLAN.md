# Voice System Optimization Plan

## Phase-based Approach: Fix → Test → Verify → Push

### Phase 1: Critical Bug Fixes
**Target**: Fix todo filtering and sorting logic bugs
- Fix deleted todo filtering condition in `useTodoLogic.ts`
- Fix sort mode fall-through bug for 'newest' sorting
- **Test Script**: `scripts/test-phase1-bugs.sh`

### Phase 2: Error Boundaries
**Target**: Add error handling around async voice operations
- Add try-catch wrapper for `onMagic` in `TodoInput.tsx`
- Enhance error handling in voice operations
- **Test Script**: `scripts/test-phase2-errors.sh`

### Phase 3: Voice Permission Testing
**Target**: Comprehensive voice permission testing framework
- Create voice permission test utilities
- Add permission state debugging
- **Test Script**: `scripts/test-phase3-permissions.sh`

### Phase 4: Voice Command Parsing (Optional)
**Target**: Advanced voice command features
- Add basic voice command parsing
- Implement voice shortcuts for common actions
- **Test Script**: `scripts/test-phase4-commands.sh`

## Testing Strategy
- Each phase has dedicated test script
- Git commit after each successful phase
- Rollback capability if issues arise
- Mobile testing on iPad via Xcode console

## Success Metrics
- Zero critical bugs in voice system
- Proper error handling for all async operations
- Reliable voice permissions across platforms
- Enhanced voice UX with command parsing