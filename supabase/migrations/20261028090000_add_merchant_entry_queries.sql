-- 从商家记账：全期间计数及按商家倒序读取共用有效记录索引。
create index transaction_record_merchant_entry_idx
on public.transaction_record (ledger_id, merchant_id, transaction_at desc, created_at desc, id desc)
where status = 'active';

create function public.load_frequent_transaction_merchants(p_ledger_id uuid, p_limit integer)
returns table (merchant_id uuid, record_count bigint)
language sql stable security invoker
set search_path = pg_catalog, pg_temp
as $$
    select r.merchant_id, count(*) as record_count
    from public.transaction_record r
    join public.merchant m on m.id = r.merchant_id and m.ledger_id = r.ledger_id
    where r.ledger_id = p_ledger_id and r.status = 'active'
      and not m.is_archived and public.current_user_is_active_ledger_member(p_ledger_id)
    group by r.merchant_id
    order by record_count desc, r.merchant_id
    limit greatest(p_limit, 0);
$$;

-- 单个 JSON 结果避免 PostgREST 行数上限截断一笔记录内的明细；样本在同一快照读取。
create function public.load_merchant_entry_history(p_ledger_id uuid, p_merchant_id uuid, p_limit integer)
returns jsonb
language sql stable security invoker
set search_path = pg_catalog, pg_temp
as $$
    select coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id,
        'payments', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'accountId', p.account_id, 'currency', a.currency, 'isArchived', a.is_archived
            ) order by p.sort_order, p.id), '[]'::jsonb)
            from public.transaction_payment p
            join public.account a on a.id = p.account_id and a.ledger_id = p.ledger_id
            where p.ledger_id = p_ledger_id and p.transaction_record_id = r.id
        ),
        'items', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'categoryId', i.category_id, 'amount', i.amount::text
            ) order by i.sort_order, i.id), '[]'::jsonb)
            from public.transaction_item i
            join public.category c on c.id = i.category_id and c.ledger_id = i.ledger_id
            where i.ledger_id = p_ledger_id and i.transaction_record_id = r.id
              and c.parent_id is not null and not c.is_archived
        )
    ) order by r.transaction_at desc, r.created_at desc, r.id desc), '[]'::jsonb)
    from (
        select id, transaction_at, created_at
        from public.transaction_record
        where ledger_id = p_ledger_id and merchant_id = p_merchant_id
          and status = 'active'
          and public.current_user_is_active_ledger_member(p_ledger_id)
        order by transaction_at desc, created_at desc, id desc
        limit greatest(p_limit, 0)
    ) r;
$$;

revoke all on function public.load_frequent_transaction_merchants(uuid, integer) from public, anon;
revoke all on function public.load_merchant_entry_history(uuid, uuid, integer) from public, anon;
grant execute on function public.load_frequent_transaction_merchants(uuid, integer) to authenticated;
grant execute on function public.load_merchant_entry_history(uuid, uuid, integer) to authenticated;
