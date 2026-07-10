-- 为账本创建包装 RPC 调用的底层函数补充稳定业务错误码。
-- 保持原有业务逻辑、SQLSTATE、函数签名与执行权限不变。

create or replace function public.create_ledger_with_owner(
    p_name text,
    p_base_currency text default 'JPY'
)
returns public.ledger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_ledger public.ledger;
begin
    v_user_id = auth.uid();

    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if not exists (
        select 1
        from public.app_user au
        where au.id = v_user_id
          and au.status = 'active'
    ) then
        raise exception 'user_inactive'
            using errcode = '42501', detail = 'user_inactive';
    end if;

    insert into public.ledger (
        name,
        base_currency,
        owner_user_id,
        created_by,
        updated_by
    )
    values (
        p_name,
        p_base_currency,
        v_user_id,
        v_user_id,
        v_user_id
    )
    returning * into v_ledger;

    insert into public.ledger_member (
        ledger_id,
        user_id,
        role,
        status,
        invited_by,
        invited_at,
        joined_at,
        created_by,
        updated_by
    )
    values (
        v_ledger.id,
        v_user_id,
        'owner',
        'active',
        v_user_id,
        now(),
        now(),
        v_user_id,
        v_user_id
    );

    perform public.initialize_ledger_default_data(v_ledger.id, v_user_id);

    update public.app_user
    set
        current_ledger_id = v_ledger.id,
        updated_by = v_user_id
    where id = v_user_id;

    return v_ledger;
end;
$$;

revoke all on function public.create_ledger_with_owner(text, text) from public;
revoke all on function public.create_ledger_with_owner(text, text) from anon;
grant execute on function public.create_ledger_with_owner(text, text) to authenticated;
