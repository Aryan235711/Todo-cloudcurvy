#!/bin/bash

# Service Worker Test - Phase 3.2
echo "⚡ Service Worker Optimization - Phase 3.2"
echo "========================================="

# Get baseline
if [ -f "performance-results.json" ]; then
    BASELINE_TOTAL=$(grep -o '"total": [0-9]*' performance-results.json | cut -d' ' -f2)
    echo "📋 Baseline: $(( $BASELINE_TOTAL / 1024 )) KB"
fi

# Clean build
rm -rf dist/
npm run build > build-output.log 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    cat build-output.log
    exit 1
fi

# Check service worker
if [ -f "dist/sw.js" ]; then
    SW_SIZE=$(ls -la dist/sw.js | awk '{print $5}')
    echo "✅ Service Worker: $(( $SW_SIZE / 1024 )) KB"
else
    echo "⚠️  No service worker found"
fi

# Measure total
if [ -d "dist" ]; then
    TOTAL_SIZE=$(find dist -type f -exec ls -la {} \; | awk '{sum += $5} END {print sum}')
    FILE_COUNT=$(find dist -type f | wc -l)
else
    TOTAL_SIZE=0
    FILE_COUNT=0
fi

echo "✅ Build completed"
echo "📦 Total Bundle: $(( ${TOTAL_SIZE:-0} / 1024 )) KB"
echo "📁 Files: $FILE_COUNT"

# Check for caching headers in build
echo ""
echo "🗄️  Caching Strategy:"
if [ -f "dist/sw.js" ]; then
    if grep -q "cache" dist/sw.js; then
        echo "  ✅ Asset caching enabled"
    fi
    if grep -q "offline" dist/sw.js; then
        echo "  ✅ Offline support enabled"
    fi
fi

if [ ! -z "$BASELINE_TOTAL" ]; then
    DIFF=$(( $TOTAL_SIZE - $BASELINE_TOTAL ))
    if [ $DIFF -lt 0 ]; then
        echo "📈 Improvement: $(( -$DIFF / 1024 )) KB smaller"
    elif [ $DIFF -eq 0 ]; then
        echo "📊 Maintained: Same size"
    else
        echo "📉 Addition: $(( $DIFF / 1024 )) KB (service worker)"
    fi
fi