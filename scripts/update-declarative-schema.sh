#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_PATH="${ROOT_DIR}/supabase/schemas/00_current_schema.sql"
AUTH_TRIGGER_REFERENCE_PATH="${ROOT_DIR}/supabase/schemas/_reference/auth_users_triggers.sql"
SUPABASE_VERSION_FILE="${ROOT_DIR}/.supabase-version"

if [[ ! -f "${SUPABASE_VERSION_FILE}" ]]; then
  echo "未找到 Supabase CLI 版本文件：${SUPABASE_VERSION_FILE#"${ROOT_DIR}/"}" >&2
  exit 1
fi
SUPABASE_VERSION="$(tr -d '[:space:]' <"${SUPABASE_VERSION_FILE}")"
if [[ -z "${SUPABASE_VERSION}" ]]; then
  echo "Supabase CLI 版本文件为空：${SUPABASE_VERSION_FILE#"${ROOT_DIR}/"}" >&2
  exit 1
fi
if [[ ! "${SUPABASE_VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Supabase CLI 版本文件内容异常：${SUPABASE_VERSION_FILE#"${ROOT_DIR}/"}（读取到 \"${SUPABASE_VERSION}\"，应为形如 2.106.0 的版本号）" >&2
  exit 1
fi

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

mkdir -p "$(dirname "${SCHEMA_PATH}")" "$(dirname "${AUTH_TRIGGER_REFERENCE_PATH}")"

# 生成与校验都先在与目标文件同目录的临时文件上进行，全部通过后再一次性替换正式基线，
# 避免任一步骤失败时正式基线只更新一半。
TMP_SCHEMA_PATH="$(mktemp "$(dirname "${SCHEMA_PATH}")/.00_current_schema.sql.XXXXXX")"
TMP_AUTH_TRIGGER_PATH="$(mktemp "$(dirname "${AUTH_TRIGGER_REFERENCE_PATH}")/.auth_users_triggers.sql.XXXXXX")"
AUTH_SCHEMA_DUMP_PATH="$(mktemp)"

# shellcheck disable=SC2317  # 通过 trap 调用，非未使用代码
cleanup() {
  rm -f "${TMP_SCHEMA_PATH}" "${TMP_AUTH_TRIGGER_PATH}" "${AUTH_SCHEMA_DUMP_PATH}"
}
trap cleanup EXIT

"${SUPABASE[@]}" db reset --local --no-seed
"${SUPABASE[@]}" db dump --local --schema public --file "${TMP_SCHEMA_PATH}"
perl -0pi -e 's/[[:space:]]+\z/\n/' "${TMP_SCHEMA_PATH}"

"${SUPABASE[@]}" db dump --local --schema auth --file "${AUTH_SCHEMA_DUMP_PATH}"

# 依赖当前固定版本 Supabase CLI（pg_dump）将该 trigger 定义整体输出为单行；
# 零匹配、多匹配或格式变化都必须使检查失败，不能静默放过，因此不引入 SQL parser。
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

printf '%s\n' "${AUTH_TRIGGER_DEFINITIONS[0]}" >"${TMP_AUTH_TRIGGER_PATH}"

# 全部校验通过，才替换正式基线；两次 mv 均为同目录内重命名，替换前不会触碰正式文件。
mv -f "${TMP_SCHEMA_PATH}" "${SCHEMA_PATH}"
mv -f "${TMP_AUTH_TRIGGER_PATH}" "${AUTH_TRIGGER_REFERENCE_PATH}"

echo "已更新 ${SCHEMA_PATH#"${ROOT_DIR}/"} 与 ${AUTH_TRIGGER_REFERENCE_PATH#"${ROOT_DIR}/"}"
