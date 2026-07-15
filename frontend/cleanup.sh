#!/bin/bash
# Frontend Cache & Build Cleanup

echo "========================================"
echo "Cleaning Frontend Cache and Build"
echo "========================================"

cd "$(dirname "$0")" || exit 1

# Remove node_modules and lock files (forces fresh install)
echo "Removing node_modules and lock files..."
rm -rf node_modules
rm -rf .vite
rm -f package-lock.json
rm -f yarn.lock

# Remove dist folder (build output)
echo "Removing build output..."
rm -rf dist

echo "✓ Cleanup complete"
echo ""
echo "Next steps:"
echo "1. Install dependencies: npm install"
echo "2. Start dev server: npm run dev"
echo "3. Clear browser cache (Ctrl+Shift+Delete)"
echo "4. Restart frontend (Ctrl+R)"
