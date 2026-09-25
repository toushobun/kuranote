begin;

-- Issue #808 / #816：占位成员功能遗留问题收尾。
-- 两个函数都用 create or replace 重建，签名、返回列与授权保持不变。

-- #808：编辑账户提交「无持有人」时，保留非活跃成员的持有行。
-- 只调整删除条件，其余逻辑（三态、account_holder_changed 复核、锁顺序）与 20260923090000 一致。
create or replace function public.update_account_with_holders(
    p_ledger_id uuid,
    p_account_id uuid,
    p_name text,
    p_type text,
    p_currency text,
    p_holder_user_ids uuid[] default '{}'::uuid[],
    p_placeholder_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path to pg_catalog, pg_temp
as $$
declare
    v_user_id uuid;
    v_old_placeholder_id uuid;
    v_current_placeholder_id uuid;
    v_updated_account_id uuid;
    v_holder_user_ids uuid[];
    v_active_holder_user_ids uuid[];
begin
    v_user_id = auth.uid();

    v_old_placeholder_id := public.lock_account_holder_placeholders(p_ledger_id, p_account_id, p_placeholder_id);

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

    perform 1 from public.account where id = p_account_id and ledger_id = p_ledger_id for update;
    select placeholder_id into v_current_placeholder_id from public.account_holder
    where account_id = p_account_id and ledger_id = p_ledger_id;
    if v_current_placeholder_id is distinct from v_old_placeholder_id then
        raise exception 'account_holder_changed' using errcode = '40001', detail = 'account_holder_changed';
    end if;

    update public.account
    set
        name = p_name,
        type = p_type,
        currency = p_currency,
        updated_by = v_user_id
    where id = p_account_id
      and ledger_id = p_ledger_id
      and is_archived = false
    returning id into v_updated_account_id;

    if v_updated_account_id is null then
        raise exception 'account not found';
    end if;

    -- 三态显式比较，空用户列不会使旧占位漏删；相同身份保留原持有行。
    -- #808：提交「无持有人」时保留非活跃成员（成员非 active 或账号非 active）的持有行，
    -- 表单不能取消这类持有人；提交新的成员或占位时照常替换，保持单持有人。
    delete from public.account_holder h
    where h.ledger_id = p_ledger_id and h.account_id = p_account_id
      and not (
          (p_placeholder_id is not null and h.placeholder_id is not distinct from p_placeholder_id)
          or (p_placeholder_id is null and h.user_id is not null and h.user_id = any(v_holder_user_ids))
      )
      and not (
          p_placeholder_id is null
          and cardinality(v_holder_user_ids) = 0
          and h.user_id is not null
          and not exists (
              select 1
              from public.ledger_member lm
              join public.app_user au
                on au.id = lm.user_id
              where lm.ledger_id = p_ledger_id
                and lm.user_id = h.user_id
                and lm.status = 'active'
                and au.status = 'active'
          )
      );

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
            p_account_id,
            holder_user_id,
            'owner',
            v_user_id,
            v_user_id
        from unnest(v_holder_user_ids) as holder_user_ids(holder_user_id)
        on conflict (account_id, user_id)
        do update set
            role = excluded.role,
            updated_by = excluded.updated_by;
    end if;

    if p_placeholder_id is not null then
        insert into public.account_holder (ledger_id, account_id, placeholder_id, role, created_by, updated_by)
        values (p_ledger_id, p_account_id, p_placeholder_id, 'owner', v_user_id, v_user_id)
        on conflict (account_id) do update set role = excluded.role, updated_by = excluded.updated_by;
    end if;

    return v_updated_account_id;
end;
$$;

-- #816：绑定邀请预览的「已是成员」判断与 accept_ledger_invite 的
-- placeholder_claim_existing_member 保持一致。其余字段与判断顺序不变。
create or replace function public.get_ledger_invite_preview(p_token text)
returns table (
    invite_status text,
    ledger_name text,
    inviter_name text,
    invite_role text,
    is_placeholder_bound boolean,
    placeholder_display_name text
)
language plpgsql stable security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_token_hash text;
begin
    if p_token is null or btrim(p_token) = '' or length(btrim(p_token)) > 256 then
        return query select 'invalid'::text, null::text, null::text, null::text, false, null::text;
        return;
    end if;

    v_token_hash := encode(extensions.digest(btrim(p_token), 'sha256'), 'hex');

    return query
    select
        case
            when auth.uid() is not null and exists (
                select 1
                from public.ledger_member lm
                where lm.ledger_id = li.ledger_id
                  and lm.user_id = auth.uid()
                  -- #816：绑定邀请与接受时一致，未移除成员行（active / invited）都视为已是成员；
                  -- 匿名邀请（历史数据）保持只看 active。
                  and (
                      lm.status = 'active'
                      or (li.placeholder_id is not null and lm.status <> 'removed')
                  )
            ) then 'already_member'
            when li.revoked_at is not null then 'revoked'
            when li.accepted_at is not null then 'accepted'
            when l.is_archived then 'invalid'
            else 'valid'
        end,
        l.name,
        coalesce(
            nullif(btrim(lds.display_name), ''),
            nullif(btrim(au.display_name), ''),
            '账本管理员'
        ),
        li.role,
        bound.is_bound,
        case when bound.is_bound then p.display_name else null::text end
    from public.ledger_invite li
    join public.ledger l on l.id = li.ledger_id
    join public.app_user au on au.id = li.inviter_user_id
    left join public.ledger_member_display_setting lds
      on lds.ledger_id = li.ledger_id
     and lds.user_id = li.inviter_user_id
    left join public.ledger_placeholder_member p
      on p.id = li.placeholder_id
     and p.ledger_id = li.ledger_id
    cross join lateral (
        select (
            p.id is not null
            and p.claimed_by is null
            and li.revoked_at is null
            and li.accepted_at is null
            and not l.is_archived
        ) as is_bound
    ) bound
    where li.token_hash = v_token_hash;

    if not found then
        return query select 'invalid'::text, null::text, null::text, null::text, false, null::text;
    end if;
end;
$$;

commit;
