#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_PATH="${ROOT_DIR}/supabase/schemas/00_current_schema.sql"
AUTH_TRIGGER_REFERENCE_PATH="${ROOT_DIR}/supabase/schemas/_reference/auth_users_triggers.sql"
SUPABASE_VERSION="2.106.0"

if command -v supabase >/dev/null 2>&1 && [[ "$(supabase --version)" == "${SUPABASE_VERSION}" ]]; then
  SUPABASE=(supabase)
else
  SUPABASE=(npx --yes "supabase@${SUPABASE_VERSION}")
fi

if [[ -z "${CI:-}" && -t 0 ]]; then
  read -r -p "此操作会执行 supabase db reset，清空本地 Supabase 数据库中未纳入 seed 的数据。确认继续？[y/N] " confirm
  if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
    echo "已取消。" >&2
    exit 1
  fi
fi

cd "${ROOT_DIR}"

"${SUPABASE[@]}" db reset --local --no-seed
"${SUPABASE[@]}" db dump --local --schema public --file "${SCHEMA_PATH}"
perl -0pi -e 's/[[:space:]]+\z/\n/' "${SCHEMA_PATH}"

AUTH_SCHEMA_DUMP_PATH="$(mktemp)"
trap 'rm -f "${AUTH_SCHEMA_DUMP_PATH}"' EXIT
"${SUPABASE[@]}" db dump --local --schema auth --file "${AUTH_SCHEMA_DUMP_PATH}"

mapfile -t AUTH_TRIGGER_DEFINITIONS < <(
  grep -E '^CREATE (OR REPLACE )?TRIGGER "on_auth_user_created" ' "${AUTH_SCHEMA_DUMP_PATH}" || true
)
if [[ "${#AUTH_TRIGGER_DEFINITIONS[@]}" -eq 0 ]]; then
  echo "在 auth.users 上未找到 on_auth_user_created trigger，拒绝更新参考基线。" >&2
  echo "如果确实要移除该 trigger，需要在 PR 中说明原因并手动更新 ${AUTH_TRIGGER_REFERENCE_PATH#"${ROOT_DIR}/"}。" >&2
  exit 1
fi
if [[ "${#AUTH_TRIGGER_DEFINITIONS[@]}" -gt 1 ]]; then
  echo "检测到多个名为 on_auth_user_created 的 trigger，拒绝更新参考基线。" >&2
  echo "请确认 migration 中只保留 auth.users 上的目标 trigger。" >&2
  exit 1
fi

mkdir -p "$(dirname "${AUTH_TRIGGER_REFERENCE_PATH}")"
printf '%s\n' "${AUTH_TRIGGER_DEFINITIONS[0]}" >"${AUTH_TRIGGER_REFERENCE_PATH}"

echo "已更新 ${SCHEMA_PATH#"${ROOT_DIR}/"} 与 ${AUTH_TRIGGER_REFERENCE_PATH#"${ROOT_DIR}/"}"
