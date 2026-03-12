#!/usr/bin/env sh
set -e
cd "$(dirname -- "$0")/.."
echo "Fixing lint..."
pnpm run lint:fix 
echo "Fixing format..."
pnpm run format:fix
echo "Fixing typecheck..."
pnpm run typecheck