-- UchiLog 账户默认标记
-- 对应 Issue：#23

alter table public.account
add column if not exists is_default boolean not null default false;

-- 同一账本下，未归档账户最多只能有一个默认账户
create unique index if not exists account_active_default_unique
on public.account (ledger_id)
where is_archived = false and is_default = true;

-- 查询默认账户时使用
create index if not exists account_active_default_idx
on public.account (ledger_id, is_default)
where is_archived = false;
