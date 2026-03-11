#!/usr/bin/env sh
set -e
cd "$(dirname -- "$0")/.."
pnpm run typecheck && pnpm run lint && pnpm run format:check
