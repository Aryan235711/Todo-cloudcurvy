#!/bin/bash

# Asset Optimization Test - Phase 3.1
echo "🖼️  Asset Optimization - Phase 3.1"
echo "================================="

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

# Analyze asset breakdown
if [ -d "dist/assets" ]; then
    CSS_SIZE=$(find dist/assets -name "*.css" -exec ls -la {} \; | awk '{sum += $5} END {print sum}')
    JS_SIZE=$(find dist/assets -name "*.js" -exec ls -la {} \; | awk '{sum += $5} END {print sum}')
    HTML_SIZE=$(find dist -name "*.html" -exec ls -la {} \; | awk '{sum += $5} END {print sum}')
    TOTAL_SIZE=$(find dist -type f -exec ls -la {} \; | awk '{sum += $5} END {print sum}')
else
    CSS_SIZE=0
    JS_SIZE=0
    HTML_SIZE=0
    TOTAL_SIZE=0
fi

echo "✅ Build completed"
echo "📊 Asset Breakdown:"
echo "  CSS:   $(( ${CSS_SIZE:-0} / 1024 )) KB"
echo "  JS:    $(( ${JS_SIZE:-0} / 1024 )) KB"
echo "  HTML:  $(( ${HTML_SIZE:-0} / 1024 )) KB"
echo "  Total: $(( ${TOTAL_SIZE:-0} / 1024 )) KB"

# Check for external resources
echo ""
echo "🌐 External Resources:"
if grep -q "fonts.googleapis.com" dist/index.html; then
    echo "  ⚠️  Google Fonts (external dependency)"
else
    echo "  ✅ No external font dependencies"
fi

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