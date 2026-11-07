-- #997 跨步骤草稿只在显式保存或完成创建时提交；每个 RPC 调用是单一事务。
-- 服务端不接受已废弃的逐步骤写入入口。
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
    v_equivalent boolean;
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
    if p_step is null or p_step < 1 or p_step > 5 then
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

    -- 在账本行上串行化同一 ID 的写入，并以读取时的 updated_at 做 CAS。
    select * into v_ledger
      from public.ledger
     where id = p_ledger_id
     for update;

    if found then
        if v_ledger.owner_user_id is distinct from v_user_id then
            raise exception 'ledger_setup_not_found'
                using errcode = '42501', detail = 'ledger_setup_not_found';
        end if;
        if v_ledger.setup_status = 'completed' then
            -- 完成请求在响应丢失后重试不能创建第二份数据。
            if p_complete then
                return v_ledger.updated_at;
            end if;
            raise exception 'ledger_setup_not_in_progress'
                using errcode = '23505', detail = 'ledger_setup_not_in_progress';
        end if;
        if v_ledger.setup_status <> 'in_progress' or v_ledger.is_archived then
            raise exception 'ledger_setup_not_found'
                using errcode = '42501', detail = 'ledger_setup_not_found';
        end if;
        select * into v_display
          from public.ledger_member_display_setting
         where ledger_id = p_ledger_id and user_id = v_user_id;

        v_equivalent :=
            v_ledger.name = btrim(p_name)
            and v_ledger.base_currency = upper(btrim(p_base_currency))
            and v_ledger.living_region = p_living_region
            and v_ledger.setup_draft = p_draft
            and v_ledger.setup_step = p_step
            and v_display.display_name = btrim(p_display_name)
            and v_display.display_color = btrim(p_display_color);

        if v_ledger.updated_at is distinct from p_expected_updated_at then
            -- 同一个请求重试时最终内容相同，即使旧时间戳已过期也视作成功。
            if v_equivalent then
                return v_ledger.updated_at;
            end if;
            raise exception 'ledger_setup_conflict'
                using errcode = '40001', detail = 'ledger_setup_conflict';
        end if;
    else
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
            );
        exception when unique_violation then
            get stacked diagnostics v_constraint = constraint_name;
            if v_constraint = 'ledger_owner_in_progress_setup_key' then
                raise exception 'ledger_setup_in_progress_exists'
                    using errcode = '23505', detail = 'ledger_setup_in_progress_exists';
            end if;
            raise;
        end;
        perform public.bootstrap_ledger_owner_member(p_ledger_id, v_user_id);
        perform public.upsert_ledger_member_display_setting(
            p_ledger_id, v_user_id, p_display_name, p_display_color
        );
    end if;

    if v_ledger.id is not null then
        perform set_config('app.allow_ledger_setup_update', 'true', true);
        if not v_equivalent then
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
        -- 完成写入会建立账户、商家和分类；任一失败将回滚本次创建/更新。
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

-- 旧接口不再具有调用方；只保留完成与放弃的其他 RPC。
drop function if exists public.create_ledger_setup(text, text, text, text, text);
drop function if exists public.update_ledger_setup_basic_info(uuid, text, text, text, text, text);
drop function if exists public.save_ledger_setup_draft(uuid, integer, jsonb);
