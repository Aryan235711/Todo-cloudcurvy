#!/bin/bash

# CSS Optimization Test - Phase 1.2
echo "🎨 CSS Bundle Analysis - Phase 1.2"
echo "=================================="

# Get baseline from previous test
if [ -f "performance-results.json" ]; then
    BASELINE_TOTAL=$(grep -o '"total": [0-9]*' performance-results.json | cut -d' ' -f2)
    echo "📋 Baseline Total: $(( $BASELINE_TOTAL / 1024 )) KB"
fi

# Clean and build
rm -rf dist/
npm run build > build-output.log 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    cat build-output.log
    exit 1
fi

# Measure CSS specifically
if [ -d "dist/assets" ]; then
    CSS_SIZE=$(find dist/assets -name "*.css" -exec ls -la {} \; | awk '{sum += $5} END {print sum}')
    TOTAL_SIZE=$(find dist -type f -exec ls -la {} \; | awk '{sum += $5} END {print sum}')
else
    CSS_SIZE=0
    TOTAL_SIZE=0
fi

echo "✅ Build completed"
echo "🎨 CSS Bundle: $(( ${CSS_SIZE:-0} / 1024 )) KB"
echo "📦 Total Bundle: $(( ${TOTAL_SIZE:-0} / 1024 )) KB"

if [ ! -z "$BASELINE_TOTAL" ]; then
    DIFF=$(( $TOTAL_SIZE - $BASELINE_TOTAL ))
    if [ $DIFF -lt 0 ]; then
        echo "📈 Improvement: $(( -$DIFF / 1024 )) KB smaller"
    else
        echo "📉 Regression: $(( $DIFF / 1024 )) KB larger"
    fi
fi