begin;

set local search_path = public, extensions;

select plan(30);

update public.ledger
set transaction_item_special_status_enabled = true
where id = '00000000-0000-4000-8000-000000000032';

insert into public.transaction_record (
    id, ledger_id, type, status, transaction_at, merchant_id,
    title, created_by, updated_by
)
select
    ('57410000-0000-4000-8000-' || lpad(sequence_number::text, 12, '0'))::uuid,
    source_record.ledger_id,
    'normal',
    'active',
    '2099-03-01 00:00:00+00'::timestamptz + sequence_number * interval '1 minute',
    source_record.merchant_id,
    'Issue 574 PR1 关联编辑测试 ' || sequence_number,
    '00000000-0000-4000-8000-000000000031',
    '00000000-0000-4000-8000-000000000031'
from public.transaction_record source_record
cross join generate_series(1, 4) sequence_number
where source_record.id = '00000000-0000-4000-8000-000000009001';

select tests.insert_normal_transaction_items(jsonb_agg(item))
from (
values
    (
        '57420000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000032',
        '57410000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        100, 0, -100, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        'pending_reimbursement'
    ),
    (
        '57420000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000032',
        '57410000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        120, 0, 120, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        null
    ),
    (
        '57420000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000032',
        '57410000-0000-4000-8000-000000000003',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005021',
        100, 0, -100, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        null
    ),
    (
        '57420000-0000-4000-8000-000000000004',
        '00000000-0000-4000-8000-000000000032',
        '57410000-0000-4000-8000-000000000004',
        '00000000-0000-4000-8000-000000000043',
        '00000000-0000-4000-8000-000000005002',
        50, 0, 50, 0,
        '00000000-0000-4000-8000-000000000031',
        '00000000-0000-4000-8000-000000000031',
        '2090-01-01 00:00:00+00', '2090-01-01 00:00:00+00',
        null
    )
) item(
    id, ledger_id, transaction_record_id, account_id, category_id, amount, discount_amount, balance_delta, sort_order, created_by, updated_by, created_at, updated_at, special_status
);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '57420000-0000-4000-8000-000000000002',
            jsonb_build_object(
                'reimbursementItemId',
                '57420000-0000-4000-8000-000000000001'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '建立超额报销关联后可进入关联编辑场景'
);

-- #899：创建退款时允许不同账户，但币种必须一致。
update public.transaction_item
set account_id = '00000000-0000-4000-8000-000000000042'
where id = '57420000-0000-4000-8000-000000000004';
select tests.sync_normal_transaction_payments(array['57410000-0000-4000-8000-000000000004'::uuid]);

select throws_ok(
    $$select public.apply_transaction_item_links(
        '00000000-0000-4000-8000-000000000032',
        '57420000-0000-4000-8000-000000000004',
        '{"refundedItemId":"57420000-0000-4000-8000-000000000003"}'::jsonb,
        '00000000-0000-4000-8000-000000000031'
    )$$,
    '22023', 'refund_currency_mismatch',
    '不同币种账户不能创建退款关联'
);

update public.transaction_item
set account_id = '00000000-0000-4000-8000-000000000044'
where id = '57420000-0000-4000-8000-000000000004';
select tests.sync_normal_transaction_payments(array['57410000-0000-4000-8000-000000000004'::uuid]);

select lives_ok(
    $$
        select public.apply_transaction_item_links(
            '00000000-0000-4000-8000-000000000032',
            '57420000-0000-4000-8000-000000000004',
            jsonb_build_object(
                'refundedItemId',
                '57420000-0000-4000-8000-000000000003'
            ),
            '00000000-0000-4000-8000-000000000031'
        )
    $$,
    '不同账户同币种可以创建退款关联'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000001'
    ),
    'reimbursement_surplus'::public.transaction_item_special_status,
    '初始超额报销把母项推导为核销结余'
);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select lives_ok(
    $$
        select tests.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000002',
            '57420000-0000-4000-8000-000000000002',
            '2090-01-01 00:00:00+00',
            80,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005002'
        )
    $$,
    '编辑已关联报销收入时直接覆盖收入金额与关联金额'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '57420000-0000-4000-8000-000000000002'
    ),
    80::numeric,
    '报销关联金额直接等于收入新金额'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000001'
    ),
    'pending_reimbursement'::public.transaction_item_special_status,
    '关联金额减少后可从核销结余回落为待报销'
);

select is(
    (
        select amount
        from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000002'
    ),
    80::numeric,
    '已关联收入本体金额与关联金额同步更新'
);

select lives_ok(
    $$
        select tests.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000001',
            '57420000-0000-4000-8000-000000000001',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000001'),
            80,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005021'
        )
    $$,
    '母项 base 金额可直接改到与累计核销额相等'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000001'
    ),
    'reimbursed'::public.transaction_item_special_status,
    '母项 base 金额与核销额相等时推导为恰好结清'
);

select is(
    (
        select reimbursement_amount
        from public.transaction_item_reimbursement_link
        where reimbursement_income_item_id =
              '57420000-0000-4000-8000-000000000002'
    ),
    80::numeric,
    '编辑母项金额不会改动已有子项关联金额'
);

select lives_ok(
    $$
        select tests.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000001',
            '57420000-0000-4000-8000-000000000001',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000001'),
            60,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005021'
        )
    $$,
    '母项 base 金额小于累计核销额时仍允许保存'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000001'
    ),
    'reimbursement_surplus'::public.transaction_item_special_status,
    '母项净额转正后推导为核销结余'
);

