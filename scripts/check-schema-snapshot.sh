#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECTED_SNAPSHOT_PATH="${ROOT_DIR}/supabase/schema_snapshot/current_schema.sql"

if [[ ! -f "${EXPECTED_SNAPSHOT_PATH}" ]]; then
  echo "未找到数据库结构快照：${EXPECTED_SNAPSHOT_PATH#"${ROOT_DIR}/"}" >&2
  echo "请先运行 npm run db:schema:snapshot:update。" >&2
  exit 1
fi

if [[ -z "${CI:-}" && -t 0 ]]; then
  read -r -p "此操作会执行 supabase db reset，清空本地 Supabase 中未纳入 seed 的数据。确认继续？[y/N] " confirm
  if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
    echo "已取消。" >&2
    exit 1
  fi
fi

if [[ -n "${ACTUAL_SCHEMA_SNAPSHOT_PATH:-}" ]]; then
  GENERATED_SNAPSHOT_PATH="${ACTUAL_SCHEMA_SNAPSHOT_PATH}"
else
  GENERATED_SNAPSHOT_PATH="$(mktemp)"
fi

# shellcheck disable=SC2317  # 通过 trap 调用
cleanup() {
  [[ -n "${ACTUAL_SCHEMA_SNAPSHOT_PATH:-}" ]] || rm -f "${GENERATED_SNAPSHOT_PATH}"
}
trap cleanup EXIT

bash "${ROOT_DIR}/scripts/generate-schema-snapshot.sh" "${GENERATED_SNAPSHOT_PATH}"

if ! diff -u "${EXPECTED_SNAPSHOT_PATH}" "${GENERATED_SNAPSHOT_PATH}"; then
  echo >&2
  echo "数据库结构快照与 migrations 回放结果不一致。" >&2
  echo "请确认新的时间戳 migration 后运行 npm run db:schema:snapshot:update，并提交更新后的快照。" >&2
  exit 1
fi

echo "数据库结构快照与 migrations 回放结果一致。"
