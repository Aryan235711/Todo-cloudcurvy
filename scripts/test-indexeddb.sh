#!/bin/bash

# IndexedDB Storage Test - Phase 4.1
echo "🗄️  IndexedDB Storage Optimization - Phase 4.1"
echo "=============================================="

# Get baseline
if [ -f "performance-results.json" ]; then
    BASELINE_TOTAL=$(grep -o '"total": [0-9]*' performance-results.json | cut -d' ' -f2)
    echo "📋 Baseline Bundle: $(( $BASELINE_TOTAL / 1024 )) KB"
fi

# Clean build
rm -rf dist/
npm run build > build-output.log 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    cat build-output.log
    exit 1
fi

# Check for IndexedDB service
if [ -f "dist/assets/index-"*".js" ]; then
    # Check if IndexedDB code is present in bundle
    if grep -q "indexedDB\|IDBDatabase" dist/assets/index-*.js; then
        echo "✅ IndexedDB implementation found in bundle"
    else
        echo "⚠️  IndexedDB implementation not detected"
    fi
fi

# Measure bundle impact
if [ -d "dist" ]; then
    TOTAL_SIZE=$(find dist -type f -exec ls -la {} \; | awk '{sum += $5} END {print sum}')
    JS_SIZE=$(find dist/assets -name "*.js" -exec ls -la {} \; | awk '{sum += $5} END {print sum}')
else
    TOTAL_SIZE=0
    JS_SIZE=0
fi

echo "✅ Build completed"
echo "📦 Total Bundle: $(( ${TOTAL_SIZE:-0} / 1024 )) KB"
echo "📜 JS Bundle: $(( ${JS_SIZE:-0} / 1024 )) KB"

# Performance benefits analysis
echo ""
echo "🚀 Expected Performance Improvements:"
echo "  ✅ Non-blocking data operations"
echo "  ✅ Faster app startup (async loading)"
echo "  ✅ Better scalability (1000+ tasks)"
echo "  ✅ Improved offline reliability"

if [ ! -z "$BASELINE_TOTAL" ]; then
    DIFF=$(( $TOTAL_SIZE - $BASELINE_TOTAL ))
    if [ $DIFF -lt 0 ]; then
        echo "📈 Bundle: $(( -$DIFF / 1024 )) KB smaller"
    elif [ $DIFF -eq 0 ]; then
        echo "📊 Bundle: Same size"
    else
        echo "📉 Bundle: $(( $DIFF / 1024 )) KB larger (IndexedDB service)"
    fi
fi