#!/bin/bash

echo "🗣️ Phase 4: Testing Voice Commands"
echo "=================================="

# Check voice command service exists
echo "🧪 Checking voice command service..."
if [ -f "services/voiceCommandService.ts" ]; then
    echo "✅ Voice command service created"
else
    echo "❌ Voice command service not found"
    exit 1
fi

# Check parseVoiceCommand function
echo "🧪 Checking parseVoiceCommand function..."
grep -n "parseVoiceCommand" services/voiceCommandService.ts
if [ $? -eq 0 ]; then
    echo "✅ parseVoiceCommand function found"
else
    echo "❌ parseVoiceCommand function not found"
    exit 1
fi

# Check voice command integration in useTodoLogic
echo "🧪 Checking voice command integration..."
grep -n "parseVoiceCommand" hooks/useTodoLogic.ts
if [ $? -eq 0 ]; then
    echo "✅ Voice command integration found"
else
    echo "❌ Voice command integration not found"
    exit 1
fi

# Check priority parsing
echo "🧪 Checking priority parsing..."
grep -n "parsed.priority" hooks/useTodoLogic.ts
if [ $? -eq 0 ]; then
    echo "✅ Priority parsing integrated"
else
    echo "❌ Priority parsing not found"
    exit 1
fi

echo ""
echo "🎉 Phase 4 Complete: Voice Commands"
echo "Next: Test voice commands like 'urgent buy milk' or 'low priority clean room'"
echo "Expected: Voice input automatically sets priority and cleans text"