#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECTED_SCHEMA_PATH="${ROOT_DIR}/supabase/schemas/00_current_schema.sql"
SUPABASE_VERSION="2.106.0"

if command -v supabase >/dev/null 2>&1 && [[ "$(supabase --version)" == "${SUPABASE_VERSION}" ]]; then
  SUPABASE=(supabase)
else
  SUPABASE=(npx --yes "supabase@${SUPABASE_VERSION}")
fi

if [[ -n "${ACTUAL_SCHEMA_PATH:-}" ]]; then
  GENERATED_SCHEMA_PATH="${ACTUAL_SCHEMA_PATH}"
  mkdir -p "$(dirname "${GENERATED_SCHEMA_PATH}")"
else
  GENERATED_SCHEMA_PATH="$(mktemp)"
  trap 'rm -f "${GENERATED_SCHEMA_PATH}"' EXIT
fi

cd "${ROOT_DIR}"

"${SUPABASE[@]}" db reset --local --no-seed
"${SUPABASE[@]}" db dump --local --schema public --file "${GENERATED_SCHEMA_PATH}"
perl -0pi -e 's/[[:space:]]+\z/\n/' "${GENERATED_SCHEMA_PATH}"

if ! diff -u "${EXPECTED_SCHEMA_PATH}" "${GENERATED_SCHEMA_PATH}"; then
  echo >&2
  echo "声明式 schema 与 migration 回放结果不一致。" >&2
  echo "请确认 migration 后运行 npm run db:schema:update，并提交更新后的 schema。" >&2
  exit 1
fi

echo "声明式 schema 与 migration 回放结果一致。"
