-- Issue #433：修复生产环境邀请 RPC 无法解析 pgcrypto 函数。
-- Supabase 将 pgcrypto 安装在 extensions schema，三个既存 RPC 需要显式纳入该 schema。
-- extensions 优先于 public，避免 SECURITY DEFINER RPC 解析到 public 中的同名函数。

alter function public.create_ledger_invite(uuid, text)
set search_path to extensions, public;

alter function public.get_ledger_invite_preview(text)
set search_path to extensions, public;

alter function public.accept_ledger_invite(text)
set search_path to extensions, public;
