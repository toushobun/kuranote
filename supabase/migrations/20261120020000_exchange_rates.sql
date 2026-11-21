-- #1139：全站共享 ECB 日汇率；EUR 为基准 1，不入表。
create table public.exchange_rate (
    rate_date date not null,
    currency text not null check (currency ~ '^[A-Z]{3}$' and currency <> 'EUR'),
    rate_per_eur numeric(18,8) not null check (rate_per_eur > 0),
    source text not null default 'ecb',
    fetched_at timestamptz not null default now(),
    primary key (rate_date, currency)
);
create index exchange_rate_currency_date_idx
    on public.exchange_rate (currency, rate_date desc);
alter table public.exchange_rate enable row level security;
revoke all on public.exchange_rate from public, anon, authenticated, service_role;
grant select on public.exchange_rate to authenticated;
grant select, insert, update, delete on public.exchange_rate to service_role;
create policy exchange_rate_authenticated_read on public.exchange_rate
    for select to authenticated using (true);

-- 使用者权限运行；authenticated 通过 RLS 只能读参考价。
-- 同币种立即返回 1；缺失历史时取最早可用价。
create function public.exchange_rate_on(p_from text, p_to text, p_date date)
returns numeric language sql stable
set search_path = pg_catalog, pg_temp
as $$
    with rates as (
        select
            case when p_from = 'EUR' then 1::numeric else coalesce(
                (select r.rate_per_eur from public.exchange_rate r
                 where r.currency = p_from and r.rate_date <= p_date
                 order by r.rate_date desc limit 1),
                (select r.rate_per_eur from public.exchange_rate r
                 where r.currency = p_from
                 order by r.rate_date asc limit 1)
            ) end as from_rate,
            case when p_to = 'EUR' then 1::numeric else coalesce(
                (select r.rate_per_eur from public.exchange_rate r
                 where r.currency = p_to and r.rate_date <= p_date
                 order by r.rate_date desc limit 1),
                (select r.rate_per_eur from public.exchange_rate r
                 where r.currency = p_to
                 order by r.rate_date asc limit 1)
            ) end as to_rate
    )
    select case
        when p_from is null or p_to is null or p_date is null then null
        when p_from = p_to then 1::numeric
        else to_rate / from_rate
    end from rates;
$$;
revoke all on function public.exchange_rate_on(text,text,date)
    from public, anon, authenticated, service_role;
grant execute on function public.exchange_rate_on(text,text,date)
    to authenticated, service_role;

-- 统一交易日期的东京时区语义，供全部统计读取端复用。
create function public.transaction_record_local_date(p_at timestamptz)
returns date language sql stable
set search_path = pg_catalog, pg_temp
as $$
    select (p_at at time zone 'Asia/Tokyo')::date;
$$;
revoke all on function public.transaction_record_local_date(timestamptz)
    from public, anon, authenticated, service_role;
grant execute on function public.transaction_record_local_date(timestamptz)
    to authenticated, service_role;
