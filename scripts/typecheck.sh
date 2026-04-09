#!/usr/bin/env sh
set -eu

pnpm turbo run typecheck --filter="./packages/*" --filter="./apps/*"
