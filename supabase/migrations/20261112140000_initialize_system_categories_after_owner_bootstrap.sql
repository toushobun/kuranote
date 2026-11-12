-- #944：修正旧建账入口的初始化顺序。
-- 直接 INSERT completed 的触发器发生在 owner member 初始化之前，触发分类权限校验失败；
-- 由受控的 create_ledger_with_owner 在完成初始权限设置后创建系统分类。
drop trigger if exists ledger_system_categories_on_create on public.ledger;

CREATE OR REPLACE FUNCTION "public"."create_ledger_with_owner"("p_name" "text", "p_base_currency" "text" DEFAULT 'JPY'::"text") RETURNS "public"."ledger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
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

    perform public.bootstrap_ledger_owner_member(v_ledger.id, v_user_id);

    perform public.initialize_ledger_default_data(v_ledger.id, v_user_id);

    -- 系统分类必须在 bootstrap_ledger_owner_member 之后建立，
    -- 否则分类管理权限触发器会拒绝尚未完成成员初始化的账本。
    perform public.initialize_ledger_system_categories(v_ledger.id, v_user_id);

    update public.app_user
    set
        current_ledger_id = v_ledger.id,
        updated_by = v_user_id
    where id = v_user_id;

    return v_ledger;
end;
$$;
