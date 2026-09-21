-- 以历史时间和带符号差值导入余额变更；每次调用独立原子写入并应用余额。
create function public.create_balance_adjustment_transaction(
    p_ledger_id uuid, p_account_id uuid, p_signed_delta numeric,
    p_transaction_at timestamptz, p_note text default null
) returns uuid
language plpgsql security definer
set search_path to pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_archived boolean;
    v_record_id uuid;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode='28000', detail='not_authenticated';
    end if;
    if not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode='42501', detail='ledger_forbidden';
    end if;
    if p_signed_delta is null or p_signed_delta::text in ('NaN','Infinity','-Infinity')
       or p_signed_delta = 0 or abs(p_signed_delta) >= 1000000000000
       or p_signed_delta <> round(p_signed_delta,2) then
        raise exception 'amount_invalid' using errcode='22023', detail='amount_invalid';
    end if;
    if p_transaction_at is null or not isfinite(p_transaction_at) then
        raise exception 'transaction_at_invalid' using errcode='22023', detail='transaction_at_invalid';
    end if;
    if length(p_note) > 2000 then
        raise exception 'note_too_long' using errcode='22023', detail='note_too_long';
    end if;
    select is_archived into v_archived from public.account
    where id=p_account_id and ledger_id=p_ledger_id for update;
    if not found then
        raise exception 'account_invalid' using errcode='22023', detail='account_invalid';
    end if;
    if v_archived then
        raise exception 'balance_adjustment_account_archived' using errcode='22023', detail='balance_adjustment_account_archived';
    end if;
    insert into public.transaction_record(ledger_id,type,transaction_at,note,created_by,updated_by)
    values(p_ledger_id,'balance_adjustment',p_transaction_at,nullif(btrim(p_note),''),v_user_id,v_user_id)
    returning id into v_record_id;
    insert into public.transaction_item(ledger_id,transaction_record_id,account_id,amount,balance_delta,created_by,updated_by)
    values(p_ledger_id,v_record_id,p_account_id,abs(p_signed_delta),p_signed_delta,v_user_id,v_user_id);
    perform public.apply_account_balance_delta(p_ledger_id,p_account_id,p_signed_delta,v_user_id);
    return v_record_id;
end;
$$;
revoke all on function public.create_balance_adjustment_transaction(uuid,uuid,numeric,timestamptz,text) from public,anon;
grant execute on function public.create_balance_adjustment_transaction(uuid,uuid,numeric,timestamptz,text) to authenticated;
