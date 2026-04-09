#!/usr/bin/env sh
set -eu

pnpm turbo run check --filter="./packages/*" --filter="./apps/*"
