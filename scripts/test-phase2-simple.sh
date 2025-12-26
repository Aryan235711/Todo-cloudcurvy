#!/bin/bash

echo "🛡️ Phase 2: Testing Error Boundaries"
echo "===================================="

# Check if error handling is added to TodoInput
echo "🧪 Checking error boundary in TodoInput..."
grep -n "try" components/features/todo/TodoInput.tsx
if [ $? -eq 0 ]; then
    echo "✅ Error boundary added to TodoInput"
else
    echo "❌ Error boundary not found in TodoInput"
    exit 1
fi

# Check for catch block
echo "🧪 Checking catch block..."
grep -n "catch.*error" components/features/todo/TodoInput.tsx
if [ $? -eq 0 ]; then
    echo "✅ Catch block found"
else
    echo "❌ Catch block not found"
    exit 1
fi

# Verify voice service error handling exists
echo "🧪 Checking voice service error handling..."
grep -n "catch" services/speechService.ts
if [ $? -eq 0 ]; then
    echo "✅ Voice service has error handling"
else
    echo "❌ Voice service missing error handling"
    exit 1
fi

echo ""
echo "🎉 Phase 2 Complete: Error Boundaries"
echo "Next: Test error handling in voice operations"
echo "Expected: Graceful error handling for voice failures"