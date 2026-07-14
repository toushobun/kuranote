#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_PATH="${ROOT_DIR}/supabase/schemas/00_current_schema.sql"

if command -v supabase >/dev/null 2>&1; then
  SUPABASE=(supabase)
else
  SUPABASE=(npx --yes supabase@2.106.0)
fi

cd "${ROOT_DIR}"

"${SUPABASE[@]}" db reset --local --no-seed
"${SUPABASE[@]}" db dump --local --schema public --file "${SCHEMA_PATH}"

echo "已更新 ${SCHEMA_PATH#"${ROOT_DIR}/"}"
