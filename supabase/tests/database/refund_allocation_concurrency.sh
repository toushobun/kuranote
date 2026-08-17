#!/usr/bin/env bash
set -euo pipefail

# Issue #598 PR6：显式回放 migrations + seed，确保当前报销关联结构下 seed 可正常落库。
if ! supabase db reset > /tmp/issue-598-db-reset.log 2>&1; then
  cat /tmp/issue-598-db-reset.log >&2
  exit 1
fi
echo "ok - supabase db reset 与 seed 回放成功"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${script_dir}/refund_allocation_concurrency-base.sh"
