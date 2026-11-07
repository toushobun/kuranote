-- #997 统一草稿提交：无 seed，事务内验证权限、幂等、并发、原子完成。
begin;

insert into auth.users (id, aud, role, email, raw_user_meta_data)
values
  ('99700000-0000-4000-8000-000000000011', 'authenticated', 'authenticated',
    'issue997-owner@example.test', '{"display_name":"Owner"}'),
  ('99700000-0000-4000-8000-000000000012', 'authenticated', 'authenticated',
    'issue997-other@example.test', '{"display_name":"Other"}');

create function pg_temp.act(p_user_id uuid) returns void language sql as $$
    select pg_catalog.set_config(
      'request.jwt.claim.sub', coalesce(p_user_id::text, ''), true
    );
$$;

create function pg_temp.expect_error(
    p_label text, p_sql text, p_sqlstate text, p_detail text
) returns void language plpgsql as $$
declare
    v_state text;
    v_detail text;
begin
    begin
        execute p_sql;
    exception when others then
        get stacked diagnostics v_state = returned_sqlstate,
                                v_detail = pg_exception_detail;
        if v_state is distinct from p_sqlstate
           or v_detail is distinct from p_detail then
            raise exception '%: wanted % / %, received % / %',
                p_label, p_sqlstate, p_detail, v_state, v_detail;
        end if;
        return;
    end;
    raise exception '%: expected an error', p_label;
end;
$$;

do $$
declare
    v_owner uuid := '99700000-0000-4000-8000-000000000011';
    v_other uuid := '99700000-0000-4000-8000-000000000012';
    v_id uuid := '99700000-0000-4000-8000-000000000001';
    v_other_id uuid := '99700000-0000-4000-8000-000000000002';
    v_failed_id uuid := '99700000-0000-4000-8000-000000000003';
    v_version timestamptz;
    v_next_version timestamptz;
    v_draft jsonb := '{"schemaVersion":2,"templateRegion":"jp","templateVersion":5,
      "accounts":{"items":[{"type":"cash","name":"日元现金","templateKey":"日元现金"}],"skipped":false},
      "merchants":{"selectedKeys":[],"skipped":false},
      "features":{"specialStatusEnabled":false,"multiAccountPaymentEnabled":false}}'::jsonb;
    v_payload jsonb := '{"templateRegion":"jp",
      "accounts":[{"type":"cash","name":"日元现金","currency":"JPY"}],
      "merchantTags":[],"merchants":[],
      "specialStatusEnabled":false,"multiAccountPaymentEnabled":false}'::jsonb;
