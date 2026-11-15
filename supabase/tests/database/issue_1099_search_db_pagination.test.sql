-- #1099：records 模式保持旧 TypeScript 搜索的匹配、排序和分页语义。
begin;
set local search_path = public, extensions;
select no_plan();

-- 23 条明确带标记的记录：跨两页检查全部记录恰好出现一次。
insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, note, created_by, updated_by
)
select
    ('10990000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid,
    '00000000-0000-4000-8000-000000000032'::uuid,
    'normal', 'active', '2099-01-01 00:00:00+00'::timestamptz + seq * interval '1 minute',
    '00000000-0000-4000-8000-000000001001'::uuid,
    '1099 搜索分页', '1099分页',
    '00000000-0000-4000-8000-000000000031'::uuid,
    '00000000-0000-4000-8000-000000000031'::uuid
from generate_series(1, 23) seq;

select tests.insert_normal_transaction_items(jsonb_agg(item))
from (
    select
        ('10991000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as id,
        '00000000-0000-4000-8000-000000000032'::uuid as ledger_id,
        ('10990000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as transaction_record_id,
        '00000000-0000-4000-8000-000000000043'::uuid as account_id,
        '00000000-0000-4000-8000-000000005021'::uuid as category_id,
        100::numeric as amount,
        0 as sort_order,
        '00000000-0000-4000-8000-000000000031'::uuid as created_by,
        '00000000-0000-4000-8000-000000000031'::uuid as updated_by
    from generate_series(1, 23) seq
) item;

-- 记录备注为 NULL 时只取首条明细备注；普通记录同时验证整笔净额和明细金额。
insert into public.transaction_record (
    id, ledger_id, type, transaction_at, merchant_id, title, note, created_by, updated_by
)
values
    ('10990000-0000-4000-8000-000000000030', '00000000-0000-4000-8000-000000000032',
     'normal', '2098-01-01 00:00:00+00', '00000000-0000-4000-8000-000000001002',
     '1099金额', null, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
    ('10990000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000032',
     'normal', '2098-01-02 00:00:00+00', '00000000-0000-4000-8000-000000001002',
     '1099备注', null, '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
    ('10990000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000032',
     'normal', '2098-01-03 00:00:00+00', '00000000-0000-4000-8000-000000001002',
     '1099优先备注', '1099记录备注优先', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
    ('10990000-0000-4000-8000-000000000050', '00000000-0000-4000-8000-000000000032',
     'normal', '2098-01-04 00:00:00+00', '00000000-0000-4000-8000-000000001002',
     '1099字段截断', repeat('x', 80) || '1099尾部不可匹配',
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');

select tests.insert_normal_transaction_items(jsonb_agg(item))
from (
    select
        ('10992000-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as id,
        '00000000-0000-4000-8000-000000000032'::uuid as ledger_id,
        '10990000-0000-4000-8000-000000000030'::uuid as transaction_record_id,
        '00000000-0000-4000-8000-000000000043'::uuid as account_id,
        '00000000-0000-4000-8000-000000005021'::uuid as category_id,
        4376571::numeric as amount,
        seq as sort_order,
        '00000000-0000-4000-8000-000000000031'::uuid as created_by,
        '00000000-0000-4000-8000-000000000031'::uuid as updated_by
    from generate_series(1, 2) seq
) item;

select tests.insert_normal_transaction_items(jsonb_build_array(
    jsonb_build_object(
        'id', '10992100-0000-4000-8000-000000000001',
        'ledger_id', '00000000-0000-4000-8000-000000000032',
        'transaction_record_id', '10990000-0000-4000-8000-000000000031',
        'account_id', '00000000-0000-4000-8000-000000000043',
        'category_id', '00000000-0000-4000-8000-000000005021',
        'amount', 120, 'note', '1099首明细备注', 'sort_order', 0,
        'created_by', '00000000-0000-4000-8000-000000000031',
        'updated_by', '00000000-0000-4000-8000-000000000031'
    ),
    jsonb_build_object(
        'id', '10992100-0000-4000-8000-000000000002',
        'ledger_id', '00000000-0000-4000-8000-000000000032',
        'transaction_record_id', '10990000-0000-4000-8000-000000000031',
        'account_id', '00000000-0000-4000-8000-000000000043',
        'category_id', '00000000-0000-4000-8000-000000005021',
        'amount', 130, 'note', '1099后续明细备注', 'sort_order', 1,
        'created_by', '00000000-0000-4000-8000-000000000031',
        'updated_by', '00000000-0000-4000-8000-000000000031'
    ),
    jsonb_build_object(
        'id', '10992100-0000-4000-8000-000000000003',
        'ledger_id', '00000000-0000-4000-8000-000000000032',
        'transaction_record_id', '10990000-0000-4000-8000-000000000032',
        'account_id', '00000000-0000-4000-8000-000000000043',
        'category_id', '00000000-0000-4000-8000-000000005021',
        'amount', 100, 'note', '1099明细被覆盖', 'sort_order', 0,
        'created_by', '00000000-0000-4000-8000-000000000031',
        'updated_by', '00000000-0000-4000-8000-000000000031'
    ),
    jsonb_build_object(
        'id', '10992100-0000-4000-8000-000000000004',
        'ledger_id', '00000000-0000-4000-8000-000000000032',
        'transaction_record_id', '10990000-0000-4000-8000-000000000050',
        'account_id', '00000000-0000-4000-8000-000000000043',
        'category_id', '00000000-0000-4000-8000-000000005021',
        'amount', 100, 'sort_order', 0,
        'created_by', '00000000-0000-4000-8000-000000000031',
        'updated_by', '00000000-0000-4000-8000-000000000031'
    )
));

-- 同交易时间按创建时间倒序，再按 UUID 倒序。
insert into public.transaction_record (
    id, ledger_id, type, transaction_at, created_at,
    merchant_id, title, note, created_by, updated_by
) values
    ('10990000-0000-4000-8000-000000000040', '00000000-0000-4000-8000-000000000032',
     'normal', '2099-05-01 00:00:00+00', '2026-01-01 00:00:00+00',
     '00000000-0000-4000-8000-000000001001', '1099排序', '1099并列排序',
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
    ('10990000-0000-4000-8000-000000000041', '00000000-0000-4000-8000-000000000032',
     'normal', '2099-05-01 00:00:00+00', '2026-01-01 00:00:00+00',
     '00000000-0000-4000-8000-000000001001', '1099排序', '1099并列排序',
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'),
    ('10990000-0000-4000-8000-000000000042', '00000000-0000-4000-8000-000000000032',
     'normal', '2099-05-01 00:00:00+00', '2026-01-02 00:00:00+00',
     '00000000-0000-4000-8000-000000001001', '1099排序', '1099并列排序',
     '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');

select tests.insert_normal_transaction_items(jsonb_agg(item))
from (
    select
        ('10992200-0000-4000-8000-' || lpad(seq::text, 12, '0'))::uuid as id,
        '00000000-0000-4000-8000-000000000032'::uuid as ledger_id,
        ('10990000-0000-4000-8000-' || lpad((39 + seq)::text, 12, '0'))::uuid as transaction_record_id,
        '00000000-0000-4000-8000-000000000043'::uuid as account_id,
        '00000000-0000-4000-8000-000000005021'::uuid as category_id,
        100::numeric as amount,
        0 as sort_order,
        '00000000-0000-4000-8000-000000000031'::uuid as created_by,
        '00000000-0000-4000-8000-000000000031'::uuid as updated_by
    from generate_series(1, 3) seq
) item;

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    note, deleted_at, deleted_by, created_by, updated_by
) values (
    '10990000-0000-4000-8000-000000000051',
    '00000000-0000-4000-8000-000000000032',
    'normal', 'deleted', '2100-01-01 00:00:00+00',
    '00000000-0000-4000-8000-000000001001',
    '1099作废', now(), '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'
);

-- 余额调整只查 balance_delta（带负号），无明细分类。
insert into public.transaction_record (
    id, ledger_id, type, transaction_at, note, created_by, updated_by
) values (
    '10990000-0000-4000-8000-000000000052',
    '00000000-0000-4000-8000-000000000032',
    'balance_adjustment', '2098-03-01 00:00:00+00',
    '1099余额调整', '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'
);
insert into public.transaction_item (
    id, ledger_id, transaction_record_id, account_id,
    amount, balance_delta, sort_order, created_by, updated_by
) values (
    '10992300-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000032',
    '10990000-0000-4000-8000-000000000052',
    '00000000-0000-4000-8000-000000000043',
    24731, -24731, 0,
    '00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031'
);

update public.merchant_alias set is_preferred = false
where merchant_id = '00000000-0000-4000-8000-000000001001';
update public.merchant_alias set is_preferred = true
where id = '00000000-0000-4000-8000-000000003001';
update public.ledger_member_display_setting
set display_name = '1099成员昵称'
where ledger_id = '00000000-0000-4000-8000-000000000032'
  and user_id = '00000000-0000-4000-8000-000000000031';

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

create function pg_temp.search_page(p_query text, p_offset integer default 0)
returns jsonb language sql stable as $$
    select public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'records', p_query => p_query, p_offset => p_offset
    )
$$;

select is((pg_temp.search_page('1099分页')->>'totalCount')::integer, 23,
    '记录分页返回完整命中总数');
select is(jsonb_array_length(pg_temp.search_page('1099分页')->'entries'), 20,
    '第一页仅返回 20 条');
select is(pg_temp.search_page('1099分页')->>'nextOffset', '20',
    '第一页下一游标为 20');
select is(jsonb_array_length(pg_temp.search_page('1099分页', 20)->'entries'), 3,
    '第二页返回剩余三条');
select is(pg_temp.search_page('1099分页', 20)->>'nextOffset', null::text,
    '最后一页没有下一游标');
select is((
    select count(distinct value->>'recordId') from (
        select value from jsonb_array_elements(pg_temp.search_page('1099分页')->'entries')
        union all
        select value from jsonb_array_elements(pg_temp.search_page('1099分页', 20)->'entries')
    ) all_pages
), 23::bigint, '两页无重复、不漏记录');
select is((
    pg_temp.search_page('1099分页', 20)->'entries'->0->>'recordId'
)::uuid, '10990000-0000-4000-8000-000000000003'::uuid,
    '第二页从正确的记录继续');
select results_eq(
    $$
    select (value->>'recordId')::uuid
    from jsonb_array_elements(pg_temp.search_page('1099并列排序')->'entries')
    $$,
    $$values
      ('10990000-0000-4000-8000-000000000042'::uuid),
      ('10990000-0000-4000-8000-000000000041'::uuid),
      ('10990000-0000-4000-8000-000000000040'::uuid)$$,
    '交易时间、创建时间、记录 ID 依次倒序');

select is((pg_temp.search_page('1099首明细备注')->>'totalCount')::integer, 1,
    '记录备注为空时采用第一条明细备注');
select is((pg_temp.search_page('1099后续明细备注')->>'totalCount')::integer, 0,
    '不会用第二条明细备注替代第一条');
select is((pg_temp.search_page('1099记录备注优先')->>'totalCount')::integer, 1,
    '记录备注优先于明细备注');
select is((pg_temp.search_page('1099明细被覆盖')->>'totalCount')::integer, 0,
    '记录有备注时不会额外搜索明细备注');
select is((pg_temp.search_page('1099尾部不可匹配')->>'totalCount')::integer, 0,
    '字段超过 80 字的后半段不命中');
select ok((pg_temp.search_page('1099成员昵称')->>'totalCount')::integer >= 23,
    '记录人使用账本成员显示名优先');

select ok(exists (
    select 1 from jsonb_array_elements(pg_temp.search_page('业务超市')->'entries') entry
    where entry->>'recordId' = '10990000-0000-4000-8000-000000000042'
), '首选商家别名可被搜索');
select ok(not exists (
    select 1 from jsonb_array_elements(pg_temp.search_page('Gyomu Super')->'entries') entry
    where entry->>'recordId' = '10990000-0000-4000-8000-000000000042'
), '非首选别名不会被搜索');

select is((pg_temp.search_page('8753142')->>'totalCount')::integer, 1,
    '普通记录命中多明细合计的净金额');
select is((pg_temp.search_page('4376571')->>'totalCount')::integer, 1,
    '普通记录命中任意明细的原金额');
select is((pg_temp.search_page('¥8,753,142円')->>'totalCount')::integer, 1,
    '金额查询去掉日元符号和英文逗号');
select is((pg_temp.search_page('￥8，753，142円')->>'totalCount')::integer, 1,
    '金额查询去掉全角货币符号和逗号');
select is((pg_temp.search_page('8753142.0')->>'totalCount')::integer, 0,
    '金额尾零不能误命中整数');
select is((pg_temp.search_page('-24731')->>'totalCount')::integer, 1,
    '余额调整搜索带负号的余额变动');

-- 转账通过真实 RPC 创建，避免直接插入不满足转账账户不变量。
select is(
    (select count(*)::integer from (
        select public.create_transfer_transaction(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_from_account_id => '00000000-0000-4000-8000-000000000043',
            p_to_account_id => '00000000-0000-4000-8000-000000000044',
            p_amount => 61983, p_transaction_at => '2098-04-01 00:00:00+00',
            p_note => '1099转账'
        )
    ) created), 1,
    '转账用真实创建 RPC 写入');
select is((pg_temp.search_page('61983')->>'totalCount')::integer, 1,
    '转账按照展示金额匹配');
select is((pg_temp.search_page('1099转账')->>'totalCount')::integer, 1,
    '转账按照记录备注匹配');
select is((pg_temp.search_page('1099作废')->>'totalCount')::integer, 0,
    '作废记录不出现');
select is((pg_temp.search_page('1099根本不存在')->>'totalCount')::integer, 0,
    '没有命中时总数为零');
select is(pg_temp.search_page('1099根本不存在')->>'nextOffset', null::text,
    '没有命中时不提供下一页');

-- 仅用于 pgTAP 回归时记录实际数据库计划，不增加应用日志或性能阈值断言。
create function pg_temp.explain_search(p_query text)
returns text language plpgsql as $bench$
declare
    plan_line text;
    detail text := '';
begin
    for plan_line in execute format(
        $plan$explain (analyze, buffers)
          select public.load_filtered_transaction_page(
              p_ledger_id => '00000000-0000-4000-8000-000000000032',
              p_scope => 'records',
              p_query => %L
          )$plan$,
        p_query
    ) loop
        if plan_line like 'Execution Time:%' or plan_line like '%Buffers:%' then
            detail := detail || plan_line || E'\\n';
        end if;
    end loop;
    return detail;
end;
$bench$;
select diag('1099 多条命中 EXPLAIN (ANALYZE, BUFFERS): '
    || pg_temp.explain_search('1099分页'));
select diag('1099 零命中 EXPLAIN (ANALYZE, BUFFERS): '
    || pg_temp.explain_search('1099根本不存在'));

-- 已归档的首选别名不再作为商家展示名，回退为商家主名称。
reset role;
update public.merchant_alias
set is_archived = true,
    is_preferred = false,
    archived_at = now(),
    archived_by = '00000000-0000-4000-8000-000000000031'
where id = '00000000-0000-4000-8000-000000003001';
set local role authenticated;
select is((pg_temp.search_page('业务超市')->>'totalCount')::integer, 0,
    '归档的首选别名不会被搜索');
select ok(exists (
    select 1 from jsonb_array_elements(pg_temp.search_page('業務スーパー')->'entries') entry
    where entry->>'recordId' = '10990000-0000-4000-8000-000000000042'
), '归档别名后回退搜索商家本名');

select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000099","role":"authenticated"}',
    true
);
select is((pg_temp.search_page('1099分页')->>'totalCount')::integer, 0,
    '非账本成员不能读取匹配的记录');
select is(jsonb_array_length(pg_temp.search_page('1099分页')->'entries'), 0,
    '非账本成员无法读取分页 ID');

select * from finish();
rollback;
