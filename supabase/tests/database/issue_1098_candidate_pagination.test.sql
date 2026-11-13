-- #1098：同商家优先、明细级分页、跨页无重复、全量结清数、报销范围。
begin;
set local search_path = public, extensions;
select plan(10);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, note, created_by, updated_by
)
select
    ('10980000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid,
    '00000000-0000-4000-8000-000000000032'::uuid,
    'normal', 'active',
    case when seq = 26
      then '2098-01-01 00:00:00+00'::timestamptz
      else '2099-01-01 00:00:00+00'::timestamptz + seq * interval '1 minute'
    end,
    case when seq <= 3 or seq = 26 then '00000000-0000-4000-8000-000000001001'::uuid
         else '00000000-0000-4000-8000-000000001002'::uuid end,
    '1098 测试交易',
    '1098候选 ' || seq,
    '00000000-0000-4000-8000-000000000031'::uuid,
    '00000000-0000-4000-8000-000000000031'::uuid
from generate_series(1, 26) seq;

select tests.insert_normal_transaction_items(jsonb_agg(item))
from (
    select
        ('10981000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as id,
        '00000000-0000-4000-8000-000000000032'::uuid as ledger_id,
        ('10980000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as transaction_record_id,
        '00000000-0000-4000-8000-000000000043'::uuid as account_id,
        '00000000-0000-4000-8000-000000005021'::uuid as category_id,
        case when seq in (25, 26) then 0::numeric else 100::numeric end as amount,
        case when seq in (1, 4) then 'pending_reimbursement'::public.transaction_item_special_status
             else null::public.transaction_item_special_status end as special_status,
        0 as sort_order,
        '00000000-0000-4000-8000-000000000031'::uuid as created_by,
        '00000000-0000-4000-8000-000000000031'::uuid as updated_by
    from generate_series(1, 26) seq
) item;

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

create function pg_temp.page(p_offset integer default 0, p_settled boolean default false,
                             p_merchant uuid default '00000000-0000-4000-8000-000000001001')
returns jsonb language sql stable as $$
    select public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'candidates',
        p_query => '1098候选',
        p_merchant_priority_id => p_merchant,
        p_currency => 'JPY',
        p_settled => p_settled,
        p_offset => p_offset
    )
$$;

select is(
    (select jsonb_array_length(pg_temp.page()->'entries')),
    20,
    '第一页返回 20 条原支出明细'
);
select is(
    (select (pg_temp.page()->'nextOffset')::text),
    '20',
    '第一页携带下一页 offset 20'
);
select results_eq(
    $$
      select (value->>'itemId')::uuid
      from jsonb_array_elements(pg_temp.page()->'entries')
      limit 3
    $$,
    $$
      values
       ('10981000-0000-4000-8000-000000000003'::uuid),
       ('10981000-0000-4000-8000-000000000002'::uuid),
       ('10981000-0000-4000-8000-000000000001'::uuid)
    $$,
    '同商家较早的 3 条先于其他商家的新记录'
);
select is(
    (select jsonb_array_length(pg_temp.page(20)->'entries')),
    4,
    '第二页返回剩余 4 条原支出明细'
);
select is(
    (select count(*)::integer
     from (
       select value->>'itemId' as item_id from jsonb_array_elements(pg_temp.page()->'entries')
       union
       select value->>'itemId' as item_id from jsonb_array_elements(pg_temp.page(20)->'entries')
     ) ids),
    24,
    '排序分页合并共 24 条不重复不漏'
);
select is(
    (select (pg_temp.page()->>'settledCount')::integer),
    2,
    '未结清页仍返回全部已结清数量'
);
select is(
    (select (pg_temp.page(0, true)->'entries'->0->>'itemId')::uuid),
    '10981000-0000-4000-8000-000000000026'::uuid,
    '已结清折叠区同商家优先于更新的其他商家'
);
select is(
    (select pg_temp.page(0, true)->>'nextOffset'),
    null::text,
    '已结清只有一页'
);
select is(
    (select jsonb_array_length(
      public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'candidates', p_query => '1098候选',
        p_special_statuses => array['pending_reimbursement'],
        p_currency => 'JPY'
      )->'entries'
    )),
    2,
    '报销候选仍仅包含允许的特殊状态'
);

select is(
    (select (
      public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'candidates', p_query => '1098候选',
        p_special_statuses => array['pending_reimbursement'],
        p_currency => 'JPY'
      )->'entries'->0->>'itemId'
    )::uuid),
    '10981000-0000-4000-8000-000000000004'::uuid,
    '报销候选保持时间顺序，不套用同商家优先'
);

select * from finish();
rollback;
