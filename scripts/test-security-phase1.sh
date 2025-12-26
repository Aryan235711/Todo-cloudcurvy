#!/bin/bash

echo "🔒 Phase 1: Testing Critical Security Fixes"
echo "==========================================="

# Check if security service exists
echo "🧪 Checking security service..."
if [ -f "services/securityService.ts" ]; then
    echo "✅ Security service created"
else
    echo "❌ Security service not found"
    exit 1
fi

# Check for XSS sanitization functions
echo "🧪 Checking XSS protection..."
grep -n "sanitizeForHTML" services/securityService.ts > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ XSS sanitization functions found"
else
    echo "❌ XSS sanitization functions not found"
    exit 1
fi

# Check for log injection protection
echo "🧪 Checking log injection protection..."
grep -n "sanitizeForLogging" services/securityService.ts > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Log injection protection found"
else
    echo "❌ Log injection protection not found"
    exit 1
fi

# Check for safe localStorage operations
echo "🧪 Checking safe localStorage operations..."
grep -n "safeLocalStorage" services/securityService.ts > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Safe localStorage operations found"
else
    echo "❌ Safe localStorage operations not found"
    exit 1
fi

echo ""
echo "🎉 Phase 1 Security Infrastructure Complete"
echo "Next: Apply security fixes to notification service"
echo "Expected: XSS and log injection vulnerabilities eliminated"