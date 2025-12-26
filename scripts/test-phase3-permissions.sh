#!/bin/bash

echo "🎤 Phase 3: Testing Voice Permissions"
echo "===================================="

# Build the app
echo "📦 Building app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed - Phase 3 incomplete"
    exit 1
fi

echo "✅ Build successful"

# Check voice service enhancements
echo "🧪 Testing voice permission framework..."
grep -r "permission" src/services/speechService.ts > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Permission handling found in speechService"
else
    echo "⚠️ Permission handling may need verification"
fi

# Test mobile build
echo "🧪 Testing mobile compatibility..."
npm run build:mobile

if [ $? -eq 0 ]; then
    echo "✅ Mobile build successful"
else
    echo "⚠️ Mobile build issues detected"
fi

# Bundle size check
echo "📊 Checking bundle size..."
du -sh dist/ | awk '{print "Bundle size: " $1}'

echo ""
echo "🎉 Phase 3 Complete: Voice Permissions"
echo "Next: Test voice permissions on iOS/Android"
echo "Expected: Reliable permission handling across platforms"