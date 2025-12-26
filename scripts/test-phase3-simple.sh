#!/bin/bash

echo "🎤 Phase 3: Testing Voice Permissions"
echo "===================================="

# Check voice permission debugging
echo "🧪 Checking voice permission debugging..."
grep -n "console.log.*Voice permissions" services/speechService.ts
if [ $? -eq 0 ]; then
    echo "✅ Voice permission debugging added"
else
    echo "❌ Voice permission debugging not found"
    exit 1
fi

# Check voice mode logging
echo "🧪 Checking voice mode logging..."
grep -n "console.log.*speech available" services/speechService.ts
if [ $? -eq 0 ]; then
    echo "✅ Voice mode logging found"
else
    echo "❌ Voice mode logging not found"
    exit 1
fi

# Check permission denial logging
echo "🧪 Checking permission denial logging..."
grep -n "console.warn.*permission denied" services/speechService.ts
if [ $? -eq 0 ]; then
    echo "✅ Permission denial logging found"
else
    echo "❌ Permission denial logging not found"
    exit 1
fi

# Verify speech recognition dependency
echo "🧪 Checking speech recognition dependency..."
grep -n "speech-recognition" package.json
if [ $? -eq 0 ]; then
    echo "✅ Speech recognition dependency found"
else
    echo "❌ Speech recognition dependency missing"
    exit 1
fi

echo ""
echo "🎉 Phase 3 Complete: Voice Permissions"
echo "Next: Test voice permissions on iOS/Android"
echo "Expected: Detailed permission logging in Xcode console"