#!/bin/bash
set -e

echo "🚀 Starting Production Hardening Check..."

echo "1. Running Typecheck..."
npm run typecheck

echo "2. Running Lint..."
npm run lint

echo "3. Running Unit & Integration Tests..."
npm test -- --run --coverage

echo "4. Running Build Optimization Check..."
npm run build

echo "✅ All checks passed! Skeleton is production-ready."
