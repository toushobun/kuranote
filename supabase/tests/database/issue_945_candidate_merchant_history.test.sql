-- #945：历史商家只改变未结清候选的顺序。
begin;
set local search_path = public, extensions;
select plan(9);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

create function pg_temp.fixture_uuid(p_number integer)
returns uuid language sql immutable as $$
    select ('94500000-0000-4000-8000-' || lpad(p_number::text, 12, '0'))::uuid
$$;

create function pg_temp.seed_uuid(p_number integer)
returns uuid language sql immutable as $$
    select ('00000000-0000-4000-8000-' || lpad(p_number::text, 12, '0'))::uuid
$$;

insert into public.ledger (id, name, base_currency, owner_user_id, created_by, updated_by)
values (pg_temp.fixture_uuid(90), '945 另一账本', 'JPY', pg_temp.seed_uuid(31), pg_temp.seed_uuid(31), pg_temp.seed_uuid(31));

insert into public.ledger_member (ledger_id, user_id, role, status, joined_at, created_by, updated_by)
values (pg_temp.fixture_uuid(90), pg_temp.seed_uuid(31), 'owner', 'active', now(), pg_temp.seed_uuid(31), pg_temp.seed_uuid(31));

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id, title, note, created_by, updated_by
)
select pg_temp.fixture_uuid(seq), pg_temp.seed_uuid(32), 'normal', 'active',
       '2099-01-01 00:00:00+00'::timestamptz + seq * interval '1 minute',
       pg_temp.seed_uuid(merchant), '945 历史测试', '945历史测试条目',
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
    p_force_merchant_priority boolean default false
) returns jsonb language sql stable as $$
    select public.load_filtered_transaction_page(
        p_ledger_id => pg_temp.seed_uuid(32),
        p_scope => p_scope,
        p_link_kind => case when p_refund then 'refund' else 'reimbursement' end,
        p_query => '945历史测试条目',
        p_merchant_priority_id => case when p_refund or p_force_merchant_priority then pg_temp.seed_uuid(1001) end,
        p_history_merchant_id => case when p_history_merchant is not null then pg_temp.seed_uuid(p_history_merchant) end,
        p_special_statuses => case when not p_refund then array['pending_reimbursement'] end,
        p_settled => p_settled
    )
$$;

create function pg_temp.item_ids(p_page jsonb)
returns uuid[] language sql immutable as $$
    select array(select (value->>'itemId')::uuid from jsonb_array_elements(p_page->'entries'))
$$;

select is(pg_temp.item_ids(pg_temp.page(true)),
    array[pg_temp.fixture_uuid(103), pg_temp.fixture_uuid(104), pg_temp.fixture_uuid(102), pg_temp.fixture_uuid(101)],
    '退款先按同商家与其他未抵扣，部分结清放最后');

select is(pg_temp.item_ids(pg_temp.page(false)),
    array[pg_temp.fixture_uuid(104), pg_temp.fixture_uuid(103), pg_temp.fixture_uuid(102), pg_temp.fixture_uuid(101)],
    '报销优先未抵扣普通候选，部分结清放最后');

select is(pg_temp.page(false, p_force_merchant_priority => true)->'historyMerchantIds',
    jsonb_build_array(pg_temp.seed_uuid(1003)),
    '报销即使传入同商家优先 ID，历史仍只读取报销关联');

select is(pg_temp.item_ids(pg_temp.page(true, 1999)), pg_temp.item_ids(pg_temp.page(true, null)),
    '无退款历史时沿用原排序');

select is(pg_temp.item_ids(pg_temp.page(false, 1999)), pg_temp.item_ids(pg_temp.page(false, null)),
    '无报销历史时沿用原排序');

select is(pg_temp.page(true, 1001, 'candidates', true), pg_temp.page(true, null, 'candidates', true),
    '已结清页不受历史影响');

select is(pg_temp.page(true, 1001, 'records'), pg_temp.page(false, null, 'records'),
    'records 模式忽略候选商家历史与同商家排序');

select is(
    public.load_filtered_transaction_page(
        p_ledger_id => pg_temp.fixture_uuid(90),
        p_scope => 'candidates',
        p_link_kind => 'refund',
        p_merchant_priority_id => pg_temp.seed_uuid(1001),
        p_history_merchant_id => pg_temp.seed_uuid(1001)
    )->'historyMerchantIds',
    '[]'::jsonb,
    '即使同时是两个账本的成员，也不混入另一账本的关联历史'
);

select set_config(
    'request.jwt.claims',
    '{"sub":"94500000-0000-4000-8000-000000000999","role":"authenticated"}',
    true
);
select is(pg_temp.page(true)->'historyMerchantIds', '[]'::jsonb,
    '非成员读不到历史商家');

select * from finish();
rollback;
