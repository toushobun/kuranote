-- Local member display color seed data.

begin;

insert into public.ledger_member_display_setting (
    id,
    ledger_id,
    user_id,
    display_color,
    created_by,
    updated_by
)
values
    ('00000000-0000-4000-8000-000000000081', '00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000031', 'sky', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
    ('00000000-0000-4000-8000-000000000082', '00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000034', 'sakura', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031')
on conflict (ledger_id, user_id) do update
set
    display_color = excluded.display_color,
    updated_by = excluded.updated_by,
    updated_at = now();

-- Merchant tag associations for local merchant-list and design verification.
-- The default tags are created by the merchant-tag migrations before seed files run.
with seed_merchant_tags(merchant_id, tag_name) as (
    values
        ('00000000-0000-4000-8000-000000001001'::uuid, '超市'),
        ('00000000-0000-4000-8000-000000001001'::uuid, '生活'),
        ('00000000-0000-4000-8000-000000001002'::uuid, '超市'),
        ('00000000-0000-4000-8000-000000001003'::uuid, '超市'),
        ('00000000-0000-4000-8000-000000001004'::uuid, '超市'),
        ('00000000-0000-4000-8000-000000001004'::uuid, '生活'),
        ('00000000-0000-4000-8000-000000001005'::uuid, '超市'),
        ('00000000-0000-4000-8000-000000001006'::uuid, '超市'),
        ('00000000-0000-4000-8000-000000001007'::uuid, '超市'),
        ('00000000-0000-4000-8000-000000001008'::uuid, '电商'),
        ('00000000-0000-4000-8000-000000001008'::uuid, '百货店'),
        ('00000000-0000-4000-8000-000000001009'::uuid, '电商'),
        ('00000000-0000-4000-8000-000000001010'::uuid, '旅行'),
        ('00000000-0000-4000-8000-000000001012'::uuid, '便利店'),
        ('00000000-0000-4000-8000-000000001012'::uuid, '餐饮'),
        ('00000000-0000-4000-8000-000000001013'::uuid, '便利店'),
        ('00000000-0000-4000-8000-000000001013'::uuid, '餐饮'),
        ('00000000-0000-4000-8000-000000001014'::uuid, '便利店'),
        ('00000000-0000-4000-8000-000000001014'::uuid, '餐饮'),
        ('00000000-0000-4000-8000-000000001015'::uuid, '便利店'),
        ('00000000-0000-4000-8000-000000001015'::uuid, '餐饮'),
        ('00000000-0000-4000-8000-000000001017'::uuid, '超市'),
        ('00000000-0000-4000-8000-000000001018'::uuid, '生活'),
        ('00000000-0000-4000-8000-000000001019'::uuid, '旅行'),
        ('00000000-0000-4000-8000-000000001020'::uuid, '生活'),
        ('00000000-0000-4000-8000-000000001024'::uuid, '百货店'),
        ('00000000-0000-4000-8000-000000001024'::uuid, '生活'),
        ('00000000-0000-4000-8000-000000001025'::uuid, '餐饮'),
        ('00000000-0000-4000-8000-000000001026'::uuid, '旅行'),
        ('00000000-0000-4000-8000-000000001028'::uuid, '餐饮'),
        ('00000000-0000-4000-8000-000000001034'::uuid, '通讯'),
        ('00000000-0000-4000-8000-000000001036'::uuid, '百货店'),
        ('00000000-0000-4000-8000-000000001036'::uuid, '生活'),
        ('00000000-0000-4000-8000-000000001037'::uuid, '百货店'),
        ('00000000-0000-4000-8000-000000001037'::uuid, '电商'),
        ('00000000-0000-4000-8000-000000001039'::uuid, '百货店'),
        ('00000000-0000-4000-8000-000000001039'::uuid, '生活'),
        ('00000000-0000-4000-8000-000000001040'::uuid, '百货店'),
        ('00000000-0000-4000-8000-000000001040'::uuid, '生活')
)
insert into public.merchant_tag_links (merchant_id, tag_id)
select seed_merchant_tags.merchant_id, merchant_tags.id
from seed_merchant_tags
join public.merchant
  on merchant.id = seed_merchant_tags.merchant_id
 and merchant.ledger_id = '00000000-0000-4000-8000-000000000032'
join public.merchant_tags
  on merchant_tags.ledger_id = merchant.ledger_id
 and merchant_tags.name = seed_merchant_tags.tag_name
 and merchant_tags.is_archived = false
on conflict (merchant_id, tag_id) do nothing;

-- Transaction list seed data for local infinite scroll verification.
with seed_records as (
    select
        series_index,
        ('00000000-0000-4000-8000-' || lpad((900000 + series_index)::text, 12, '0'))::uuid as record_id,
        ('00000000-0000-4000-8000-' || lpad((910000 + series_index)::text, 12, '0'))::uuid as item_id,
        case when series_index % 10 = 0 then 'income' else 'expense' end as transaction_type,
        case when series_index % 10 = 0 then '00000000-0000-4000-8000-000000005002'::uuid else (array[
            '00000000-0000-4000-8000-000000005021'::uuid,
            '00000000-0000-4000-8000-000000005022'::uuid,
            '00000000-0000-4000-8000-000000005023'::uuid,
            '00000000-0000-4000-8000-000000005029'::uuid,
            '00000000-0000-4000-8000-000000005040'::uuid,
            '00000000-0000-4000-8000-000000005082'::uuid
        ])[((series_index - 1) % 6) + 1] end as category_id,
        case when series_index % 10 = 0 then '00000000-0000-4000-8000-000000001021'::uuid else (array[
            '00000000-0000-4000-8000-000000001001'::uuid,
            '00000000-0000-4000-8000-000000001012'::uuid,
            '00000000-0000-4000-8000-000000001013'::uuid,
            '00000000-0000-4000-8000-000000001008'::uuid,
            '00000000-0000-4000-8000-000000001010'::uuid,
            '00000000-0000-4000-8000-000000001033'::uuid
        ])[((series_index - 1) % 6) + 1] end as merchant_id,
        (array[
            '00000000-0000-4000-8000-000000000041'::uuid,
            '00000000-0000-4000-8000-000000000043'::uuid,
            '00000000-0000-4000-8000-000000000045'::uuid,
            '00000000-0000-4000-8000-000000000047'::uuid
        ])[((series_index - 1) % 4) + 1] end as account_id,
        case when series_index % 10 = 0 then 260000::numeric(14,2) else (300 + ((series_index * 137) % 9000))::numeric(14,2) end as amount,
        ('2026-06-05 12:00:00+09'::timestamptz - (series_index * interval '6 hours')) as transaction_at
    from generate_series(1, 100) as series_index
)
insert into public.transaction_record (
    id,
    ledger_id,
    type,
    status,
    transaction_at,
    merchant_id,
    title,
    note,
    discount_amount,
    discount_allocation_method,
    created_by,
    created_at,
    updated_by,
    updated_at
)
select
    record_id,
    '00000000-0000-4000-8000-000000000032',
    transaction_type,
    'active',
    transaction_at,
    merchant_id,
    null,
    'Infinite scroll 模拟记账 #' || series_index,
    0,
    'none',
    '00000000-0000-4000-8000-000000000031',
    transaction_at,
    '00000000-0000-4000-8000-000000000031',
    transaction_at
from seed_records
on conflict (id) do update
set
    type = excluded.type,
    status = excluded.status,
    transaction_at = excluded.transaction_at,
    merchant_id = excluded.merchant_id,
    note = excluded.note,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

with seed_records as (
    select
        series_index,
        ('00000000-0000-4000-8000-' || lpad((900000 + series_index)::text, 12, '0'))::uuid as record_id,
        ('00000000-0000-4000-8000-' || lpad((910000 + series_index)::text, 12, '0'))::uuid as item_id,
        case when series_index % 10 = 0 then 'income' else 'expense' end as transaction_type,
        case when series_index % 10 = 0 then '00000000-0000-4000-8000-000000005002'::uuid else (array[
            '00000000-0000-4000-8000-000000005021'::uuid,
            '00000000-0000-4000-8000-000000005022'::uuid,
            '00000000-0000-4000-8000-000000005023'::uuid,
            '00000000-0000-4000-8000-000000005029'::uuid,
            '00000000-0000-4000-8000-000000005040'::uuid,
            '00000000-0000-4000-8000-000000005082'::uuid
        ])[((series_index - 1) % 6) + 1] end as category_id,
        (array[
            '00000000-0000-4000-8000-000000000041'::uuid,
            '00000000-0000-4000-8000-000000000043'::uuid,
            '00000000-0000-4000-8000-000000000045'::uuid,
            '00000000-0000-4000-8000-000000000047'::uuid
        ])[((series_index - 1) % 4) + 1] end as account_id,
        case when series_index % 10 = 0 then 260000::numeric(14,2) else (300 + ((series_index * 137) % 9000))::numeric(14,2) end as amount,
        ('2026-06-05 12:00:00+09'::timestamptz - (series_index * interval '6 hours')) as transaction_at
    from generate_series(1, 100) as series_index
)
insert into public.transaction_item (
    id,
    ledger_id,
    transaction_record_id,
    account_id,
    category_id,
    amount,
    discount_amount,
    balance_delta,
    note,
    sort_order,
    created_by,
    created_at,
    updated_by,
    updated_at
)
select
    item_id,
    '00000000-0000-4000-8000-000000000032',
    record_id,
    account_id,
    category_id,
    amount,
    0,
    case when transaction_type = 'income' then amount else -amount end,
    null,
    0,
    '00000000-0000-4000-8000-000000000031',
    transaction_at,
    '00000000-0000-4000-8000-000000000031',
    transaction_at
from seed_records
on conflict (id) do update
set
    account_id = excluded.account_id,
    category_id = excluded.category_id,
    amount = excluded.amount,
    balance_delta = excluded.balance_delta,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

-- Keep local account balances consistent with the seeded transaction items.
with account_balance_deltas as (
    select
        a.id as account_id,
        (a.initial_balance + coalesce(sum(ti.balance_delta), 0)::numeric(14,2)) - a.current_balance as balance_delta
    from public.account a
    left join public.transaction_item ti
        on ti.account_id = a.id
       and ti.ledger_id = a.ledger_id
    where a.ledger_id = '00000000-0000-4000-8000-000000000032'
    group by a.id, a.initial_balance, a.current_balance
)
select public.apply_account_balance_delta(
    '00000000-0000-4000-8000-000000000032',
    account_id,
    balance_delta,
    '00000000-0000-4000-8000-000000000031'
)
from account_balance_deltas
where balance_delta <> 0;

commit;
