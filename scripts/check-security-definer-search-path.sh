#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="${ROOT_DIR}/supabase/migrations"
BASELINE="20260722093000_harden_security_definer_search_path.sql"
FAILED=0

while IFS= read -r migration; do
  filename="$(basename "${migration}")"
  [[ "${filename}" > "${BASELINE}" ]] || continue

  if ! grep -Eiq 'security[[:space:]]+definer' "${migration}"; then
    continue
  fi

  if grep -Eiq 'set[[:space:]]+search_path[[:space:]]*=[[:space:]]*([^;]*,)?[[:space:]]*public([[:space:],;]|$)' "${migration}"; then
    echo "${filename}: SECURITY DEFINER 不得无说明地包含 public search_path。" >&2
    FAILED=1
  fi

  if ! grep -Eiq 'set[[:space:]]+search_path[[:space:]]*=[[:space:]]*pg_catalog([^;]*,)?[[:space:]]*pg_temp[[:space:]]*($|;)' "${migration}"; then
    echo "${filename}: SECURITY DEFINER 必须显式使用以 pg_catalog 开头、pg_temp 结尾的 search_path。" >&2
    FAILED=1
  fi
done < <(find "${MIGRATIONS_DIR}" -maxdepth 1 -type f -name '*.sql' | sort)

if [[ "${FAILED}" -ne 0 ]]; then
  exit 1
fi

echo "SECURITY DEFINER search_path 静态检查通过。"
