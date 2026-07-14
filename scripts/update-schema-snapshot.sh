#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SNAPSHOT_PATH="${ROOT_DIR}/supabase/schema_snapshot/current_schema.sql"

if [[ -z "${CI:-}" && -t 0 ]]; then
  read -r -p "此操作会执行 supabase db reset，清空本地 Supabase 中未纳入 seed 的数据。确认继续？[y/N] " confirm
  if [[ ! "${confirm}" =~ ^[Yy]$ ]]; then
    echo "已取消。" >&2
    exit 1
  fi
fi

mkdir -p "$(dirname "${SNAPSHOT_PATH}")"
TMP_SNAPSHOT_PATH="$(mktemp "$(dirname "${SNAPSHOT_PATH}")/.current_schema.sql.XXXXXX")"

# shellcheck disable=SC2317  # 通过 trap 调用
cleanup() {
  rm -f "${TMP_SNAPSHOT_PATH}"
}
trap cleanup EXIT

bash "${ROOT_DIR}/scripts/generate-schema-snapshot.sh" "${TMP_SNAPSHOT_PATH}"
mv -f "${TMP_SNAPSHOT_PATH}" "${SNAPSHOT_PATH}"

echo "已根据全部 migrations 更新 ${SNAPSHOT_PATH#"${ROOT_DIR}/"}"
