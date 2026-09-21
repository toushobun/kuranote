-- 仅供创建账户的 RPC 与本地 seed 使用；不补写任何存量账户。
-- 初始余额已由账户插入触发器生效，此处只记录，不再次应用余额差值。
create function public.record_account_initial_balance(p_account_id uuid)
returns void
language plpgsql
set search_path to pg_catalog, pg_temp
as $$
declare
    v_account public.account;
    v_record_id uuid;
begin
    select * into strict v_account from public.account where id = p_account_id;
    if v_account.initial_balance = 0 then
        return;
    end if;

    insert into public.transaction_record (
        ledger_id, type, transaction_at, note, created_by, updated_by
    ) values (
        v_account.ledger_id, 'balance_adjustment', v_account.created_at,
        '初始余额', v_account.created_by, v_account.created_by
    ) returning id into v_record_id;

    insert into public.transaction_item (
        ledger_id, transaction_record_id, account_id, amount, balance_delta,
        created_by, updated_by
    ) values (
        v_account.ledger_id, v_record_id, v_account.id,
        abs(v_account.initial_balance), v_account.initial_balance,
        v_account.created_by, v_account.created_by
    );
end;
$$;

-- 不向客户端开放只写记录、不改变余额的内部函数。
revoke all on function public.record_account_initial_balance(uuid) from public, anon, authenticated, service_role;

create or replace function public.create_account_with_holders(
    p_ledger_id uuid,
    p_name text,
    p_type text,
    p_currency text,
    p_initial_balance numeric,
    p_holder_user_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path to pg_catalog, pg_temp
as $$
declare
    v_user_id uuid;
    v_account_id uuid;
    v_holder_user_ids uuid[];
    v_active_holder_user_ids uuid[];
begin
    v_user_id = auth.uid();

    if v_user_id is null then
        raise exception 'must be authenticated';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'current user cannot write this ledger';
    end if;

    select coalesce(array_agg(distinct holder_user_id), '{}'::uuid[])
    into v_holder_user_ids
    from unnest(coalesce(p_holder_user_ids, '{}'::uuid[])) as holder_user_ids(holder_user_id);

    if cardinality(v_holder_user_ids) > 1 then
        raise exception 'account can have at most one holder';
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

    perform public.record_account_initial_balance(v_account_id);

    return v_account_id;
end;
$$;

