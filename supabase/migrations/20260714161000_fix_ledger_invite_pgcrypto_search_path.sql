-- Issue #433：修复生产环境邀请 RPC 无法解析 pgcrypto 函数。
-- Supabase 将 pgcrypto 安装在 extensions schema，三个既存 RPC 需要显式纳入该 schema。
-- 仅保留受信任的 pg_catalog 与 extensions；函数体中的业务对象均已显式限定 schema。

alter function public.create_ledger_invite(uuid, text)
set search_path to pg_catalog, extensions;

alter function public.get_ledger_invite_preview(text)
set search_path to pg_catalog, extensions;

alter function public.accept_ledger_invite(text)
set search_path to pg_catalog, extensions;
