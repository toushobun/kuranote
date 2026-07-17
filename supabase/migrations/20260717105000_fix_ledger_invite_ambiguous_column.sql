-- Issue #464：accept_ledger_invite 的返回列 ledger_id 与 ON CONFLICT 冲突目标同名。
-- PostgreSQL 默认将这种 PL/pgSQL 变量 / 表列歧义视为错误，因此在当前函数内明确优先解释为表列。

create or replace function public.accept_ledger_invite(p_token text)
returns table (
    ledger_id uuid,
    ledger_name text,
    result text
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
#variable_conflict use_column
declare
    v_user_id uuid := auth.uid();
    v_token_hash text;
    v_invite public.ledger_invite;
    v_ledger public.ledger;
    v_existing_status text;
    v_result text;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_token is null or btrim(p_token) = '' or length(btrim(p_token)) > 256 then
        raise exception 'invite_invalid'
            using errcode = '22023', detail = 'invite_invalid';
    end if;

    v_token_hash := encode(extensions.digest(btrim(p_token), 'sha256'), 'hex');

    select *
      into v_invite
      from public.ledger_invite li
     where li.token_hash = v_token_hash
     for update;

    if v_invite.id is null or v_invite.revoked_at is not null then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    select *
      into v_ledger
      from public.ledger l
     where l.id = v_invite.ledger_id
       and l.is_archived = false;

    if v_ledger.id is null then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    select lm.status
      into v_existing_status
      from public.ledger_member lm
     where lm.ledger_id = v_invite.ledger_id
       and lm.user_id = v_user_id
       and lm.status <> 'removed';

    if v_existing_status = 'active' then
        v_result := 'already_member';
    else
        if v_invite.accepted_at is not null then
            raise exception 'invite_already_used'
                using errcode = '23505', detail = 'invite_already_used';
        end if;

        perform set_config('app.allow_ledger_invite_accept', 'true', true);

        insert into public.ledger_member (
            ledger_id,
            user_id,
            role,
            status,
            joined_at,
            invited_by,
            created_by,
            updated_by
        ) values (
            v_invite.ledger_id,
            v_user_id,
            v_invite.role,
            'active',
            now(),
            v_invite.inviter_user_id,
            v_invite.inviter_user_id,
            v_user_id
        )
        on conflict (ledger_id, user_id) where status <> 'removed' do update set
            role = excluded.role,
            status = 'active',
            joined_at = now(),
            removed_at = null,
            removed_by = null,
            updated_by = v_user_id;

        perform set_config('app.allow_ledger_invite_accept', 'false', true);

        update public.ledger_invite
           set accepted_at = now(),
               accepted_by = v_user_id,
               invite_token = null
         where id = v_invite.id;

        v_result := 'joined';
    end if;

    update public.app_user
       set current_ledger_id = v_invite.ledger_id,
           updated_by = v_user_id
     where id = v_user_id
       and status = 'active';

    if not found then
        raise exception 'user_inactive'
            using errcode = '42501', detail = 'user_inactive';
    end if;

    return query select v_ledger.id, v_ledger.name, v_result;
end;
$$;

revoke all on function public.accept_ledger_invite(text) from public;
revoke all on function public.accept_ledger_invite(text) from anon;
grant execute on function public.accept_ledger_invite(text) to authenticated;
