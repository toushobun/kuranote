-- #1101：候选快速抵消计算须与原视图在候选范围、顺序、结清数上保持一致。
begin;
set local search_path = public, extensions;
select plan(12);

set local role authenticated;
select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}',
    true
);

select is(
    (public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'candidates'
    )->>'totalCount')::integer,
    (select count(*)::integer
     from public.transaction_record tr
     join public.transaction_item_with_refund ti
       on ti.transaction_record_id = tr.id and ti.ledger_id = tr.ledger_id
     join public.category c on c.id = ti.category_id and c.ledger_id = ti.ledger_id
     where tr.ledger_id = '00000000-0000-4000-8000-000000000032'
       and tr.type = 'normal' and tr.status = 'active'
       and c.type = 'expense'
       and ti.amount - ti.refunded_amount - ti.reimbursement_amount > 0),
    '未结清候选总数与原视图保持一致'
);

select is(
    (public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'candidates'
    )->>'settledCount')::integer,
    (select count(*)::integer
     from public.transaction_record tr
     join public.transaction_item_with_refund ti
       on ti.transaction_record_id = tr.id and ti.ledger_id = tr.ledger_id
     join public.category c on c.id = ti.category_id and c.ledger_id = ti.ledger_id
     where tr.ledger_id = '00000000-0000-4000-8000-000000000032'
       and tr.type = 'normal' and tr.status = 'active'
       and c.type = 'expense'
       and ti.amount - ti.refunded_amount - ti.reimbursement_amount <= 0),
    '已结清总数与原视图保持一致'
);

select results_eq(
    $$
      select (entry.value->>'itemId')::uuid
      from jsonb_array_elements(public.load_filtered_transaction_page(
          p_ledger_id => '00000000-0000-4000-8000-000000000032',
          p_scope => 'candidates',
          p_merchant_priority_id => '00000000-0000-4000-8000-000000001001'
      )->'entries') entry
    $$,
    $$
      select ti.id
      from public.transaction_record tr
      join public.transaction_item_with_refund ti
        on ti.transaction_record_id = tr.id and ti.ledger_id = tr.ledger_id
      join public.category c on c.id = ti.category_id and c.ledger_id = ti.ledger_id
      where tr.ledger_id = '00000000-0000-4000-8000-000000000032'
        and tr.type = 'normal' and tr.status = 'active'
        and c.type = 'expense'
        and ti.amount - ti.refunded_amount - ti.reimbursement_amount > 0
      order by
        case when tr.merchant_id = '00000000-0000-4000-8000-000000001001'
             then 0 else 1 end,
        tr.transaction_at desc, tr.created_at desc, tr.id desc,
        ti.sort_order asc nulls last, ti.id asc nulls last
      limit 20
    $$,
    '第一页同商家优先及明细顺序与原视图一致'
);

select results_eq(
    $$
      select (entry.value->>'itemId')::uuid
      from jsonb_array_elements(public.load_filtered_transaction_page(
          p_ledger_id => '00000000-0000-4000-8000-000000000032',
          p_scope => 'candidates', p_settled => true
      )->'entries') entry
    $$,
    $$
      select ti.id
      from public.transaction_record tr
      join public.transaction_item_with_refund ti
        on ti.transaction_record_id = tr.id and ti.ledger_id = tr.ledger_id
      join public.category c on c.id = ti.category_id and c.ledger_id = ti.ledger_id
      where tr.ledger_id = '00000000-0000-4000-8000-000000000032'
        and tr.type = 'normal' and tr.status = 'active'
        and c.type = 'expense'
        and ti.amount - ti.refunded_amount - ti.reimbursement_amount <= 0
      order by tr.transaction_at desc, tr.created_at desc, tr.id desc,
               ti.sort_order asc nulls last, ti.id asc nulls last
      limit 20
    $$,
    '已结清列表与原视图的顺序保持一致'
);

select is(
    (public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'candidates',
        p_special_statuses => array['pending_reimbursement','reimbursed','reimbursement_surplus']
    )->>'totalCount')::integer,
    (select count(*)::integer
     from public.transaction_record tr
     join public.transaction_item_with_refund ti
       on ti.transaction_record_id = tr.id and ti.ledger_id = tr.ledger_id
     join public.category c on c.id = ti.category_id and c.ledger_id = ti.ledger_id
     where tr.ledger_id = '00000000-0000-4000-8000-000000000032'
       and tr.type = 'normal' and tr.status = 'active'
       and c.type = 'expense'
       and ti.special_status::text in ('pending_reimbursement','reimbursed','reimbursement_surplus')
       and ti.amount - ti.refunded_amount - ti.reimbursement_amount > 0),
    '报销候选范围与原视图保持一致'
);

select is(
    (public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'records'
    )->>'totalCount')::integer,
    (select count(*)::integer
     from public.transaction_record tr
     where tr.ledger_id = '00000000-0000-4000-8000-000000000032'
       and tr.status = 'active'
       and tr.type in ('normal','transfer','balance_adjustment')),
    'records 模式继续正常返回总数'
);

-- 使用 seed 已存在的「部分退款」和「退款 + 报销倒赚」验证净额搜索，
-- 避免只有无关联明细时通过，实际开启优化后金额搜索却发生偏差。
select is(
    (select business_net_amount
     from public.transaction_item_with_refund
     where id = '00000000-0000-4000-8000-000000009242'),
    4300::numeric,
    '部分退款的原支出净额是 6800 - 2500 = 4300'
);

select ok(
    exists (
        select 1
        from jsonb_array_elements(public.load_filtered_transaction_page(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_scope => 'candidates',
            p_query => '4300',
            p_merchant_priority_id => '00000000-0000-4000-8000-000000001008'
        )->'entries') entry
        where entry.value->>'itemId' = '00000000-0000-4000-8000-000000009242'
    ),
    '候选金额搜索能命中部分退款后的业务净额'
);

select is(
    (select business_net_amount
     from public.transaction_item_with_refund
     where id = '00000000-0000-4000-8000-000000009283'),
    0::numeric,
    '退款和报销合计倒赚时原支出净额按零截断'
);

select ok(
    exists (
        select 1
        from jsonb_array_elements(public.load_filtered_transaction_page(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_scope => 'candidates',
            p_query => '2000',
            p_settled => true,
            p_merchant_priority_id => '00000000-0000-4000-8000-000000001005'
        )->'entries') entry
        where entry.value->>'itemId' = '00000000-0000-4000-8000-000000009283'
    ),
    '已倒赚的原支出仍能按原始明细金额搜索'
);

select ok(
    not exists (
        select 1
        from jsonb_array_elements(public.load_filtered_transaction_page(
            p_ledger_id => '00000000-0000-4000-8000-000000000032',
            p_scope => 'candidates',
            p_query => '2230',
            p_settled => true,
            p_merchant_priority_id => '00000000-0000-4000-8000-000000001005'
        )->'entries') entry
        where entry.value->>'itemId' = '00000000-0000-4000-8000-000000009283'
    ),
    '收入侧超过原支出的部分不得误算成原支出可搜索净额'
);

select set_config(
    'request.jwt.claims',
    '{"sub":"11010000-0000-4000-8000-000000000999","role":"authenticated"}',
    true
);
select is(
    (public.load_filtered_transaction_page(
        p_ledger_id => '00000000-0000-4000-8000-000000000032',
        p_scope => 'candidates'
    )->>'totalCount')::integer,
    0,
    '非成员无法读取候选数据'
);
select * from finish();
rollback;
