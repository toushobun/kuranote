-- 将 transaction_record_tag 的主键调整为包含 ledger_id。
-- 复合外键已经防止跨账本引用，这里补齐主键维度，保持与账本隔离设计一致。

alter table public.transaction_record_tag
    drop constraint if exists transaction_record_tag_pkey;

alter table public.transaction_record_tag
    add constraint transaction_record_tag_pkey
    primary key (ledger_id, transaction_record_id, tag_id);

-- 新主键已覆盖按账本和交易记录定位的前缀，避免保留重复索引。
drop index if exists public.transaction_record_tag_record_idx;
