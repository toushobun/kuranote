-- Issue #416：请求级客户端读取消费者时需要表级 SELECT 权限，RLS 继续限制账本成员范围。
grant select on table public.transaction_consumer to authenticated;
