-- #1108：候选搜索新增付款账户、大小分类及单条明细备注；不改变 records 模式。
begin;
set local search_path = public, extensions;
select plan(14);

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, note, created_by, updated_by
) values
(
    '11080000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000032',
    'normal', 'active', '2108-01-01 00:00:00+00',
    '00000000-0000-4000-8000-000000001001',
    '1108 搜索甲', '1108记录备注甲',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
),
(
    '11080000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000032',
    'normal', 'active', '2108-01-02 00:00:00+00',
    '00000000-0000-4000-8000-000000001001',
    '1108 搜索乙', '1108记录备注乙',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

select tests.insert_normal_transaction_items(jsonb_build_array(
    jsonb_build_object(
        'id', '11081000-0000-4000-8000-000000000001',
        'ledger_id', '00000000-0000-4000-8000-000000000032',
        'transaction_record_id', '11080000-0000-4000-8000-000000000001',
        'account_id', '00000000-0000-4000-8000-000000000043',
        'category_id', '00000000-0000-4000-8000-000000005021',
        'amount', 123, 'note', '1108明细备注甲', 'sort_order', 0,
        'created_by', '00000000-0000-4000-8000-000000000031',
        'updated_by', '00000000-0000-4000-8000-000000000031'
    ),
    jsonb_build_object(
        'id', '11081000-0000-4000-8000-000000000002',
        'ledger_id', '00000000-0000-4000-8000-000000000032',
        'transaction_record_id', '11080000-0000-4000-8000-000000000002',
        'account_id', '00000000-0000-4000-8000-000000000043',
        'category_id', '00000000-0000-4000-8000-000000005021',
        'amount', 234, 'sort_order', 0,
        'created_by', '00000000-0000-4000-8000-000000000031',
        'updated_by', '00000000-0000-4000-8000-000000000031'
    )
));

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

create function pg_temp.fetch_1108(p_query text, p_scope text default 'candidates',
    p_ledger_id uuid default '00000000-0000-4000-8000-000000000032')
returns jsonb language sql stable as $$
    select public.load_filtered_transaction_page(
        p_ledger_id => p_ledger_id,
        p_scope => p_scope,
        p_query => p_query,
        p_limit => 50
    )
$$;

create function pg_temp.has_item_1108(p_query text, p_item uuid)
returns boolean language sql stable as $$
    select exists (
        select 1 from jsonb_array_elements(pg_temp.fetch_1108(p_query)->'entries') entry
        where entry->>'itemId' = p_item::text
    )
$$;

select ok(pg_temp.has_item_1108(
    (select name from public.account where id = '00000000-0000-4000-8000-000000000043'),
    '11081000-0000-4000-8000-000000000001'
), '候选能按卡片显示的首个付款账户名称搜索');

select ok(pg_temp.has_item_1108(
    (select name from public.category where id = '00000000-0000-4000-8000-000000005021'),
    '11081000-0000-4000-8000-000000000001'
), '候选能按小分类名称搜索');

select ok(pg_temp.has_item_1108(
    (select name from public.category where id = '00000000-0000-4000-8000-000000005020'),
    '11081000-0000-4000-8000-000000000001'
), '候选能按大分类名称搜索');

select ok(pg_temp.has_item_1108('1108明细备注甲',
    '11081000-0000-4000-8000-000000000001'
), '候选能按当前明细备注搜索，而非仅首条明细备注');

select ok(pg_temp.has_item_1108('1108记录备注乙',
    '11081000-0000-4000-8000-000000000002'
), '没有明细备注时仍能按记录备注搜索');

select is((
    select entry->>'note' from jsonb_array_elements(pg_temp.fetch_1108('1108明细备注甲')->'entries') entry
    where entry->>'itemId' = '11081000-0000-4000-8000-000000000001'
), '1108明细备注甲', '候选响应优先返回明细备注');

select is((
    select entry->>'note' from jsonb_array_elements(pg_temp.fetch_1108('1108记录备注乙')->'entries') entry
    where entry->>'itemId' = '11081000-0000-4000-8000-000000000002'
), '1108记录备注乙', '明细备注为空时响应回退到记录备注');

select ok(not (pg_temp.fetch_1108('1108明细备注甲', 'records')->'entries')
    @> '[{"recordId":"11080000-0000-4000-8000-000000000001"}]'::jsonb,
    'records 模式仍以记录备注优先，不搜索被记录备注覆盖的明细备注');

select ok(not (pg_temp.fetch_1108('📘 Debit', 'records')->'entries')
    @> '[{"recordId":"11080000-0000-4000-8000-000000000001"}]'::jsonb,
    'records 模式不新增付款账户名称搜索');

select ok((pg_temp.fetch_1108('1108记录备注甲', 'records')->'entries')
    @> '[{"recordId":"11080000-0000-4000-8000-000000000001"}]'::jsonb,
    'records 模式保留原有记录备注搜索');

select ok(not (pg_temp.fetch_1108('1108明细备注甲', 'candidates',
    '00000000-0000-4000-8000-000000000033')->'entries')
    @> '[{"itemId":"11081000-0000-4000-8000-000000000001"}]'::jsonb,
    '请求另一账本不会读到当前账本候选');

select ok(has_function_privilege('authenticated',
    'public.load_filtered_transaction_page(uuid, text, text, uuid, text, text[], boolean, integer, integer, uuid, text)',
    'EXECUTE'), '只有 authenticated 被授予候选 RPC 执行权限');

select ok(not has_function_privilege('anon',
    'public.load_filtered_transaction_page(uuid, text, text, uuid, text, text[], boolean, integer, integer, uuid, text)',
    'EXECUTE'), 'anon 没有候选 RPC 执行权限');

-- 在相同权限和 seed 数据下各记录一次 EXPLAIN (ANALYZE, BUFFERS)；
-- 通过 pgTAP diag 发送至 CI 输出，供 PR 记载真实数值。
create function pg_temp.explain_1108(p_term text)
returns text language plpgsql as $
declare
    v_plan jsonb;
begin
    execute format(
        'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) '
        || 'select public.load_filtered_transaction_page('
        || 'p_ledger_id => %L::uuid, p_scope => %L, p_query => %L, p_limit => 20)',
        '00000000-0000-4000-8000-000000000032', 'candidates', p_term
    ) into v_plan;
    return format(
        '候选查询 term=%L: execution=%s ms, planning=%s ms, shared_hit=%s, shared_read=%s',
        p_term,
        v_plan->0->>'Execution Time',
        v_plan->0->>'Planning Time',
        v_plan->0->'Plan'->>'Shared Hit Blocks',
        v_plan->0->'Plan'->>'Shared Read Blocks'
    );
end;
$;
select diag(pg_temp.explain_1108(''));
select diag(pg_temp.explain_1108('1108明细备注甲'));

select set_config(
    'request.jwt.claims',
    '{"sub":"11080000-0000-4000-8000-000000000999","role":"authenticated"}',
    true
);
select ok(not pg_temp.has_item_1108('1108明细备注甲',
    '11081000-0000-4000-8000-000000000001'),
    '非成员无法检索到账本候选');

select * from finish();
rollback;
