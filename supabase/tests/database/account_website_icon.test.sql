begin;
set local search_path = public, extensions;
select no_plan();

select col_type_is('public', 'account', 'website_url', 'text', '账户网址为文本');
select col_type_is('public', 'account', 'icon_url', 'text', '账户图标为文本');
select col_is_null('public', 'account', 'website_url', '账户网址可省略');
select col_is_null('public', 'account', 'icon_url', '账户图标可省略');

select ok(not has_function_privilege('anon', 'public.create_account_with_holders(uuid,text,text,text,numeric,uuid[],uuid,text,text)', 'execute'), '匿名用户不能调用创建 RPC');
select ok(not has_function_privilege('anon', 'public.update_account_with_balance_adjustment(uuid,uuid,text,text,text,uuid[],numeric,text,uuid,text,text)', 'execute'), '匿名用户不能调用更新 RPC');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000031', true);
set local role authenticated;
select lives_ok($$
    select public.create_account_with_holders(
        '00000000-0000-4000-8000-000000000032', '网站图标测试', 'bank', 'JPY', 0,
        p_website_url := 'https://example.com', p_icon_url := 'https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fexample.com'
    )
$$, '所有者可创建带网址和图标的账户');
select is((select website_url from public.account where name = '网站图标测试'), 'https://example.com', '创建保存网址');
select is((select icon_url from public.account where name = '网站图标测试'), 'https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fexample.com', '创建保存图标');

select throws_ok($$
    update public.account set website_url = 'ftp://example.com' where name = '网站图标测试'
$$, '23514', 'new row for relation "account" violates check constraint "account_website_url_check"', '直接更新拒绝非 HTTP(S) 网址');
select throws_ok($$
    update public.account set icon_url = 'http://example.com/tracker.png' where name = '网站图标测试'
$$, '23514', 'new row for relation "account" violates check constraint "account_icon_url_check"', '直接更新拒绝 HTTP 图标');
select throws_ok($$
    select public.create_account_with_holders(
        '00000000-0000-4000-8000-000000000032', '非法网站图标测试', 'bank', 'JPY', 0,
        p_website_url := 'https://example.com', p_icon_url := 'data:image/png;base64,AA=='
    )
$$, '23514', 'new row for relation "account" violates check constraint "account_icon_url_check"', '创建 RPC 拒绝 data URL 图标');
select throws_ok($$
    select public.update_account_with_balance_adjustment(
        ledger_id, id, '非法更新', type, currency, '{}', 100,
        p_website_url := 'https://example.com', p_icon_url := 'http://example.com/icon.png'
    )
    from public.account where name = '网站图标测试'
$$, '23514', 'new row for relation "account" violates check constraint "account_icon_url_check"', '更新 RPC 拒绝 HTTP 图标并回滚账户修改');
select is((select count(*) from public.account where name = '网站图标测试'), 1::bigint, '更新失败后保留原账户名称');

select lives_ok($$
    select public.update_account_with_balance_adjustment(
        ledger_id, id, name, type, currency, '{}', 100,
        p_website_url := 'https://example.org'
    )
    from public.account where name = '网站图标测试'
$$, '更新网址并原子调整余额');
select is((select website_url from public.account where name = '网站图标测试'), 'https://example.org', '更新保存新网址');
select is((select icon_url from public.account where name = '网站图标测试'), null::text, '更新可以清除旧图标');
select is((select current_balance from public.account where name = '网站图标测试'), 100::numeric, '同时保存目标余额');

select lives_ok($$
    select public.update_account_with_balance_adjustment(
        ledger_id, id, name, type, currency, '{}', p_website_url := ''
    )
    from public.account where name = '网站图标测试'
$$, '清空网址仍可保存');
select is((select website_url from public.account where name = '网站图标测试'), null::text, '空网址存为 NULL');

select * from finish();
rollback;