select lives_ok(
    $$
        select tests.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000001',
            '57420000-0000-4000-8000-000000000001',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000001'),
            100,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005021'
        )
    $$,
    '母项 base 金额再次增大时允许从核销结余反向回落'
);

select is(
    (
        select special_status
        from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000001'
    ),
    'pending_reimbursement'::public.transaction_item_special_status,
    '核销结余可双向回落到待报销'
);

select throws_ok(
    $$
        select tests.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000001',
            '57420000-0000-4000-8000-000000000001',
            '2000-01-01 00:00:00+00',
            101,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005021'
        )
    $$,
    'P0001',
    'transaction_item_version_conflict',
    'updated_at 版本过期时稳定返回并发冲突'
);

select throws_ok(
    $$
        select tests.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000001',
            '57420000-0000-4000-8000-000000000001',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000001'),
            100,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005002'
        )
    $$,
    '22023',
    'special_status_invalid',
    '母项分类不能改成收入分类以破坏报销语义'
);

select throws_ok(
    $$
        select tests.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000002',
            '57420000-0000-4000-8000-000000000002',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000002'),
            80,
            '00000000-0000-4000-8000-000000000043',
            '00000000-0000-4000-8000-000000005021'
        )
    $$,
    '22023',
    'income_link_category_invalid',
    '已关联收入不能改成支出分类'
);

select throws_ok(
    $$
        select tests.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000002',
            '57420000-0000-4000-8000-000000000002',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000002'),
            80,
            '00000000-0000-4000-8000-000000000042',
            '00000000-0000-4000-8000-000000005002'
        )
    $$,
    '22023',
    'reimbursement_currency_mismatch',
    '报销收入换到不同币种账户时拒绝保存'
);

select throws_ok(
    $$
        select tests.update_linked_transaction_item(
            '00000000-0000-4000-8000-000000000032',
            '57410000-0000-4000-8000-000000000004',
            '57420000-0000-4000-8000-000000000004',
            (select updated_at from public.transaction_item
             where id = '57420000-0000-4000-8000-000000000004'),
            50,
            '00000000-0000-4000-8000-000000000042',
            '00000000-0000-4000-8000-000000005002'
        )
    $$,
    '22023',
    'refund_currency_mismatch',
    '退款收入换到不同币种账户时拒绝保存'
);

select throws_ok(
    $$
        update public.transaction_item
        set special_status = null
        where id = '57420000-0000-4000-8000-000000000001'
    $$,
    'P0001',
    'reimbursement_link_exists',
    '母项仍有报销关联时不能直接清除待报销流程标记'
);

-- 收入和目标两侧都经过编辑 RPC，币种不同则由触发器拒绝。
select throws_ok(
    format(
        'select tests.update_linked_transaction_item(%L, %L, %L, %L, %s, %L, %L)',
        item.ledger_id, item.transaction_record_id, item.id, item.updated_at,
        item.amount, '00000000-0000-4000-8000-000000000042', item.category_id
    ),
    '22023', 'refund_currency_mismatch',
    '退款目标支出不能切换到不同币种账户'
)
from public.transaction_item item
where item.id = '57420000-0000-4000-8000-000000000003';

create temp table refund_balance_before as
select id, current_balance from public.account
where id in ('00000000-0000-4000-8000-000000000043', '00000000-0000-4000-8000-000000000044');

select lives_ok(
    format(
        'select tests.update_linked_transaction_item(%L, %L, %L, %L, %s, %L, %L)',
        item.ledger_id, item.transaction_record_id, item.id, item.updated_at,
        item.amount,
        case when item.id = '57420000-0000-4000-8000-000000000003'::uuid
             then '00000000-0000-4000-8000-000000000044'
             else '00000000-0000-4000-8000-000000000043' end,
        item.category_id
    ),
    '退款关联两侧均允许切换同币种账户：' || item.id
)
from public.transaction_item item
where item.id in (
    '57420000-0000-4000-8000-000000000003',
    '57420000-0000-4000-8000-000000000004'
)
order by item.id;

select is(account_id,
    case when id = '57420000-0000-4000-8000-000000000003'::uuid
         then '00000000-0000-4000-8000-000000000044'::uuid
         else '00000000-0000-4000-8000-000000000043'::uuid end,
    '同币种账户切换已持久化：' || id)
from public.transaction_item
where id in (
    '57420000-0000-4000-8000-000000000003',
    '57420000-0000-4000-8000-000000000004'
);

select is(
    (select refund_amount from public.transaction_item_refund_link
     where refund_income_item_id = '57420000-0000-4000-8000-000000000004'),
    50::numeric,
    '切换账户不改变退款核销金额'
);

select is(account.current_balance - before.current_balance,
    case when account.id = '00000000-0000-4000-8000-000000000043'::uuid
         then 150::numeric else -150::numeric end,
    '退款两侧切换账户后余额按真实收支迁移：' || account.id)
from public.account account
join refund_balance_before before on before.id = account.id;

reset role;

select throws_ok(
    $$
        delete from public.transaction_item
        where id = '57420000-0000-4000-8000-000000000003'
    $$,
    'P0001',
    'linked_transaction_edit_forbidden',
    '仍有关联的母项不能直接删除'
);

select * from finish();
rollback;
