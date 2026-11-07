-- #997 草稿唯一持久化入口：保存退出和完成创建都在单一 RPC 事务内。
create or replace function public.commit_ledger_setup(
    p_ledger_id uuid,
    p_expected_updated_at timestamptz,
    p_name text,
    p_base_currency text,
    p_display_name text,
    p_display_color text,
    p_living_region text,
    p_step integer,
    p_draft jsonb,
    p_complete boolean,
    p_payload jsonb
)
returns timestamptz
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_ledger public.ledger;
    v_display public.ledger_member_display_setting;
    v_content_equal boolean;
    v_same_request boolean;
    v_inserted uuid;
    v_constraint text;
    v_updated_at timestamptz;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;
    if not public.current_app_user_is_active() then
        raise exception 'user_inactive'
            using errcode = '42501', detail = 'user_inactive';
    end if;
    perform public.validate_ledger_basic_info(
        p_name, p_base_currency, p_display_name, p_display_color
    );
    if p_living_region is null or p_living_region not in ('jp', 'cn') then
        raise exception 'ledger_setup_region_required'
            using errcode = '22023', detail = 'ledger_setup_region_required';
    end if;
    if p_step is null or p_step < 1 or p_step > 5
       or p_complete is null or (p_complete and p_step <> 5) then
        raise exception 'ledger_setup_step_invalid'
            using errcode = '22023', detail = 'ledger_setup_step_invalid';
    end if;
    if p_draft is null or jsonb_typeof(p_draft) <> 'object' then
        raise exception 'ledger_setup_draft_invalid'
            using errcode = '22023', detail = 'ledger_setup_draft_invalid';
    end if;
    if octet_length(p_draft::text) > public.ledger_setup_draft_max_bytes() then
        raise exception 'ledger_setup_draft_too_large'
            using errcode = '22023', detail = 'ledger_setup_draft_too_large';
    end if;
    if p_draft ->> 'templateRegion' is distinct from p_living_region then
        raise exception 'ledger_setup_region_mismatch'
            using errcode = '22023', detail = 'ledger_setup_region_mismatch';
    end if;

    -- 同一行 ID 上的重试与跨标签页写入使用 FOR UPDATE 串行化。
    select * into v_ledger from public.ledger
     where id = p_ledger_id for update;

    if v_ledger.id is null then
        if p_expected_updated_at is not null then
            raise exception 'ledger_setup_not_found'
                using errcode = '42501', detail = 'ledger_setup_not_found';
        end if;

        begin
            insert into public.ledger (
                id, name, base_currency, living_region, owner_user_id,
                setup_status, setup_step, setup_draft, created_by, updated_by
            ) values (
                p_ledger_id, btrim(p_name), upper(btrim(p_base_currency)),
                p_living_region, v_user_id, 'in_progress', p_step, p_draft,
                v_user_id, v_user_id
            )
            on conflict (id) do nothing
            returning id into v_inserted;
        exception when unique_violation then
            get stacked diagnostics v_constraint = constraint_name;
            if v_constraint = 'ledger_owner_in_progress_setup_key' then
                raise exception 'ledger_setup_in_progress_exists'
                    using errcode = '23505', detail = 'ledger_setup_in_progress_exists';
            end if;
            raise;
        end;

        if v_inserted is not null then
            perform public.bootstrap_ledger_owner_member(p_ledger_id, v_user_id);
            perform public.upsert_ledger_member_display_setting(
                p_ledger_id, v_user_id, p_display_name, p_display_color
            );
            if p_complete then
                perform public.complete_ledger_setup(p_ledger_id, p_payload);
            end if;
            select updated_at into v_updated_at
              from public.ledger where id = p_ledger_id;
            return v_updated_at;
        end if;

        -- 相同 UUID 的并发首次请求：另一个事务可能已提交，重新持锁读取。
        select * into v_ledger from public.ledger
         where id = p_ledger_id for update;
    end if;

    if v_ledger.id is null or v_ledger.owner_user_id is distinct from v_user_id
       or v_ledger.is_archived then
        raise exception 'ledger_setup_not_found'
            using errcode = '42501', detail = 'ledger_setup_not_found';
    end if;
    if v_ledger.setup_status = 'completed' then
        if p_complete then
            -- 已完成账本的相同 ID 重试不能再次初始化账户/商家。
            return v_ledger.updated_at;
        end if;
        raise exception 'ledger_setup_not_in_progress'
            using errcode = '23505', detail = 'ledger_setup_not_in_progress';
    end if;
    if v_ledger.setup_status <> 'in_progress' then
        raise exception 'ledger_setup_not_found'
            using errcode = '42501', detail = 'ledger_setup_not_found';
    end if;
    select * into v_display from public.ledger_member_display_setting
     where ledger_id = p_ledger_id and user_id = v_user_id;
    if v_display.user_id is null then
        raise exception 'ledger_setup_not_found'
            using errcode = '42501', detail = 'ledger_setup_not_found';
    end if;

    v_content_equal :=
        v_ledger.name = btrim(p_name)
        and v_ledger.base_currency = upper(btrim(p_base_currency))
        and v_ledger.living_region = p_living_region
        and v_ledger.setup_draft = p_draft
        and v_display.display_name = btrim(p_display_name)
        and v_display.display_color = btrim(p_display_color);
    v_same_request := v_content_equal and v_ledger.setup_step = p_step;

    if v_ledger.updated_at is distinct from p_expected_updated_at then
        -- 一次保存的响应丢失后以旧版本重试，只接受内容完全一致的请求。
        if not v_same_request then
            raise exception 'ledger_setup_conflict'
                using errcode = '40001', detail = 'ledger_setup_conflict';
        end if;
        if not p_complete then
            return v_ledger.updated_at;
        end if;
    end if;

    if not v_same_request then
        perform set_config('app.allow_ledger_setup_update', 'true', true);
        if v_content_equal then
            -- 无内容变化的退出只保存当前步骤，不重写完整草稿。
            update public.ledger
               set setup_step = p_step, updated_by = v_user_id
             where id = p_ledger_id;
        else
            update public.ledger
               set name = btrim(p_name),
                   base_currency = upper(btrim(p_base_currency)),
                   living_region = p_living_region,
                   setup_draft = p_draft,
                   setup_step = p_step,
                   updated_by = v_user_id
             where id = p_ledger_id;
            perform public.upsert_ledger_member_display_setting(
                p_ledger_id, v_user_id, p_display_name, p_display_color
            );
        end if;
        perform set_config('app.allow_ledger_setup_update', 'false', true);
    end if;

    if p_complete then
        -- 依赖的 complete RPC 在本事务内执行，任何一步失败都回滚本次修改。
        perform public.complete_ledger_setup(p_ledger_id, p_payload);
    end if;
    select updated_at into v_updated_at
      from public.ledger where id = p_ledger_id;
    return v_updated_at;
end;
$$;

revoke all on function public.commit_ledger_setup(
    uuid, timestamptz, text, text, text, text, text, integer, jsonb, boolean, jsonb
) from public, anon;
grant execute on function public.commit_ledger_setup(
    uuid, timestamptz, text, text, text, text, text, integer, jsonb, boolean, jsonb
) to authenticated;

-- 删除无调用方的旧 RPC；删除函数也同时移除其 EXECUTE 授权。
drop function if exists public.create_ledger_setup(text, text, text, text, text);
drop function if exists public.update_ledger_setup_basic_info(uuid, text, text, text, text, text);
drop function if exists public.save_ledger_setup_draft(uuid, integer, jsonb);
