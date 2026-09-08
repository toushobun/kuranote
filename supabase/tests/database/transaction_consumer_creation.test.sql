begin;

set local search_path = public, extensions;

select plan(17);

insert into public.ledger (
    id, name, base_currency, owner_user_id, created_by, updated_by
)
values (
    '71600000-0000-4000-8000-000000000001',
    '消费者创建测试账本',
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
    '71600000-0000-4000-8000-000000000002',
    '71600000-0000-4000-8000-000000000001',
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
    '71600000-0000-4000-8000-000000000003',
    '71600000-0000-4000-8000-000000000001',
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
        '71600000-0000-4000-8000-000000000004',
        '71600000-0000-4000-8000-000000000001',
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
        '71600000-0000-4000-8000-000000000005',
        '71600000-0000-4000-8000-000000000001',
        '71600000-0000-4000-8000-000000000004',
        'expense',
        'test child',
        'Wallet',
        '#000000',
        10,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031'
    );

insert into public.merchant (
    id, ledger_id, name, sort_order, created_by, updated_by
)
values (
    '71600000-0000-4000-8000-000000000006',
    '71600000-0000-4000-8000-000000000001',
    'test merchant',
    10,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);


insert into public.account (id, ledger_id, name, type, currency, initial_balance, sort_order, created_by, updated_by)
values ('71600000-0000-4000-8000-000000000008', '71600000-0000-4000-8000-000000000001', '转账目标', 'cash', 'JPY', 0, 20,
'00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000031');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);

-- 统计真实消费者行写入，确保默认路径不重复删除与插入。
create temporary table consumer_writes (record_id uuid, operation text);
create function pg_temp.capture_consumer_write() returns trigger language plpgsql as $$
begin
    if tg_op = 'DELETE' then
        insert into consumer_writes values (old.transaction_record_id, tg_op);
        return old;
    end if;
    insert into consumer_writes values (new.transaction_record_id, tg_op);
    return new;
end;
$$;
create trigger test_capture_consumer_write after insert or delete on public.transaction_consumer
for each row execute function pg_temp.capture_consumer_write();

create temporary table created_consumer_records (label text, record_id uuid, explicit_consumers boolean);
do $$
declare
    explicit_consumers boolean;
    ids uuid[];
    record_id uuid;
begin
    foreach explicit_consumers in array array[false, true] loop
        ids := case when explicit_consumers then array['00000000-0000-4000-8000-000000000031'::uuid] else null end;
        record_id := public.create_transaction(
            '71600000-0000-4000-8000-000000000001', 'expense', now(),
            '[{"categoryId":"71600000-0000-4000-8000-000000000005","amount":100}]'::jsonb,
            '71600000-0000-4000-8000-000000000003',
            '71600000-0000-4000-8000-000000000006', null, ids
        );
        insert into created_consumer_records values ('普通交易', record_id, explicit_consumers);
        record_id := public.create_transfer_transaction(
            '71600000-0000-4000-8000-000000000001', now(), 100,
            '71600000-0000-4000-8000-000000000003',
            '71600000-0000-4000-8000-000000000008', null, ids
        );
        insert into created_consumer_records values ('转账', record_id, explicit_consumers);
    end loop;
end;
$$;

select is((select count(*) from consumer_writes w where w.record_id = r.record_id and operation = 'INSERT'),
    case when explicit_consumers then 2::bigint else 1::bigint end,
    label || '消费者插入次数，显式指定=' || explicit_consumers)
from created_consumer_records r;
select is((select count(*) from consumer_writes w where w.record_id = r.record_id and operation = 'DELETE'),
    case when explicit_consumers then 1::bigint else 0::bigint end,
    label || '消费者删除次数，显式指定=' || explicit_consumers)
from created_consumer_records r;
select is((select array_agg(c.user_id) from public.transaction_consumer c where c.transaction_record_id = r.record_id),
    array['00000000-0000-4000-8000-000000000031'::uuid],
    label || '消费者归属正确，显式指定=' || explicit_consumers)
from created_consumer_records r;

-- 使用真实请求角色检查表权限与 RLS，不能只在 postgres 角色下验证。
select ok(has_table_privilege('authenticated', 'public.transaction_consumer', 'SELECT'),
    'authenticated 具备消费者表读取权限');
select ok(not has_table_privilege('anon', 'public.transaction_consumer', 'SELECT'),
    '不向匿名用户开放消费者表读取权限');
set local role authenticated;
select is((select count(*) from public.transaction_consumer
    where ledger_id = '71600000-0000-4000-8000-000000000001'), 4::bigint,
    'active 成员使用 authenticated 角色可以读取消费者');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000034', true);
select is((select count(*) from public.transaction_consumer
    where ledger_id = '71600000-0000-4000-8000-000000000001'), 0::bigint,
    '其他账本用户使用 authenticated 角色不能读取消费者');
reset role;
select set_config('request.jwt.claim.sub', '', true);
insert into public.ledger_member (
    id, ledger_id, user_id, role, status, joined_at, removed_at, removed_by, created_by, updated_by
) values (
    '71600000-0000-4000-8000-000000000009',
    '71600000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000034', 'member', 'removed', now(), now(),
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
);
set local role authenticated;
select is((select count(*) from public.transaction_consumer
    where ledger_id = '71600000-0000-4000-8000-000000000001'), 0::bigint,
    '已退出成员使用 authenticated 角色不能读取消费者');
reset role;

select * from finish();
rollback;
