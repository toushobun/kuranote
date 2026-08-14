begin;

set local search_path = public, extensions;

select plan(8);

insert into public.ledger (
    id, name, base_currency, owner_user_id, created_by, updated_by
)
values (
    '56700000-0000-4000-8000-000000000001',
    'frequent category test ledger',
    'JPY',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.ledger_member (
    id, ledger_id, user_id, role, status, invited_by, invited_at, joined_at,
    created_by, updated_by
)
values (
    '56700000-0000-4000-8000-000000000002',
    '56700000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000031',
    'owner',
    'active',
    '00000000-0000-4000-8000-000000000031',
    now(),
    now(),
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.account (
    id, ledger_id, name, type, currency, initial_balance, sort_order,
    created_by, updated_by
)
values (
    '56700000-0000-4000-8000-000000000003',
    '56700000-0000-4000-8000-000000000001',
    'test account',
    'cash',
    'JPY',
    0,
    10,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

insert into public.category (
    id, ledger_id, parent_id, type, name, icon_name, color, sort_order,
    created_by, updated_by
)
values
    (
        '56700000-0000-4000-8000-000000000004',
        '56700000-0000-4000-8000-000000000001',
        null,
        'expense',
        'test parent',
        'Wallet',
        '#000000',
        10,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '56700000-0000-4000-8000-000000000005',
        '56700000-0000-4000-8000-000000000001',
        '56700000-0000-4000-8000-000000000004',
        'expense',
        'test child',
        'Wallet',
        '#000000',
        10,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    ),
    (
        '56700000-0000-4000-8000-000000000007',
        '56700000-0000-4000-8000-000000000001',
        '56700000-0000-4000-8000-000000000004',
        'expense',
        'archived test child',
        'Wallet',
        '#000000',
        20,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );

insert into public.merchant (
    id, ledger_id, name, sort_order, created_by, updated_by
)
values (
    '56700000-0000-4000-8000-000000000006',
    '56700000-0000-4000-8000-000000000001',
    'test merchant',
    10,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);

create temporary table test_frequent_category_context on commit drop as
select
    l.id as ledger_id,
    lm.user_id,
    a.id as account_id,
    c.id as category_id,
    m.id as merchant_id
from public.ledger l
join public.ledger_member lm
  on lm.ledger_id = l.id
 and lm.status = 'active'
join public.app_user u
  on u.id = lm.user_id
 and u.status = 'active'
join lateral (
    select account.id
    from public.account account
    where account.ledger_id = l.id
      and account.is_archived = false
    order by account.created_at, account.id
    limit 1
) a on true
join lateral (
    select category.id
    from public.category category
    where category.ledger_id = l.id
      and category.parent_id is not null
      and category.is_archived = false
    order by category.created_at, category.id
    limit 1
) c on true
join lateral (
    select merchant.id
    from public.merchant merchant
    where merchant.ledger_id = l.id
      and merchant.is_archived = false
    order by merchant.created_at, merchant.id
    limit 1
) m on true
where l.id = '56700000-0000-4000-8000-000000000001';

grant select on test_frequent_category_context to authenticated;

select set_config(
    'request.jwt.claim.sub',
    (select user_id::text from test_frequent_category_context),
    true
);

-- 每张记录只创建一条明细，便于直接验证明细行数量。
create function pg_temp.insert_frequent_category_items(
    p_month timestamptz,
    p_count integer,
    p_status text default 'active',
    p_type text default 'normal',
    p_category_id uuid default null
)
returns void
language plpgsql
as $$
declare
    v_context record;
begin
    select * into v_context from test_frequent_category_context;

    insert into public.transaction_record (
        id, ledger_id, type, status, transaction_at, merchant_id, title,
        created_by, updated_by, deleted_by, deleted_at
    )
    select
        gen_random_uuid(),
        v_context.ledger_id,
        p_type,
        'active',
        p_month + make_interval(days => value),
        v_context.merchant_id,
        'frequent category test',
        v_context.user_id,
        v_context.user_id,
        null,
        null
    from generate_series(1, p_count) value;

    insert into public.transaction_item (
        ledger_id, transaction_record_id, account_id, category_id,
        amount, discount_amount, balance_delta, note, sort_order,
        created_by, updated_by
    )
    select
        tr.ledger_id,
        tr.id,
        v_context.account_id,
        coalesce(p_category_id, v_context.category_id),
        100,
        0,
        -100,
        null,
        0,
        v_context.user_id,
        v_context.user_id
    from public.transaction_record tr
    where tr.ledger_id = v_context.ledger_id
      and tr.title = 'frequent category test'
      and tr.transaction_at >= p_month
      and tr.transaction_at < p_month + interval '1 month'
      and not exists (
          select 1
          from public.transaction_item ti
          where ti.transaction_record_id = tr.id
      );

    if p_status = 'deleted' then
        update public.transaction_record tr
        set
            status = 'deleted',
            deleted_by = v_context.user_id,
            deleted_at = now()
        where tr.ledger_id = v_context.ledger_id
          and tr.title = 'frequent category test'
          and tr.transaction_at >= p_month
          and tr.transaction_at < p_month + interval '1 month';
    end if;
end;
$$;

select pg_temp.insert_frequent_category_items('2026-08-01 00:00:00+09', 26);
set local role authenticated;
select is(
    (
        select sum(occurrence_count)::integer
        from public.load_frequent_transaction_category_counts(
            (select ledger_id from test_frequent_category_context),
            '2026-08-01 00:00:00+09',
            '2026-09-01 00:00:00+09',
            20
        )
    ),
    26,
    '当前月达到阈值时纳入当前完整月份'
);

reset role;
delete from public.transaction_item where transaction_record_id in (
    select id from public.transaction_record where title = 'frequent category test'
);
delete from public.transaction_record where title = 'frequent category test';
select pg_temp.insert_frequent_category_items('2026-08-01 00:00:00+09', 12);
select pg_temp.insert_frequent_category_items('2026-07-01 00:00:00+09', 15);
set local role authenticated;
select is(
    (
        select sum(occurrence_count)::integer
        from public.load_frequent_transaction_category_counts(
            (select ledger_id from test_frequent_category_context),
            '2026-08-01 00:00:00+09',
            '2026-09-01 00:00:00+09',
            20
        )
    ),
    27,
    '当前月不足时纳入两个完整月份'
);

reset role;
delete from public.transaction_item where transaction_record_id in (
    select id from public.transaction_record where title = 'frequent category test'
);
delete from public.transaction_record where title = 'frequent category test';
select pg_temp.insert_frequent_category_items('2026-08-01 00:00:00+09', 5);
select pg_temp.insert_frequent_category_items('2026-07-01 00:00:00+09', 6);
select pg_temp.insert_frequent_category_items('2026-06-01 00:00:00+09', 14);
set local role authenticated;
select is(
    (
        select sum(occurrence_count)::integer
        from public.load_frequent_transaction_category_counts(
            (select ledger_id from test_frequent_category_context),
            '2026-08-01 00:00:00+09',
            '2026-09-01 00:00:00+09',
            20
        )
    ),
    25,
    '跨三个月达到阈值后停止回溯'
);

reset role;
delete from public.transaction_item where transaction_record_id in (
    select id from public.transaction_record where title = 'frequent category test'
);
delete from public.transaction_record where title = 'frequent category test';
select pg_temp.insert_frequent_category_items('2026-08-01 00:00:00+09', 10);
select pg_temp.insert_frequent_category_items('2026-07-01 00:00:00+09', 8);
set local role authenticated;
select is_empty(
    $$
        select *
        from public.load_frequent_transaction_category_counts(
            (select ledger_id from test_frequent_category_context),
            '2026-08-01 00:00:00+09',
            '2026-09-01 00:00:00+09',
            20
        )
    $$,
    '全部历史不足阈值时返回 fallback 信号'
);

reset role;
delete from public.transaction_item where transaction_record_id in (
    select id from public.transaction_record where title = 'frequent category test'
);
delete from public.transaction_record where title = 'frequent category test';
set local role authenticated;

select is_empty(
    $$
        select *
        from public.load_frequent_transaction_category_counts(
            (select ledger_id from test_frequent_category_context),
            '2026-08-01 00:00:00+09',
            '2026-09-01 00:00:00+09',
            20
        )
    $$,
    '完全没有历史时返回 fallback 信号'
);

reset role;
select pg_temp.insert_frequent_category_items(
    p_month => '2026-08-01 00:00:00+09',
    p_count => 18,
    p_category_id => '56700000-0000-4000-8000-000000000007'
);
update public.category
set
    is_archived = true,
    archived_by = '00000000-0000-4000-8000-000000000031',
    archived_at = now()
where id = '56700000-0000-4000-8000-000000000007';
select pg_temp.insert_frequent_category_items(
    p_month => '2026-08-01 00:00:00+09',
    p_count => 2
);
set local role authenticated;
select is_empty(
    $$
        select *
        from public.load_frequent_transaction_category_counts(
            (select ledger_id from test_frequent_category_context),
            '2026-08-01 00:00:00+09',
            '2026-09-01 00:00:00+09',
            20
        )
    $$,
    '归档分类不占用动态排名的最小样本数'
);

reset role;
delete from public.transaction_item where transaction_record_id in (
    select id from public.transaction_record where title = 'frequent category test'
);
delete from public.transaction_record where title = 'frequent category test';
select pg_temp.insert_frequent_category_items(
    '2026-08-01 00:00:00+09', 20, 'deleted', 'normal'
);
set local role authenticated;
select is_empty(
    $$
        select *
        from public.load_frequent_transaction_category_counts(
            (select ledger_id from test_frequent_category_context),
            '2026-08-01 00:00:00+09',
            '2026-09-01 00:00:00+09',
            20
        )
    $$,
    '已删除记录不进入样本'
);

select is_empty(
    $$
        select *
        from public.load_frequent_transaction_category_counts(
            '00000000-0000-4000-8000-000000000000',
            '2026-08-01 00:00:00+09',
            '2026-09-01 00:00:00+09',
            20
        )
    $$,
    '非账本成员不能读取其他账本历史'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select * from finish();
rollback;
