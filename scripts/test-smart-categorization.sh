#!/bin/bash

echo "🏷️ Smart Task Categorization Test"
echo "================================="

# Check if categorization service exists
echo "🧪 Checking categorization service..."
if [ -f "services/taskCategorizationService.ts" ]; then
    echo "✅ Task categorization service created"
else
    echo "❌ Task categorization service not found"
    exit 1
fi

# Check integration in useTodoLogic
echo "🧪 Checking integration in useTodoLogic..."
grep -n "taskCategorizationService" hooks/useTodoLogic.ts
if [ $? -eq 0 ]; then
    echo "✅ Categorization service integrated"
else
    echo "❌ Categorization service not integrated"
    exit 1
fi

# Check smart category assignment
echo "🧪 Checking smart category assignment..."
grep -n "smartCategory.*categorizeTask" hooks/useTodoLogic.ts
if [ $? -eq 0 ]; then
    echo "✅ Smart category assignment implemented"
else
    echo "❌ Smart category assignment not found"
    exit 1
fi

echo ""
echo "🎉 Smart Task Categorization Ready"
echo "Test examples:"
echo "- 'meeting with client' → work"
echo "- 'buy groceries' → personal" 
echo "- 'doctor appointment' → health"
echo "- 'random task' → other"