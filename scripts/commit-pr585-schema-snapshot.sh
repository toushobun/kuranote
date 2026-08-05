#!/usr/bin/env bash
set -euo pipefail

branch="feature/572_refund_multi_item_allocation"
artifact_url='https://sdmntprjapaneast.oaiusercontent.com/files/00000000-045c-8209-b299-3e7f968b52cb/raw?se=2026-08-05T01:43:32Z&sp=r&sv=2026-02-06&sr=b&scid=ed12cdf3-616a-5451-bbcf-44b6143c49fe&skoid=03727f49-62d3-42ac-8350-1c0e6559d238&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2026-08-04T23:51:10Z&ske=2026-08-05T23:51:10Z&sks=b&skv=2026-02-06&sig=MeyKcdmfui0/yG5nj6hSEcyM/1hoH9/I6JOa7OxYwNU%3D'
archive="$(mktemp --suffix=.zip)"
extract_dir="$(mktemp -d)"
trap 'rm -f "$archive"; rm -rf "$extract_dir"' EXIT

git fetch origin "$branch"
git checkout -B "$branch" "origin/$branch"

curl --fail --location --silent --show-error "$artifact_url" --output "$archive"
unzip -q "$archive" -d "$extract_dir"
cp "$extract_dir/kuranote-current-schema.sql" supabase/schema_snapshot/current_schema.sql

git diff --check
git add supabase/schema_snapshot/current_schema.sql
if git diff --cached --quiet; then
  exit 0
fi

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git commit -m "chore: 更新退款分摊 schema snapshot"
git push origin "HEAD:$branch"
