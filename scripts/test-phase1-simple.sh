#!/bin/bash

echo "🎯 Phase 1: Testing Critical Bug Fixes"
echo "======================================"

# Check if the critical bug fixes are in place
echo "🧪 Checking todo filtering fix..."
grep -n "return !t.deletedAt || t.deletedAt > thirtyDaysAgo" hooks/useTodoLogic.ts
if [ $? -eq 0 ]; then
    echo "✅ Todo filtering fix applied correctly"
else
    echo "❌ Todo filtering fix not found"
    exit 1
fi

echo "🧪 Checking sort mode fix..."
grep -n "if (sortMode === 'newest') return list.sort" hooks/useTodoLogic.ts
if [ $? -eq 0 ]; then
    echo "✅ Sort mode fix applied correctly"
else
    echo "❌ Sort mode fix not found"
    exit 1
fi

# Check file structure
echo "📁 Verifying file structure..."
if [ -f "hooks/useTodoLogic.ts" ] && [ -f "services/speechService.ts" ]; then
    echo "✅ Core voice files present"
else
    echo "❌ Missing core voice files"
    exit 1
fi

echo ""
echo "🎉 Phase 1 Complete: Critical Bug Fixes"
echo "Next: Build and test the app to verify fixes work"
echo "Expected: Fixed todo filtering and sorting behavior"