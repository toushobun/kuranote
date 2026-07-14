#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_PATH="${ROOT_DIR}/supabase/schemas/00_current_schema.sql"
SUPABASE_VERSION="2.106.0"

if command -v supabase >/dev/null 2>&1 && [[ "$(supabase --version)" == "${SUPABASE_VERSION}" ]]; then
  SUPABASE=(supabase)
else
  SUPABASE=(npx --yes "supabase@${SUPABASE_VERSION}")
fi

cd "${ROOT_DIR}"

"${SUPABASE[@]}" db reset --local --no-seed
"${SUPABASE[@]}" db dump --local --schema public --file "${SCHEMA_PATH}"
perl -0pi -e 's/[[:space:]]+\z/\n/' "${SCHEMA_PATH}"

echo "已更新 ${SCHEMA_PATH#"${ROOT_DIR}/"}"
