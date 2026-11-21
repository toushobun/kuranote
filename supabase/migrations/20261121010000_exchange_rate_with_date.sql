-- #1140：汇率及实际取值日统一实现；保留 #1139 最早日兜底规则。
create function public.exchange_rate_with_date(p_from text, p_to text, p_date date)
returns table(rate numeric, rate_date date)
language sql stable
set search_path = pg_catalog, pg_temp
as $$
    select
        case
            when p_from is null or p_to is null or p_date is null then null
            when p_from = p_to then 1::numeric
            when (p_from <> 'EUR' and src.rate_per_eur is null)
              or (p_to <> 'EUR' and dst.rate_per_eur is null) then null
            else (case when p_to = 'EUR' then 1::numeric else dst.rate_per_eur end)
                / (case when p_from = 'EUR' then 1::numeric else src.rate_per_eur end)
        end as rate,
        case
            when p_from is null or p_to is null or p_date is null then null
            when p_from = p_to then p_date
            when (p_from <> 'EUR' and src.rate_date is null)
              or (p_to <> 'EUR' and dst.rate_date is null) then null
            when p_from = 'EUR' then dst.rate_date
            when p_to = 'EUR' then src.rate_date
            else least(src.rate_date, dst.rate_date)
        end as rate_date
    from (select 1) anchor
    left join lateral (
        select r.rate_per_eur, r.rate_date
        from public.exchange_rate r
        where r.currency = p_from
        order by (r.rate_date <= p_date) desc,
                 case when r.rate_date <= p_date then r.rate_date end desc,
                 r.rate_date asc
        limit 1
    ) src on true
    left join lateral (
        select r.rate_per_eur, r.rate_date
        from public.exchange_rate r
        where r.currency = p_to
        order by (r.rate_date <= p_date) desc,
                 case when r.rate_date <= p_date then r.rate_date end desc,
                 r.rate_date asc
        limit 1
    ) dst on true;
$$;
revoke all on function public.exchange_rate_with_date(text,text,date)
    from public, anon, authenticated, service_role;
grant execute on function public.exchange_rate_with_date(text,text,date)
    to authenticated, service_role;

create or replace function public.exchange_rate_on(p_from text, p_to text, p_date date)
returns numeric language sql stable
set search_path = pg_catalog, pg_temp
as $$
    select rate from public.exchange_rate_with_date(p_from, p_to, p_date);
$$;