begin
    if has_function_privilege(
        'anon',
        'public.commit_ledger_setup(uuid,timestamptz,text,text,text,text,text,integer,jsonb,boolean,jsonb)',
        'execute'
    ) then
        raise exception 'anonymous must not execute commit_ledger_setup';
    end if;
    if not has_function_privilege(
        'authenticated',
        'public.commit_ledger_setup(uuid,timestamptz,text,text,text,text,text,integer,jsonb,boolean,jsonb)',
        'execute'
    ) then
        raise exception 'authenticated must be able to execute commit_ledger_setup';
    end if;
    if to_regprocedure('public.create_ledger_setup(text,text,text,text,text)') is not null
       or to_regprocedure('public.update_ledger_setup_basic_info(uuid,text,text,text,text,text)') is not null
       or to_regprocedure('public.save_ledger_setup_draft(uuid,integer,jsonb)') is not null then
        raise exception 'old ledger setup RPCs are still present';
    end if;

    perform pg_temp.act(v_owner);
    select public.commit_ledger_setup(
        v_id, null, ' 家庭账本 ', 'jpy', 'Owner', 'amber', 'jp',
        2, v_draft, false, null
    ) into v_version;

    if not exists (
        select 1 from public.ledger
        where id = v_id and owner_user_id = v_owner
          and name = '家庭账本' and base_currency = 'JPY'
          and setup_status = 'in_progress' and setup_step = 2
          and setup_draft = v_draft
    ) then
        raise exception 'first save did not persist full draft';
    end if;
    if not exists (
        select 1 from public.ledger_member lm
          join public.ledger_member_display_setting dm
            on dm.ledger_id=lm.ledger_id and dm.user_id=lm.user_id
        where lm.ledger_id=v_id and lm.user_id=v_owner
          and lm.role='owner' and dm.display_name='Owner'
    ) then
        raise exception 'first save did not bootstrap owner';
    end if;
    if exists (select 1 from public.account where ledger_id=v_id)
       or exists (select 1 from public.category where ledger_id=v_id) then
        raise exception 'save exit unexpectedly initialized business data';
    end if;

    -- 相同客户端 UUID 首次请求因响应丢失而再次到达时视为一次提交。
    if public.commit_ledger_setup(
        v_id, null, '家庭账本', 'JPY', 'Owner', 'amber', 'jp',
        2, v_draft, false, null
    ) is distinct from v_version then
        raise exception 'first save retry returned different version';
    end if;
    if (select count(*) from public.ledger where id=v_id) <> 1 then
        raise exception 'first save retry duplicated ledger';
    end if;

    -- 纯进度保存不得更改快照。
    select public.commit_ledger_setup(
        v_id, v_version, '家庭账本', 'JPY', 'Owner', 'amber', 'jp',
        3, v_draft, false, null
    ) into v_next_version;
    if not exists (
        select 1 from public.ledger
        where id=v_id and setup_step=3 and setup_draft=v_draft
    ) then
        raise exception 'step only save lost draft';
    end if;

    perform pg_temp.expect_error(
        'stale version conflict',
        format(
          'select public.commit_ledger_setup(%L::uuid, %L::timestamptz, %L, %L, %L, %L, %L, 4, %L::jsonb, false, null)',
          v_id, v_version - interval '1 second',
          '家庭账本', 'JPY', 'Owner', 'amber', 'jp', v_draft
        ),
        '40001', 'ledger_setup_conflict'
    );
    if (select setup_step from public.ledger where id=v_id) <> 3 then
        raise exception 'stale request overwrote progress';
    end if;

    perform pg_temp.expect_error(
        'different draft ID forbidden',
        format(
          'select public.commit_ledger_setup(%L::uuid, null, %L, %L, %L, %L, %L, 1, %L::jsonb, false, null)',
          v_other_id, 'Another draft', 'JPY', 'Owner', 'amber', 'jp', v_draft
        ),
        '23505', 'ledger_setup_in_progress_exists'
    );

    perform pg_temp.act(v_other);
    perform pg_temp.expect_error(
        'not owner',
        format(
          'select public.commit_ledger_setup(%L::uuid, null, %L, %L, %L, %L, %L, 3, %L::jsonb, false, null)',
          v_id, '家庭账本', 'JPY', 'Owner', 'amber', 'jp', v_draft
        ),
        '42501', 'ledger_setup_not_found'
    );
    perform pg_temp.act(null);
    perform pg_temp.expect_error(
        'no auth',
        format(
          'select public.commit_ledger_setup(%L::uuid, null, %L, %L, %L, %L, %L, 3, %L::jsonb, false, null)',
          v_id, '家庭账本', 'JPY', 'Owner', 'amber', 'jp', v_draft
        ),
        '42501', 'auth_required'
    );
    perform pg_temp.act(v_owner);

    perform pg_temp.expect_error(
        'draft region mismatch',
        format(
          'select public.commit_ledger_setup(%L::uuid, null, %L, %L, %L, %L, %L, 3, %L::jsonb, false, null)',
          v_id, '家庭账本', 'JPY', 'Owner', 'amber', 'cn', v_draft
        ),
        '22023', 'ledger_setup_region_mismatch'
    );
    perform pg_temp.expect_error(
        'draft size',
        format(
          'select public.commit_ledger_setup(%L::uuid, null, %L, %L, %L, %L, %L, 3, jsonb_build_object(''templateRegion'', ''jp'', ''note'', repeat(''x'', 70000)), false, null)',
          v_id, '家庭账本', 'JPY', 'Owner', 'amber', 'jp'
        ),
        '22023', 'ledger_setup_draft_too_large'
    );
    perform pg_temp.expect_error(
        'invalid currency',
        format(
          'select public.commit_ledger_setup(%L::uuid, null, %L, %L, %L, %L, %L, 3, %L::jsonb, false, null)',
          v_id, '家庭账本', 'INVALID', 'Owner', 'amber', 'jp', v_draft
        ),
        '22023', 'currency_invalid'
    );

    -- 最终确认需要完整事务：先保存到第 5 步再初始化业务数据。
    select public.commit_ledger_setup(
        v_id, v_next_version, '家庭账本', 'JPY', 'Owner', 'amber',
        'jp', 5, v_draft, true, v_payload
    ) into v_version;
    if (select setup_status from public.ledger where id=v_id) <> 'completed'
       or (select count(*) from public.account where ledger_id=v_id) <> 1
       or (select count(*) from public.category where ledger_id=v_id) = 0 then
        raise exception 'atomic completion did not write business data';
    end if;
    -- 重试完成不可再插入任何初始账户。
    perform public.commit_ledger_setup(
        v_id, v_next_version, '家庭账本', 'JPY', 'Owner', 'amber',
        'jp', 5, v_draft, true, v_payload
    );
    if (select count(*) from public.account where ledger_id=v_id) <> 1 then
        raise exception 'completion retry created duplicated accounts';
    end if;

    -- 首次直接完成遭遇无效 payload 时整笔事务回滚，不留下 in_progress 记录。
    perform pg_temp.expect_error(
        'complete and create rollback',
        format(
          'select public.commit_ledger_setup(%L::uuid, null, %L, %L, %L, %L, %L, 5, %L::jsonb, true, %L::jsonb)',
          v_failed_id, 'Failed create', 'JPY', 'Owner', 'amber', 'jp',
          v_draft, '{"accounts":[]}'
        ),
        '22023', 'ledger_setup_payload_invalid'
    );
    if exists (select 1 from public.ledger where id=v_failed_id) then
        raise exception 'failed complete created a partial ledger';
    end if;
end;
$$;

rollback;
