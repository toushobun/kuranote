-- Issue #435：对依赖 pgcrypto 的邀请 RPC 执行最小烟雾测试。
-- 测试数据仅存在于当前事务，最终统一回滚。

begin;

do $$
declare
    v_owner_id uuid := '43500000-0000-4000-8000-000000000001';
    v_member_id uuid := '43500000-0000-4000-8000-000000000002';
    v_ledger_id uuid;
    v_token text;
    v_preview_status text;
    v_accept_result text;
begin
    -- app_user.id 引用 auth.users。烟雾测试只需准备应用侧身份，临时关闭该表的
    -- 约束 trigger 完成 fixture 插入，随后立即恢复；业务 RPC 执行期间 trigger 正常启用。
    alter table public.app_user disable trigger all;

    insert into public.app_user (id, display_name, email, status)
    values
        (v_owner_id, 'SECURITY DEFINER Owner', 'security-owner@example.invalid', 'active'),
        (v_member_id, 'SECURITY DEFINER Member', 'security-member@example.invalid', 'active');

    alter table public.app_user enable trigger all;

    perform pg_catalog.set_config(
        'request.jwt.claim.sub',
        v_owner_id::text,
        true
    );

    select (public.create_ledger_with_owner_settings(
        'SECURITY DEFINER Smoke',
        'JPY',
        'Owner',
        'jade'
    )).id
      into v_ledger_id;

    select invite.token
      into v_token
      from public.create_ledger_invite_v2(v_ledger_id, 'member') invite;

    if v_token is null or pg_catalog.length(v_token) <> 64 then
        raise exception 'create_ledger_invite_v2 smoke test failed';
    end if;

    perform pg_catalog.set_config('request.jwt.claim.sub', '', true);

    select preview.invite_status
      into v_preview_status
      from public.get_ledger_invite_preview(v_token) preview;

    if v_preview_status <> 'valid' then
        raise exception 'get_ledger_invite_preview smoke test failed: %',
            v_preview_status;
    end if;

    perform pg_catalog.set_config(
        'request.jwt.claim.sub',
        v_member_id::text,
        true
    );

    select accepted.result
      into v_accept_result
      from public.accept_ledger_invite(v_token) accepted;

    if v_accept_result <> 'joined' then
        raise exception 'accept_ledger_invite smoke test failed: %',
            v_accept_result;
    end if;

    if not exists (
        select 1
        from public.ledger_member member
        where member.ledger_id = v_ledger_id
          and member.user_id = v_member_id
          and member.status = 'active'
          and member.role = 'member'
    ) then
        raise exception 'accept_ledger_invite member state smoke test failed';
    end if;
end;
$$;

rollback;
