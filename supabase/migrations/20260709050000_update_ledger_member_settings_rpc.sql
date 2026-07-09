-- 账本成员设置保存 RPC。
-- owner/admin 可以维护成员的当前账本昵称、个性色与权限。
-- 普通 active 成员可以维护自己的当前账本昵称和个性色，但不能修改权限。

alter table public.ledger_member_display_setting
    add column if not exists display_name text;

alter table public.ledger_member_display_setting
    drop constraint if exists ledger_member_display_setting_display_name_check;

alter table public.ledger_member_display_setting
    add constraint ledger_member_display_setting_display_name_check
    check (
        display_name is null
        or (
            btrim(display_name) <> ''
            and length(btrim(display_name)) <= 100
        )
    );

comment on column public.ledger_member_display_setting.display_name
    is '当前账本内使用的成员昵称。为空时回退到 app_user.display_name。';

-- 既存 trigger 默认仍禁止直接改 ledger_member.role。
-- 专用 RPC 会在事务内通过本地 setting 打开一次角色变更权限。
create or replace function public.prevent_ledger_member_identity_change()
returns trigger
language plpgsql
as $$
begin
    if old.id <> new.id then
        raise exception '不允许修改账本成员 id';
    end if;

    if old.ledger_id <> new.ledger_id then
        raise exception '不允许修改账本成员所属账本';
    end if;

    if old.user_id <> new.user_id then
        raise exception '不允许修改账本成员用户';
    end if;

    if old.role <> new.role
       and coalesce(current_setting('app.allow_ledger_member_role_change', true), '') <> 'on' then
        raise exception '不允许直接修改账本成员角色';
    end if;

    return new;
end;
$$;

create or replace function public.update_ledger_member_settings(
    p_ledger_id uuid,
    p_member_user_id uuid,
    p_display_name text,
    p_display_color text,
    p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_actor_id uuid;
    v_actor_role text;
    v_current_role text;
    v_can_manage_member boolean;
begin
    v_actor_id = auth.uid();

    if v_actor_id is null then
        raise exception 'auth_required' using errcode = '42501';
    end if;

    select lm.role
      into v_actor_role
      from public.ledger_member lm
      join public.app_user au
        on au.id = lm.user_id
     where lm.ledger_id = p_ledger_id
       and lm.user_id = v_actor_id
       and lm.status = 'active'
       and au.status = 'active';

    if not found then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    v_can_manage_member = v_actor_role in ('owner', 'admin');

    if not v_can_manage_member and v_actor_id <> p_member_user_id then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if p_display_name is null or btrim(p_display_name) = '' then
        raise exception 'display_name_required' using errcode = '22023';
    end if;

    if length(btrim(p_display_name)) > 100 then
        raise exception 'display_name_too_long' using errcode = '22023';
    end if;

    if p_display_color not in (
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

    if p_role not in ('owner', 'admin', 'member', 'viewer') then
        raise exception 'role_invalid' using errcode = '22023';
    end if;

    select lm.role
      into v_current_role
      from public.ledger_member lm
      join public.app_user au
        on au.id = lm.user_id
     where lm.ledger_id = p_ledger_id
       and lm.user_id = p_member_user_id
       and lm.status = 'active'
       and au.status = 'active'
     for update of lm;

    if not found then
        raise exception 'member_not_found' using errcode = '22023';
    end if;

    if not v_can_manage_member and p_role <> v_current_role then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    -- 所有者权限转移需要单独设计，避免误操作导致无 owner 或多 owner。
    if (v_current_role = 'owner' and p_role <> 'owner')
       or (v_current_role <> 'owner' and p_role = 'owner') then
        raise exception 'role_invalid' using errcode = '22023';
    end if;

    insert into public.ledger_member_display_setting (
        ledger_id,
        user_id,
        display_name,
        display_color,
        created_by,
        updated_by
    ) values (
        p_ledger_id,
        p_member_user_id,
        btrim(p_display_name),
        p_display_color,
        v_actor_id,
        v_actor_id
    )
    on conflict (ledger_id, user_id)
    do update set
        display_name = excluded.display_name,
        display_color = excluded.display_color,
        updated_by = v_actor_id;

    if v_can_manage_member and p_role <> v_current_role then
        perform set_config('app.allow_ledger_member_role_change', 'on', true);

        update public.ledger_member
           set role = p_role,
               updated_by = v_actor_id
         where ledger_id = p_ledger_id
           and user_id = p_member_user_id
           and status = 'active';

        perform set_config('app.allow_ledger_member_role_change', 'off', true);
    end if;
end;
$$;

revoke all on function public.update_ledger_member_settings(uuid, uuid, text, text, text) from public;
revoke all on function public.update_ledger_member_settings(uuid, uuid, text, text, text) from anon;
grant execute on function public.update_ledger_member_settings(uuid, uuid, text, text, text) to authenticated;
