-- #910：账户只要出现在任何交易数据中，就不能再修改币种。
--
-- 「已有交易」= 账户出现在 transaction_account_movement 中：普通记录的付款明细、
-- 转账 / 余额调整的明细（含初始余额生成的余额调整），不区分记录 status，
-- 已作废（deleted）的记录也算。判定统一经视图，与「账户维度」的其他读取同一入口，
-- 子 Issue 4 结束过渡期时也不需要另外同步。
--
-- 拦截放在 account 表的 BEFORE UPDATE OF currency 触发器上，覆盖所有能改币种的路径：
-- update_account_with_holders、经它调用的 update_account_with_balance_adjustment，
-- 以及 authenticated 对 account 表的直接 UPDATE（RLS 允许管理者直接更新）。

begin;

create function public.account_has_transactions(
    p_ledger_id uuid,
    p_account_id uuid
)
returns boolean
language sql
stable
set search_path to pg_catalog, pg_temp
as $$
    -- 视图为 security_invoker，只在 SECURITY DEFINER 上下文中调用，
    -- 不受 RLS 隐藏已作废记录的影响。
    select exists (
        select 1
        from public.transaction_account_movement m
        where m.ledger_id = p_ledger_id
          and m.account_id = p_account_id
    );
$$;

revoke all on function public.account_has_transactions(uuid, uuid) from public, anon, authenticated, service_role;

create function public.prevent_account_currency_change_with_transactions()
returns trigger
language plpgsql
security definer
set search_path to pg_catalog, pg_temp
as $$
begin
    -- 判定与更新在同一事务内。FOR UPDATE 与记账写明细 / 付款明细时外键检查取得的
    -- KEY SHARE 冲突：进行中的记账提交后才继续判定，避免「检查时没有交易、
    -- 更新前刚好有人记账」。update_account_with_holders 已先持有该锁，这里不会再等待。
    perform 1 from public.account where id = new.id for update;

    if public.account_has_transactions(new.ledger_id, new.id) then
        raise exception 'account_currency_locked'
            using errcode = '22023', detail = 'account_currency_locked';
    end if;

    return new;
end;
$$;

revoke all on function public.prevent_account_currency_change_with_transactions() from public, anon, authenticated, service_role;

create trigger account_currency_locked_by_transactions
before update of currency on public.account
for each row
when (new.currency is distinct from old.currency)
execute function public.prevent_account_currency_change_with_transactions();

-- 账户编辑表单据此禁用币种字段；结果只是提示，最终以上面的触发器为准。
create function public.list_account_ids_with_transactions(p_ledger_id uuid)
returns table (account_id uuid)
language sql
stable
security definer
set search_path to pg_catalog, pg_temp
as $$
    select a.id
    from public.account a
    where a.ledger_id = p_ledger_id
      and public.current_user_is_active_ledger_member(p_ledger_id)
      and public.account_has_transactions(a.ledger_id, a.id)
    order by a.id;
$$;

revoke all on function public.list_account_ids_with_transactions(uuid) from public, anon, authenticated, service_role;
grant execute on function public.list_account_ids_with_transactions(uuid) to authenticated;

commit;
