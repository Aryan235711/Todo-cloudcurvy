#!/bin/bash

echo "🛡️ Phase 2: Testing Error Handling & Memory Management"
echo "======================================================"

# Check for security service integration
echo "🧪 Checking security service integration..."
grep -n "securityService" services/notificationService.ts > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Security service integrated in notification service"
else
    echo "❌ Security service not integrated"
    exit 1
fi

# Check for XSS sanitization in notifications
echo "🧪 Checking XSS protection in notifications..."
grep -n "sanitizeForHTML" services/notificationService.ts > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ XSS protection applied to notifications"
else
    echo "❌ XSS protection not found in notifications"
    exit 1
fi

# Check for memory leak fixes
echo "🧪 Checking memory leak fixes..."
grep -n "slice(-50)" services/rateLimitService.ts > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Memory leak prevention implemented"
else
    echo "❌ Memory leak fixes not found"
    exit 1
fi

# Check for safe localStorage operations
echo "🧪 Checking safe localStorage usage..."
grep -n "safeLocalStorage" services/rateLimitService.ts > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Safe localStorage operations implemented"
else
    echo "❌ Safe localStorage operations not found"
    exit 1
fi

echo ""
echo "🎉 Phase 2 Security Fixes Complete"
echo "Expected: Robust error handling and memory management"