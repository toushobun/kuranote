#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPABASE_VERSION_FILE="${ROOT_DIR}/.supabase-version"

if [[ "$#" -ne 1 ]]; then
  echo "用法：$0 <输出文件>" >&2
  exit 1
fi

OUTPUT_PATH="$1"

if [[ ! -f "${SUPABASE_VERSION_FILE}" ]]; then
  echo "未找到 Supabase CLI 版本文件：${SUPABASE_VERSION_FILE#"${ROOT_DIR}/"}" >&2
  exit 1
fi

SUPABASE_VERSION="$(<"${SUPABASE_VERSION_FILE}")"
SUPABASE_VERSION="${SUPABASE_VERSION%$'\r'}"
if [[ ! "${SUPABASE_VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Supabase CLI 版本文件内容异常：${SUPABASE_VERSION_FILE#"${ROOT_DIR}/"}（应为形如 2.106.0 的版本号）" >&2
  exit 1
fi

if command -v supabase >/dev/null 2>&1 && [[ "$(supabase --version)" == "${SUPABASE_VERSION}" ]]; then
  SUPABASE=(supabase)
else
  SUPABASE=(npx --yes "supabase@${SUPABASE_VERSION}")
fi

PUBLIC_DUMP_PATH="$(mktemp)"
AUTH_DUMP_PATH="$(mktemp)"
AUTH_TRIGGER_PATH="$(mktemp)"

# shellcheck disable=SC2317  # 通过 trap 调用
cleanup() {
  rm -f "${PUBLIC_DUMP_PATH}" "${AUTH_DUMP_PATH}" "${AUTH_TRIGGER_PATH}"
}
trap cleanup EXIT

cd "${ROOT_DIR}"

"${SUPABASE[@]}" db reset --local --no-seed
"${SUPABASE[@]}" db dump --local --schema public --file "${PUBLIC_DUMP_PATH}"
perl -0pi -e 's/[[:space:]]+\z/\n/' "${PUBLIC_DUMP_PATH}"

"${SUPABASE[@]}" db dump --local --schema auth --file "${AUTH_DUMP_PATH}"

# 固定版本的 Supabase CLI（pg_dump）会将 trigger 定义输出为单行。
# 格式变化、零匹配或多匹配均拒绝生成，避免遗漏应用维护的 auth.users trigger。
grep -E '^CREATE (OR REPLACE )?TRIGGER "on_auth_user_created" .* ON "auth"\."users" ' \
  "${AUTH_DUMP_PATH}" >"${AUTH_TRIGGER_PATH}" || true

AUTH_TRIGGER_COUNT="$(wc -l <"${AUTH_TRIGGER_PATH}")"
if [[ "${AUTH_TRIGGER_COUNT}" -ne 1 ]]; then
  echo "期望找到 1 个 auth.users 上的 on_auth_user_created trigger，实际找到 ${AUTH_TRIGGER_COUNT} 个。" >&2
  exit 1
fi

mkdir -p "$(dirname "${OUTPUT_PATH}")"
{
  echo "-- 此文件由 supabase/migrations 自动生成，禁止手工修改。"
  echo "-- 更新命令：npm run db:schema:snapshot:update"
  echo
  cat "${PUBLIC_DUMP_PATH}"
  echo
  echo "-- 应用维护的非 public 对象：auth.users trigger"
  cat "${AUTH_TRIGGER_PATH}"
} >"${OUTPUT_PATH}"
perl -0pi -e 's/[[:space:]]+\z/\n/' "${OUTPUT_PATH}"
