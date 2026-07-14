#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECTED_SCHEMA_PATH="${ROOT_DIR}/supabase/schemas/00_current_schema.sql"
EXPECTED_AUTH_TRIGGER_PATH="${ROOT_DIR}/supabase/schemas/_reference/auth_users_triggers.sql"
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

for expected_path in "${EXPECTED_SCHEMA_PATH}" "${EXPECTED_AUTH_TRIGGER_PATH}"; do
  if [[ ! -f "${expected_path}" ]]; then
    echo "未找到声明式 schema 基线：${expected_path#"${ROOT_DIR}/"}" >&2
    echo "请先运行 npm run db:schema:update 生成基线后再执行检查。" >&2
    exit 1
  fi
done

if [[ -z "${CI:-}" && -t 0 ]]; then
  read -r -p "此操作会执行 supabase db reset，清空本地 Supabase 数据库中未纳入 seed 的数据。确认继续？[y/N] " confirm
  if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
    echo "已取消。" >&2
    exit 1
  fi
fi

if [[ -n "${ACTUAL_SCHEMA_PATH:-}" ]]; then
  GENERATED_SCHEMA_PATH="${ACTUAL_SCHEMA_PATH}"
  mkdir -p "$(dirname "${GENERATED_SCHEMA_PATH}")"
else
  GENERATED_SCHEMA_PATH="$(mktemp)"
fi
GENERATED_AUTH_SCHEMA_PATH="$(mktemp)"
GENERATED_AUTH_TRIGGER_PATH="$(mktemp)"

# shellcheck disable=SC2317  # 通过 trap 调用，非未使用代码
cleanup() {
  [[ -n "${ACTUAL_SCHEMA_PATH:-}" ]] || rm -f "${GENERATED_SCHEMA_PATH}"
  rm -f "${GENERATED_AUTH_SCHEMA_PATH}" "${GENERATED_AUTH_TRIGGER_PATH}"
}
trap cleanup EXIT

cd "${ROOT_DIR}"

"${SUPABASE[@]}" db reset --local --no-seed
"${SUPABASE[@]}" db dump --local --schema public --file "${GENERATED_SCHEMA_PATH}"
perl -0pi -e 's/[[:space:]]+\z/\n/' "${GENERATED_SCHEMA_PATH}"

"${SUPABASE[@]}" db dump --local --schema auth --file "${GENERATED_AUTH_SCHEMA_PATH}"
# 依赖当前固定版本 Supabase CLI（pg_dump）将该 trigger 定义整体输出为单行；
# 零匹配、多匹配或格式变化都必须使检查失败，不能静默放过，因此不引入 SQL parser。
grep -E '^CREATE (OR REPLACE )?TRIGGER "on_auth_user_created" ' "${GENERATED_AUTH_SCHEMA_PATH}" \
  >"${GENERATED_AUTH_TRIGGER_PATH}" || true

status=0
auth_trigger_match_count="$(wc -l <"${GENERATED_AUTH_TRIGGER_PATH}")"
if [[ "${auth_trigger_match_count}" -eq 0 ]]; then
  echo "在 auth.users 上未找到 on_auth_user_created trigger，可能被误删或格式已变化。" >&2
  status=1
elif [[ "${auth_trigger_match_count}" -gt 1 ]]; then
  echo "检测到多个名为 on_auth_user_created 的 trigger，无法确定应使用哪一个定义。" >&2
  status=1
fi

if ! diff -u "${EXPECTED_SCHEMA_PATH}" "${GENERATED_SCHEMA_PATH}"; then
  echo >&2
  echo "声明式 schema 与 migration 回放结果不一致。" >&2
  echo "请确认 migration 后运行 npm run db:schema:update，并提交更新后的 schema。" >&2
  status=1
fi

if ! diff -u "${EXPECTED_AUTH_TRIGGER_PATH}" "${GENERATED_AUTH_TRIGGER_PATH}"; then
  echo >&2
  echo "auth.users 上的 on_auth_user_created trigger 与参考基线不一致（可能被误删或修改）。" >&2
  echo "该 trigger 不在 public schema dump 范围内，需要单独维护，见 supabase/schemas/_reference/auth_users_triggers.sql。" >&2
  echo "确认改动是有意为之后，运行 npm run db:schema:update 更新基线。" >&2
  status=1
fi

if [[ "${status}" -eq 0 ]]; then
  echo "声明式 schema 与 migration 回放结果一致。"
fi

exit "${status}"
