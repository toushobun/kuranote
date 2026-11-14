-- #1098：同商家优先、明细级分页、跨页无重复、全量结清数、报销范围。
begin;
set local search_path = public, extensions;
select plan(19);

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

-- 两条 4376571 元明细组成独特金额 8753142，避免与种子数据的金额子串冲突。
insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, note, created_by, updated_by
) values (
    '10980000-0000-4000-8000-000000000027',
    '00000000-0000-4000-8000-000000000032',
    'normal', 'active', '2097-01-01 00:00:00+00',
    '00000000-0000-4000-8000-000000001002',
    '金额文本规范', '金额文本规范',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

select tests.insert_normal_transaction_items(jsonb_agg(item))
from (
    select
        ('10982000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as id,
        '00000000-0000-4000-8000-000000000032'::uuid as ledger_id,
        '10980000-0000-4000-8000-000000000027'::uuid as transaction_record_id,
        '00000000-0000-4000-8000-000000000043'::uuid as account_id,
        '00000000-0000-4000-8000-000000005021'::uuid as category_id,
        4376571::numeric as amount,
        seq as sort_order,
        '00000000-0000-4000-8000-000000000031'::uuid as created_by,
        '00000000-0000-4000-8000-000000000031'::uuid as updated_by
    from generate_series(1, 2) seq
) item;

update public.merchant_alias
set is_preferred = false
where merchant_id = '00000000-0000-4000-8000-000000001001';

update public.merchant_alias
set is_preferred = true
where id = '00000000-0000-4000-8000-000000003001';

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

select is(
    (select (pg_temp.page()->>'totalCount')::integer),
    24,
    '分页元数据提供未结清候选的总数'
);
select is(
    (
      select (public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'records', p_query => '1098候选'
      )->>'totalCount')::integer
    ),
    26,
    '共用记录分页接口返回全部命中数'
);
select is(
    (
      select jsonb_array_length(public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'candidates', p_query => '8753142.0',
        p_currency => 'JPY'
      )->'entries')
    ),
    0,
    '小数搜索不误命中整笔为 8753142 的多明细记录'
);
select is(
    (
      select jsonb_array_length(public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'candidates', p_query => '8753142',
        p_currency => 'JPY'
      )->'entries')
    ),
    2,
    '搜索整笔 8753142 返回对应两条支出明细'
);
select is(
    (
      select (public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'records', p_query => '8753142'
      )->>'totalCount')::integer
    ),
    1,
    '记录搜索可读取独特整笔金额命中总数'
);

select is(
    (
      select jsonb_array_length(public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'candidates', p_query => '4376571.0',
        p_currency => 'JPY'
      )->'entries')
    ),
    (
      select case when strpos(ti.amount::text, '4376571.0') > 0 then 2 else 0 end
      from public.transaction_item_with_refund ti
      where ti.id = '10982000-0000-4000-8000-000000000001'
    ),
    '明细金额搜索遵守数据库返回的原始小数文本口径'
);
select is(
    (
      select (public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'records', p_query => '4376571.0'
      )->>'totalCount')::integer
    ),
    (
      select case when strpos(ti.amount::text, '4376571.0') > 0 then 1 else 0 end
      from public.transaction_item_with_refund ti
      where ti.id = '10982000-0000-4000-8000-000000000001'
    ),
    '记录搜索的明细金额部分同样保留原始小数文本'
);


select ok(
    (
      select (public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'candidates', p_query => '业务超市'
      )->>'totalCount')::integer
    ) >= 3,
    '退款候选搜索可命中当前商家的首选别名'
);
select ok(
    (
      select (public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'records', p_query => '业务超市'
      )->>'totalCount')::integer
    ) >= 4,
    '共用交易搜索接口可命中首选别名'
);

select * from finish();
rollback;
