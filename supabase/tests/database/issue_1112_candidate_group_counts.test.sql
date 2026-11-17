-- #1112：按原有优先级分层统计未结清候选，保持记录模式与权限边界。
begin;
set local search_path = public, extensions;
select plan(12);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

create function pg_temp.fixture_uuid(p_number integer)
returns uuid language sql immutable as $$
    select ('11120000-0000-4000-8000-' || lpad(p_number::text, 12, '0'))::uuid
$$;

create function pg_temp.seed_uuid(p_number integer)
returns uuid language sql immutable as $$
    select ('00000000-0000-4000-8000-' || lpad(p_number::text, 12, '0'))::uuid
$$;

insert into public.ledger (id, name, base_currency, owner_user_id, created_by, updated_by)
values (pg_temp.fixture_uuid(90), '1112 另一账本', 'JPY', pg_temp.seed_uuid(31), pg_temp.seed_uuid(31), pg_temp.seed_uuid(31));

insert into public.ledger_member (ledger_id, user_id, role, status, joined_at, created_by, updated_by)
values (pg_temp.fixture_uuid(90), pg_temp.seed_uuid(31), 'owner', 'active', now(), pg_temp.seed_uuid(31), pg_temp.seed_uuid(31));

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id, title, note, created_by, updated_by
)
select pg_temp.fixture_uuid(seq), pg_temp.seed_uuid(32), 'normal', 'active',
       '2099-01-01 00:00:00+00'::timestamptz + seq * interval '1 minute',
       pg_temp.seed_uuid(merchant), '1112 候选计数', '1112候选计数条目',
       pg_temp.seed_uuid(31), pg_temp.seed_uuid(31)
from (values (1, 1002), (2, 1003), (3, 1001), (4, 1004), (5, 1001), (6, 1001)) as records(seq, merchant);

select tests.insert_normal_transaction_items(jsonb_agg(item))
from (
    select pg_temp.fixture_uuid(seq + 100) as id,
           pg_temp.seed_uuid(32) as ledger_id,
           pg_temp.fixture_uuid(seq) as transaction_record_id,
           pg_temp.seed_uuid(43) as account_id,
           pg_temp.seed_uuid(case when seq <= 4 then 5021 else 5002 end) as category_id,
           case when seq <= 4 then 100 else 20 end as amount,
           0 as sort_order,
           case when seq <= 4 then 'pending_reimbursement'::public.transaction_item_special_status end as special_status,
           pg_temp.seed_uuid(31) as created_by,
           pg_temp.seed_uuid(31) as updated_by
    from generate_series(1, 6) seq
) item;

select public.apply_transaction_item_links(
    pg_temp.seed_uuid(32), pg_temp.fixture_uuid(105),
    jsonb_build_object('refundedItemId', pg_temp.fixture_uuid(101)),
    pg_temp.seed_uuid(31)
);
select public.apply_transaction_item_links(
    pg_temp.seed_uuid(32), pg_temp.fixture_uuid(106),
    jsonb_build_object('reimbursementItemId', pg_temp.fixture_uuid(102)),
    pg_temp.seed_uuid(31)
);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

create function pg_temp.page(
    p_refund boolean,
    p_history_merchant integer default 1001,
    p_scope text default 'candidates',
    p_settled boolean default false,
    p_force_merchant_priority boolean default false,
    p_offset integer default 0
) returns jsonb language sql stable as $$
    select public.load_filtered_transaction_page(
        p_ledger_id => pg_temp.seed_uuid(32),
        p_scope => p_scope,
        p_link_kind => case when p_refund then 'refund' else 'reimbursement' end,
        p_query => '1112候选计数条目',
        p_merchant_priority_id => case when p_refund or p_force_merchant_priority then pg_temp.seed_uuid(1001) end,
        p_history_merchant_id => case when p_history_merchant is not null then pg_temp.seed_uuid(p_history_merchant) end,
        p_special_statuses => case when not p_refund then array['pending_reimbursement'] end,
        p_settled => p_settled,
        p_offset => p_offset
    )
$$;

create function pg_temp.item_ids(p_page jsonb)
returns uuid[] language sql immutable as $$
    select array(select (value->>'itemId')::uuid from jsonb_array_elements(p_page->'entries'))
$$;

select is(
    pg_temp.page(true)->'groupCounts',
    '{"history": 1, "sameMerchant": 1, "other": 2}'::jsonb,
    '退款按历史商家、同商家、其他分层计数'
);
select is(
    pg_temp.page(false)->'groupCounts',
    '{"history": 1, "sameMerchant": 0, "other": 3}'::jsonb,
    '报销只按历史与其他待报销分层计数'
);
select is(
    pg_temp.page(true, null)->'groupCounts',
    '{"history": 0, "sameMerchant": 1, "other": 3}'::jsonb,
    '没有退款历史时同商家仍单独计数'
);
select is(
    pg_temp.page(false, null)->'groupCounts',
    '{"history": 0, "sameMerchant": 0, "other": 4}'::jsonb,
    '没有报销历史时所有未结清候选归入其他'
);
select ok(pg_temp.page(true) ? 'groupCounts',
    'candidates 首页返回分层计数');
select ok(not (pg_temp.page(true, p_offset => 1) ? 'groupCounts'),
    'candidates 非首页不重复返回计数');
select ok(not (pg_temp.page(true, p_settled => true) ? 'groupCounts'),
    '已结清分页首页不重复统计未结清分层');
select ok(not (pg_temp.page(true, p_scope => 'records') ? 'groupCounts'),
    'records 模式不增加字段');
select is(
    pg_temp.page(true, p_scope => 'records'),
    pg_temp.page(false, p_scope => 'records'),
    'records 模式返回内容不随关联类型改变'
);
select is(
    public.load_filtered_transaction_page(
        p_ledger_id => pg_temp.fixture_uuid(90),
        p_scope => 'candidates',
        p_link_kind => 'refund',
        p_history_merchant_id => pg_temp.seed_uuid(1001)
    )->'groupCounts',
    '{"history": 0, "sameMerchant": 0, "other": 0}'::jsonb,
    '其他账本的候选不会混入当前账本'
);
select set_config(
    'request.jwt.claims',
    '{"sub":"11120000-0000-4000-8000-000000000999","role":"authenticated"}',
    true
);
select is(
    pg_temp.page(true)->'groupCounts',
    '{"history": 0, "sameMerchant": 0, "other": 0}'::jsonb,
    '非成员不能看到候选笔数'
);
select ok(not has_function_privilege(
    'anon',
    'public.load_filtered_transaction_page(uuid,text,text,uuid,text,text[],boolean,integer,integer,uuid,text)'::regprocedure,
    'EXECUTE'
), 'anon 无函数执行权限');

select * from finish();
rollback;
