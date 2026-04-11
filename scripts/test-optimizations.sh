#!/bin/bash
# ============================================
# Test Optimization Script for MaatWork CRM
# ============================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Testing Prisma Schema ==="
cd "$PROJECT_DIR"
bun prisma validate

echo ""
echo "=== Checking TypeScript ==="
npx tsc --noEmit 2>&1 | head -50

echo ""
echo "=== Building ==="
bun run build 2>&1 | tail -30

echo ""
echo "=== Running Tests ==="
bun run test:ci 2>&1 | tail -50

echo ""
echo "=== Done ==="
