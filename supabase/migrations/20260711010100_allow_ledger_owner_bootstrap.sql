-- create_ledger_with_owner 在首个 ledger_member 写入前还不存在可用于权限判断的成员行。
-- 仅允许账本 owner 为自己补齐唯一的 active owner 行，其他成员写入仍要求 owner/admin。
create or replace function public.enforce_ledger_member_management_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_ledger_id uuid;
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    v_ledger_id := case when tg_op = 'INSERT' then new.ledger_id else old.ledger_id end;

    if tg_op = 'INSERT'
       and new.user_id = auth.uid()
       and new.role = 'owner'
       and new.status = 'active'
       and exists (
           select 1
           from public.ledger l
           where l.id = new.ledger_id
             and l.owner_user_id = auth.uid()
             and not exists (
                 select 1
                 from public.ledger_member existing_member
                 where existing_member.ledger_id = l.id
             )
       ) then
        return new;
    end if;

    if tg_op = 'UPDATE'
       and old.user_id = auth.uid()
       and new.user_id = old.user_id
       and new.ledger_id = old.ledger_id
       and old.status = 'invited'
       and new.status = 'active'
       and new.role = old.role
       and new.joined_at is not null
       and new.removed_at is null
       and new.removed_by is null then
        return new;
    end if;

    if not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

revoke all on function public.enforce_ledger_member_management_permission() from public;
revoke all on function public.enforce_ledger_member_management_permission() from anon;
revoke all on function public.enforce_ledger_member_management_permission() from authenticated;
