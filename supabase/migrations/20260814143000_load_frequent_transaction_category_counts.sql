-- Issue #567：在一次远程读取中加载常用记账分类。
-- 函数在 PostgreSQL 内按完整自然月回溯；当前可选分类的有效明细不足阈值时返回空结果。

create or replace function public.load_frequent_transaction_category_counts(
    p_ledger_id uuid,
    p_date_start timestamptz,
    p_date_end timestamptz,
    p_minimum_item_count integer default 20
)
returns table (
    category_id uuid,
    occurrence_count bigint
)
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
stable
as $$
declare
    v_range_start timestamptz := p_date_start;
    v_range_end constant timestamptz := p_date_end;
    v_month_end timestamptz := p_date_end;
    v_month_item_count bigint;
    v_total_item_count bigint := 0;
    v_previous_transaction_at timestamptz;
begin
    if p_ledger_id is null
       or p_date_start is null
       or p_date_end is null
       or p_date_start >= p_date_end
       or p_minimum_item_count <= 0
       or not public.current_user_is_active_ledger_member(p_ledger_id) then
        return;
    end if;

    loop
        select count(*)
        into v_month_item_count
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
         and c.is_archived = false
        where tr.ledger_id = p_ledger_id
          and tr.status = 'active'
          and tr.type = 'normal'
          and tr.transaction_at >= v_range_start
          and tr.transaction_at < v_month_end
          and ti.category_id is not null;

        v_total_item_count := v_total_item_count + v_month_item_count;
        exit when v_total_item_count >= p_minimum_item_count;

        select max(tr.transaction_at)
        into v_previous_transaction_at
        from public.transaction_item ti
        join public.transaction_record tr
          on tr.id = ti.transaction_record_id
         and tr.ledger_id = ti.ledger_id
        join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
         and c.is_archived = false
        where tr.ledger_id = p_ledger_id
          and tr.status = 'active'
          and tr.type = 'normal'
          and tr.transaction_at < v_range_start
          and ti.category_id is not null;

        -- 当前可选分类的全部历史已经查完，但仍未达到最小样本数。
        if v_previous_transaction_at is null then
            return;
        end if;

        -- KuraNote 全局使用 Asia/Tokyo 自然月边界；跳过空月份时仍完整纳入命中的月份。
        v_month_end := v_range_start;
        v_range_start := date_trunc(
            'month',
            v_previous_transaction_at at time zone 'Asia/Tokyo'
        ) at time zone 'Asia/Tokyo';
    end loop;

    return query
    select
        ti.category_id,
        count(*)::bigint as occurrence_count
    from public.transaction_item ti
    join public.transaction_record tr
      on tr.id = ti.transaction_record_id
     and tr.ledger_id = ti.ledger_id
    join public.category c
      on c.id = ti.category_id
     and c.ledger_id = ti.ledger_id
     and c.is_archived = false
    where tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal'
      and tr.transaction_at >= v_range_start
      and tr.transaction_at < v_range_end
      and ti.category_id is not null
    group by ti.category_id;
end;
$$;

revoke all on function public.load_frequent_transaction_category_counts(
    uuid,
    timestamptz,
    timestamptz,
    integer
) from public;
revoke all on function public.load_frequent_transaction_category_counts(
    uuid,
    timestamptz,
    timestamptz,
    integer
) from anon;
grant execute on function public.load_frequent_transaction_category_counts(
    uuid,
    timestamptz,
    timestamptz,
    integer
) to authenticated;
