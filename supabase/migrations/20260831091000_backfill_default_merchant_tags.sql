-- Issue #651：为已有账本补齐默认商家标签。

insert into public.merchant_tags (
    ledger_id, name, icon, sort_order, created_by
)
select l.id, defaults.name, defaults.icon, defaults.sort_order, l.owner_user_id
from public.ledger l
cross join (
    values
        ('超市', '🛒', 0),
        ('便利店', '🏪', 1),
        ('餐饮', '🍽️', 2),
        ('百货店', '🏬', 3),
        ('电商', '📦', 4),
        ('旅行', '✈️', 5),
        ('通讯', '📶', 6),
        ('生活', '🏠', 7)
) defaults(name, icon, sort_order)
where not exists (
    select 1
    from public.merchant_tags mt
    where mt.ledger_id = l.id
      and mt.is_archived = false
      and lower(mt.name) = lower(defaults.name)
)
and l.is_archived = false;
