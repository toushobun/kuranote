alter table public.account
    add column website_url text,
    add column icon_url text,
    add constraint account_website_url_check check (website_url is null or website_url ~ '^https?://'),
    add constraint account_icon_url_check check (icon_url is null or icon_url ~ '^https://');

drop function public.create_account_with_holders(uuid, text, text, text, numeric, uuid[], uuid);

CREATE OR REPLACE FUNCTION public.create_account_with_holders(p_ledger_id uuid, p_name text, p_type text, p_currency text, p_initial_balance numeric, p_holder_user_ids uuid[] DEFAULT '{}'::uuid[], p_placeholder_id uuid DEFAULT NULL::uuid, p_website_url text DEFAULT NULL, p_icon_url text DEFAULT NULL) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid;
    v_account_id uuid;
    v_holder_user_ids uuid[];
    v_active_holder_user_ids uuid[];
begin
    v_user_id = auth.uid();

    perform public.lock_account_holder_placeholders(p_ledger_id, null, p_placeholder_id);

    select coalesce(array_agg(distinct holder_user_id), '{}'::uuid[])
    into v_holder_user_ids
    from unnest(coalesce(p_holder_user_ids, '{}'::uuid[])) as holder_user_ids(holder_user_id);

    if cardinality(v_holder_user_ids) > 1 then
        raise exception 'account can have at most one holder';
    end if;

    if p_placeholder_id is not null and cardinality(v_holder_user_ids) > 0 then
        raise exception 'account_holder_identity_invalid' using errcode = '22023', detail = 'account_holder_identity_invalid';
    end if;

    if cardinality(v_holder_user_ids) > 0 then
        with locked_active_holders as (
            select lm.user_id
            from public.ledger_member lm
            join public.app_user au
              on au.id = lm.user_id
            where lm.ledger_id = p_ledger_id
              and lm.user_id = any(v_holder_user_ids)
              and lm.status = 'active'
              and au.status = 'active'
            for update of lm
        )
        select coalesce(array_agg(user_id), '{}'::uuid[])
        into v_active_holder_user_ids
        from locked_active_holders;

        if cardinality(v_active_holder_user_ids) <> cardinality(v_holder_user_ids) then
            raise exception 'account holders must be active ledger members';
        end if;
    end if;

    insert into public.account (
        ledger_id,
        name,
        type,
        currency,
        website_url,
        icon_url,
        initial_balance,
        sort_order,
        created_by,
        updated_by
    )
    values (
        p_ledger_id,
        p_name,
        p_type,
        p_currency,
        nullif(p_website_url, ''),
        case when nullif(p_website_url, '') is not null then p_icon_url end,
        p_initial_balance,
        0,
        v_user_id,
        v_user_id
    )
    returning id into v_account_id;

    if cardinality(v_holder_user_ids) > 0 then
        insert into public.account_holder (
            ledger_id,
            account_id,
            user_id,
            role,
            created_by,
            updated_by
        )
        select
            p_ledger_id,
            v_account_id,
            holder_user_id,
            'owner',
            v_user_id,
            v_user_id
        from unnest(v_holder_user_ids) as holder_user_ids(holder_user_id);
    end if;

    if p_placeholder_id is not null then
        insert into public.account_holder (ledger_id, account_id, placeholder_id, role, created_by, updated_by)
        values (p_ledger_id, v_account_id, p_placeholder_id, 'owner', v_user_id, v_user_id);
    end if;

    perform public.record_account_initial_balance(v_account_id);

    return v_account_id;
end;
$$;

revoke all on function public.create_account_with_holders(uuid, text, text, text, numeric, uuid[], uuid, text, text) from public, anon, authenticated, service_role;
grant execute on function public.create_account_with_holders(uuid, text, text, text, numeric, uuid[], uuid, text, text) to authenticated;

drop function public.update_account_with_balance_adjustment(uuid, uuid, text, text, text, uuid[], numeric, text, uuid);

CREATE OR REPLACE FUNCTION public.update_account_with_balance_adjustment(p_ledger_id uuid, p_account_id uuid, p_name text, p_type text, p_currency text, p_holder_user_ids uuid[], p_target_balance numeric DEFAULT NULL::numeric, p_adjustment_note text DEFAULT NULL::text, p_placeholder_id uuid DEFAULT NULL::uuid, p_website_url text DEFAULT NULL, p_icon_url text DEFAULT NULL) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'pg_temp'
    AS $$
declare
 v_balance numeric;
 v_delta numeric;
 v_record_id uuid;
 v_user_id uuid := auth.uid();
begin
 if v_user_id is null then
  raise exception 'not_authenticated' using errcode = '28000', detail = 'not_authenticated';
 end if;
 if not public.current_user_can_manage_ledger(p_ledger_id) then
  raise exception 'ledger_forbidden' using errcode = '42501', detail = 'ledger_forbidden';
 end if;
 if p_target_balance is not null and (p_target_balance::text in ('NaN','Infinity','-Infinity') or abs(p_target_balance) >= 1000000000000 or p_target_balance <> round(p_target_balance,2)) then
  raise exception 'account_balance_invalid' using errcode = '22023', detail = 'account_balance_invalid';
 end if;
 if length(p_adjustment_note) > 2000 then
  raise exception 'account_adjustment_note_invalid' using errcode = '22023', detail = 'account_adjustment_note_invalid';
 end if;
 -- 与既有账户资料 RPC 保持锁定顺序，资料更新取得账户行锁后再读取最新余额。
 perform public.update_account_with_holders(p_ledger_id,p_account_id,p_name,p_type,p_currency,p_holder_user_ids,p_placeholder_id);
 if p_website_url is not null then
  update public.account
  set website_url = nullif(p_website_url, ''), icon_url = case when p_website_url <> '' then p_icon_url end
  where id = p_account_id and ledger_id = p_ledger_id;
 end if;
 select current_balance into strict v_balance from public.account where id=p_account_id and ledger_id=p_ledger_id for update;
 v_delta := p_target_balance - v_balance;
 if v_delta is not null and v_delta <> 0 then
  if abs(v_delta) >= 1000000000000 then
   raise exception 'account_balance_invalid' using errcode = '22023', detail = 'account_balance_invalid';
  end if;
  insert into public.transaction_record(ledger_id,type,transaction_at,note,created_by,updated_by)
  values(p_ledger_id,'balance_adjustment',now(),nullif(btrim(p_adjustment_note),''),v_user_id,v_user_id)
  returning id into v_record_id;
  insert into public.transaction_item(ledger_id,transaction_record_id,account_id,amount,balance_delta,created_by,updated_by)
  values(p_ledger_id,v_record_id,p_account_id,abs(v_delta),v_delta,v_user_id,v_user_id);
  perform public.apply_account_balance_delta(p_ledger_id,p_account_id,v_delta,v_user_id);
 end if;
 return p_account_id;
end;
$$;

revoke all on function public.update_account_with_balance_adjustment(uuid, uuid, text, text, text, uuid[], numeric, text, uuid, text, text) from public, anon, authenticated, service_role;
grant execute on function public.update_account_with_balance_adjustment(uuid, uuid, text, text, text, uuid[], numeric, text, uuid, text, text) to authenticated;
