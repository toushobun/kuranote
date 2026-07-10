-- 创建账本、当前用户成员设置与默认现金账户。
-- 复用既有 create_ledger_with_owner 完成账本、owner、默认分类等数据和 current ledger 初始化，
-- 本函数补充 #383 创建页新增的显示名、个性色和默认账户设置。
create or replace function public.create_ledger_with_owner_settings(
    p_name text,
    p_base_currency text,
    p_display_name text,
    p_display_color text
)
returns public.ledger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_ledger public.ledger;
    v_account_id uuid;
begin
    v_user_id = auth.uid();

    if v_user_id is null then
        raise exception 'auth_required' using errcode = '42501';
    end if;

    if p_name is null or btrim(p_name) = '' then
        raise exception 'ledger_name_required' using errcode = '22023';
    end if;

    if length(btrim(p_name)) > 100 then
        raise exception 'ledger_name_too_long' using errcode = '22023';
    end if;

    if p_base_currency is null
       or upper(btrim(p_base_currency)) not in (
           'CNY', 'JPY', 'USD', 'EUR', 'GBP', 'KRW', 'THB'
       ) then
        raise exception 'currency_invalid' using errcode = '22023';
    end if;

    if p_display_name is null or btrim(p_display_name) = '' then
        raise exception 'display_name_required' using errcode = '22023';
    end if;

    if length(btrim(p_display_name)) > 100 then
        raise exception 'display_name_too_long' using errcode = '22023';
    end if;

    if p_display_color is null
       or btrim(p_display_color) not in (
           'jade',
           'aqua',
           'sky',
           'indigo',
           'lavender',
           'magenta',
           'sakura',
           'rose',
           'amber',
           'lime'
       ) then
        raise exception 'display_color_invalid' using errcode = '22023';
    end if;

    v_ledger = public.create_ledger_with_owner(
        btrim(p_name),
        upper(btrim(p_base_currency))
    );

    insert into public.ledger_member_display_setting (
        ledger_id,
        user_id,
        display_name,
        display_color,
        created_by,
        updated_by
    ) values (
        v_ledger.id,
        v_user_id,
        btrim(p_display_name),
        btrim(p_display_color),
        v_user_id,
        v_user_id
    )
    on conflict (ledger_id, user_id)
    do update set
        display_name = excluded.display_name,
        display_color = excluded.display_color,
        updated_by = v_user_id;

    insert into public.account (
        ledger_id,
        name,
        type,
        currency,
        initial_balance,
        sort_order,
        created_by,
        updated_by
    ) values (
        v_ledger.id,
        '现金',
        'cash',
        upper(btrim(p_base_currency)),
        0,
        0,
        v_user_id,
        v_user_id
    )
    returning id into v_account_id;

    insert into public.account_holder (
        ledger_id,
        account_id,
        user_id,
        role,
        created_by,
        updated_by
    ) values (
        v_ledger.id,
        v_account_id,
        v_user_id,
        'owner',
        v_user_id,
        v_user_id
    );

    return v_ledger;
end;
$$;

-- 新建账本统一经过带成员设置和默认账户初始化的 RPC，避免旧入口生成半初始化账本。
revoke execute on function public.create_ledger_with_owner(text, text) from authenticated;

revoke all on function public.create_ledger_with_owner_settings(text, text, text, text) from public;
revoke all on function public.create_ledger_with_owner_settings(text, text, text, text) from anon;
grant execute on function public.create_ledger_with_owner_settings(text, text, text, text) to authenticated;
