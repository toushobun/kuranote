#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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

cd "${ROOT_DIR}"

"${SUPABASE[@]}" db diff --schema public "$@"
