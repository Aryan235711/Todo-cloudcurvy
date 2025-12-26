#!/bin/bash

# Performance Test Suite - Phase 1.1
echo "🔍 Loop Community Performance Test Suite"
echo "========================================"

# Clean and build
rm -rf dist/
BUILD_START=$(date +%s%N)
npm run build > build-output.log 2>&1
BUILD_END=$(date +%s%N)
BUILD_TIME=$(( (BUILD_END - BUILD_START) / 1000000 ))

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check build-output.log"
    cat build-output.log
    exit 1
fi

# Measure bundle sizes
if [ -d "dist/assets" ]; then
    MAIN_JS=$(find dist/assets -name "index-*.js" -exec ls -la {} \; | awk '{print $5}' | head -1)
    TOTAL_SIZE=$(find dist -type f -exec ls -la {} \; | awk '{sum += $5} END {print sum}')
else
    MAIN_JS=0
    TOTAL_SIZE=0
fi

echo "✅ Build: ${BUILD_TIME}ms"
echo "📦 Main JS: $(( ${MAIN_JS:-0} / 1024 )) KB"
echo "📦 Total: $(( ${TOTAL_SIZE:-0} / 1024 )) KB"

# Save results
cat > performance-results.json << EOF
{
  "buildTime": $BUILD_TIME,
  "mainJS": ${MAIN_JS:-0},
  "total": ${TOTAL_SIZE:-0}
}
EOF