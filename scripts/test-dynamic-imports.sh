#!/bin/bash

# Dynamic Import Test - Phase 2.1
echo "⚡ Dynamic Import Optimization - Phase 2.1"
echo "=========================================="

# Get baseline
if [ -f "performance-results.json" ]; then
    BASELINE_TOTAL=$(grep -o '"total": [0-9]*' performance-results.json | cut -d' ' -f2)
    echo "📋 Baseline: $(( $BASELINE_TOTAL / 1024 )) KB"
fi

# Clean build and check for warnings
rm -rf dist/
echo "🔍 Checking for dynamic import warnings..."
npm run build 2>&1 | tee build-output.log

# Check if warning is resolved
if grep -q "dynamically imported.*but also statically imported" build-output.log; then
    echo "⚠️  Dynamic import warning still present"
else
    echo "✅ Dynamic import warning resolved"
fi

# Measure results
if [ -d "dist/assets" ]; then
    TOTAL_SIZE=$(find dist -type f -exec ls -la {} \; | awk '{sum += $5} END {print sum}')
    CHUNK_COUNT=$(find dist/assets -name "*.js" | wc -l)
else
    TOTAL_SIZE=0
    CHUNK_COUNT=0
fi

echo "📦 Total Bundle: $(( ${TOTAL_SIZE:-0} / 1024 )) KB"
echo "🧩 JS Chunks: $CHUNK_COUNT"

if [ ! -z "$BASELINE_TOTAL" ]; then
    DIFF=$(( $TOTAL_SIZE - $BASELINE_TOTAL ))
    if [ $DIFF -lt 0 ]; then
        echo "📈 Improvement: $(( -$DIFF / 1024 )) KB smaller"
    elif [ $DIFF -eq 0 ]; then
        echo "📊 Maintained: Same size"
    else
        echo "📉 Regression: $(( $DIFF / 1024 )) KB larger"
    fi
fi