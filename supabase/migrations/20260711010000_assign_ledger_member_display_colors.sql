-- 新成员进入账本时，按固定顺序分配当前账本内尚未使用的成员颜色。
-- 颜色顺序需要与 src/types/ledgers.ts 的 ledgerMemberColorOptions 保持一致。
create or replace function public.get_next_ledger_member_display_color(
    p_ledger_id uuid
)
returns text
language sql
security definer
set search_path = public
stable
as $$
    with color_options(display_color, sort_order) as (
        values
            ('amber'::text, 1),
            ('sakura'::text, 2),
            ('lime'::text, 3),
            ('jade'::text, 4),
            ('sky'::text, 5),
            ('lavender'::text, 6)
    )
    select coalesce(
        (
            select option.display_color
            from color_options option
            where not exists (
                select 1
                from public.ledger_member lm
                join public.ledger_member_display_setting setting
                  on setting.ledger_id = lm.ledger_id
                 and setting.user_id = lm.user_id
                where lm.ledger_id = p_ledger_id
                  and lm.status = 'active'
                  and setting.display_color = option.display_color
            )
            order by option.sort_order
            limit 1
        ),
        'amber'
    );
$$;

comment on function public.get_next_ledger_member_display_color(uuid)
    is '按成员颜色预设顺序返回账本内第一个未被 active 成员使用的颜色；全部占用时回退 amber。';

create or replace function public.assign_ledger_member_default_display_color()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_actor_id uuid;
begin
    if new.status <> 'active' then
        return new;
    end if;

    if tg_op = 'UPDATE' and old.status = 'active' then
        return new;
    end if;

    -- 同一账本的并发加入流程串行分配颜色，避免两名成员同时拿到同一个空闲色。
    perform 1
    from public.ledger l
    where l.id = new.ledger_id
    for update;

    v_actor_id = coalesce(auth.uid(), new.created_by, new.user_id);

    insert into public.ledger_member_display_setting (
        ledger_id,
        user_id,
        display_color,
        created_by,
        updated_by
    ) values (
        new.ledger_id,
        new.user_id,
        public.get_next_ledger_member_display_color(new.ledger_id),
        v_actor_id,
        v_actor_id
    )
    on conflict (ledger_id, user_id) do nothing;

    return new;
end;
$$;

comment on function public.assign_ledger_member_default_display_color()
    is '成员首次成为 active 时自动建立账本内显示色设置。';

drop trigger if exists ledger_member_assign_default_display_color
on public.ledger_member;

create trigger ledger_member_assign_default_display_color
after insert or update of status on public.ledger_member
for each row
execute function public.assign_ledger_member_default_display_color();

-- 为既存 active 成员补齐缺失设置。按加入时间逐个处理，保证同一账本内优先使用不同颜色。
do $$
declare
    v_member record;
    v_actor_id uuid;
begin
    for v_member in
        select
            lm.id,
            lm.ledger_id,
            lm.user_id,
            lm.created_by,
            lm.joined_at,
            lm.created_at
        from public.ledger_member lm
        where lm.status = 'active'
          and not exists (
              select 1
              from public.ledger_member_display_setting setting
              where setting.ledger_id = lm.ledger_id
                and setting.user_id = lm.user_id
          )
        order by
            lm.ledger_id,
            coalesce(lm.joined_at, lm.created_at),
            lm.created_at,
            lm.id
    loop
        perform 1
        from public.ledger l
        where l.id = v_member.ledger_id
        for update;

        v_actor_id = coalesce(v_member.created_by, v_member.user_id);

        insert into public.ledger_member_display_setting (
            ledger_id,
            user_id,
            display_color,
            created_by,
            updated_by
        ) values (
            v_member.ledger_id,
            v_member.user_id,
            public.get_next_ledger_member_display_color(v_member.ledger_id),
            v_actor_id,
            v_actor_id
        )
        on conflict (ledger_id, user_id) do nothing;
    end loop;
end;
$$;

revoke all on function public.get_next_ledger_member_display_color(uuid) from public;
revoke all on function public.get_next_ledger_member_display_color(uuid) from anon;
revoke all on function public.get_next_ledger_member_display_color(uuid) from authenticated;

revoke all on function public.assign_ledger_member_default_display_color() from public;
revoke all on function public.assign_ledger_member_default_display_color() from anon;
revoke all on function public.assign_ledger_member_default_display_color() from authenticated;
