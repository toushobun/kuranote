-- Issue #435：统一既存 SECURITY DEFINER 函数的 search_path。
-- 仅调整函数运行时配置，不修改函数签名、函数体、owner、EXECUTE 权限或业务逻辑。

alter function public.accept_ledger_invitation(uuid)
set search_path to pg_catalog, pg_temp;

alter function public.apply_account_balance_delta(uuid, uuid, numeric, uuid)
set search_path to pg_catalog, pg_temp;

alter function public.assign_ledger_member_default_display_color()
set search_path to pg_catalog, pg_temp;

alter function public.cleanup_ledger_member_display_setting_on_member_leave()
set search_path to pg_catalog, pg_temp;

alter function public.convert_transaction_type(uuid, uuid, text, timestamp with time zone, text, uuid, uuid, jsonb, jsonb, uuid, uuid, numeric)
set search_path to pg_catalog, pg_temp;

alter function public.create_account_with_holders(uuid, text, text, text, numeric, uuid[])
set search_path to pg_catalog, pg_temp;

alter function public.create_ledger_with_owner(text, text)
set search_path to pg_catalog, pg_temp;

alter function public.create_ledger_with_owner_settings(text, text, text, text)
set search_path to pg_catalog, pg_temp;

alter function public.create_transaction(uuid, text, timestamp with time zone, jsonb, uuid, uuid, text, jsonb)
set search_path to pg_catalog, pg_temp;

alter function public.create_transfer_transaction(uuid, timestamp with time zone, numeric, uuid, uuid, text)
set search_path to pg_catalog, pg_temp;

alter function public.current_app_user_is_active()
set search_path to pg_catalog, pg_temp;

alter function public.current_user_can_manage_ledger(uuid)
set search_path to pg_catalog, pg_temp;

alter function public.current_user_can_manage_member_display_setting(uuid)
set search_path to pg_catalog, pg_temp;

alter function public.current_user_can_mutate_transaction(uuid, uuid)
set search_path to pg_catalog, pg_temp;

alter function public.current_user_can_write_ledger(uuid)
set search_path to pg_catalog, pg_temp;

alter function public.current_user_has_ledger_role(uuid, text[])
set search_path to pg_catalog, pg_temp;

alter function public.current_user_is_active_ledger_member(uuid)
set search_path to pg_catalog, pg_temp;

alter function public.enforce_ledger_management_permission()
set search_path to pg_catalog, pg_temp;

alter function public.enforce_ledger_member_management_permission()
set search_path to pg_catalog, pg_temp;

alter function public.enforce_merchant_alias_management_permission()
set search_path to pg_catalog, pg_temp;

alter function public.enforce_transaction_child_permission()
set search_path to pg_catalog, pg_temp;

alter function public.enforce_transaction_record_permission()
set search_path to pg_catalog, pg_temp;

alter function public.get_next_ledger_member_display_color(uuid)
set search_path to pg_catalog, pg_temp;

alter function public.handle_new_auth_user()
set search_path to pg_catalog, pg_temp;

alter function public.initialize_ledger_default_data(uuid, uuid)
set search_path to pg_catalog, pg_temp;

alter function public.load_transaction_group_summaries(uuid, text, timestamp with time zone, timestamp with time zone, text, uuid, uuid, uuid, uuid, uuid, uuid, integer, integer)
set search_path to pg_catalog, pg_temp;

alter function public.normalize_transaction_record_type_for_compat()
set search_path to pg_catalog, pg_temp;

alter function public.prevent_used_category_type_change()
set search_path to pg_catalog, pg_temp;

alter function public.sync_transaction_record_tags(uuid, uuid, jsonb, uuid)
set search_path to pg_catalog, pg_temp;

alter function public.update_account_with_holders(uuid, uuid, text, text, text, uuid[])
set search_path to pg_catalog, pg_temp;

alter function public.update_ledger_member_settings(uuid, uuid, text, text, text)
set search_path to pg_catalog, pg_temp;

alter function public.update_transaction(uuid, uuid, text, timestamp with time zone, jsonb, uuid, uuid, text, jsonb)
set search_path to pg_catalog, pg_temp;

alter function public.update_transfer_transaction(uuid, uuid, timestamp with time zone, numeric, uuid, uuid, text)
set search_path to pg_catalog, pg_temp;

alter function public.validate_ledger_member_display_setting_member()
set search_path to pg_catalog, pg_temp;

alter function public.validate_transaction_item_category_shape()
set search_path to pg_catalog, pg_temp;

alter function public.void_transaction(uuid, uuid)
set search_path to pg_catalog, pg_temp;

-- 全量回放后，public 下全部 SECURITY DEFINER 函数都必须使用统一的安全 search_path。
do $$
declare
    v_unsafe_functions text;
begin
    select string_agg(p.oid::regprocedure::text, ', ' order by p.oid::regprocedure::text)
      into v_unsafe_functions
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prosecdef
       and not (
           'search_path=pg_catalog, pg_temp' = any(
               coalesce(p.proconfig, array[]::text[])
           )
       );

    if v_unsafe_functions is not null then
        raise exception 'SECURITY DEFINER search_path 不符合规范: %', v_unsafe_functions;
    end if;
end;
$$;

-- 对邀请 RPC 使用的 pgcrypto 路径做最小烟雾检查。
do $$
declare
    v_function_definition text;
begin
    if pg_catalog.octet_length(extensions.gen_random_bytes(16)) <> 16 then
        raise exception 'extensions.gen_random_bytes() smoke test failed';
    end if;

    if extensions.digest('kuranote-security-definer-smoke', 'sha256') is null then
        raise exception 'extensions.digest() smoke test failed';
    end if;

    select pg_catalog.pg_get_functiondef(
        'public.create_ledger_invite_v2(uuid,text)'::pg_catalog.regprocedure
    ) into v_function_definition;
    if pg_catalog.strpos(v_function_definition, 'extensions.gen_random_bytes') = 0
       or pg_catalog.strpos(v_function_definition, 'extensions.digest') = 0 then
        raise exception 'create_ledger_invite_v2 pgcrypto schema qualification missing';
    end if;

    select pg_catalog.pg_get_functiondef(
        'public.get_ledger_invite_preview(text)'::pg_catalog.regprocedure
    ) into v_function_definition;
    if pg_catalog.strpos(v_function_definition, 'extensions.digest') = 0 then
        raise exception 'get_ledger_invite_preview pgcrypto schema qualification missing';
    end if;

    select pg_catalog.pg_get_functiondef(
        'public.accept_ledger_invite(text)'::pg_catalog.regprocedure
    ) into v_function_definition;
    if pg_catalog.strpos(v_function_definition, 'extensions.digest') = 0 then
        raise exception 'accept_ledger_invite pgcrypto schema qualification missing';
    end if;

    perform *
      from public.get_ledger_invite_preview('kuranote-security-definer-smoke');
end;
$$;
