-- Issue #395：默认分类只在数据库中维护一份。
-- 1. 把 initialize_ledger_default_categories 中的默认分类数据抽为内部函数 ledger_default_categories()；
-- 2. initialize_ledger_default_categories 改为基于它写入（写入顺序、内容与跳过规则不变）；
-- 3. 新增只读 RPC get_ledger_default_root_categories()，供创建账本向导的确认一览展示将自动创建的大分类。

-- 默认分类定义。大分类的 parent_name 为 null；小分类以 parent_name 指向同类型的大分类。
-- 内部函数，不对客户端开放。
create or replace function public.ledger_default_categories()
returns table (
    category_type text,
    parent_name text,
    name text,
    icon_name text,
    color text,
    sort_order integer
)
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
    select *
    from (
        values
        ('income', null, '💰 工资收入', '💰', '#D1FAE5', 10),
        ('income', null, '💸 其他收入', '💸', '#DBEAFE', 20),
        ('expense', null, '🍽️ 饮食', '🍽️', '#FEE2E2', 30),
        ('expense', null, '🏠 住房', '🏠', '#FEF3C7', 40),
        ('expense', null, '🚃 出行', '🚃', '#A5F3FC', 50),
        ('expense', null, '👗 穿衣', '👗', '#E9D5FF', 60),
        ('expense', null, '🎮 玩耍', '🎮', '#FCE7F3', 70),
        ('expense', null, '💊 医疗', '💊', '#FED7AA', 80),
        ('expense', null, '📚 教育', '📚', '#BFDBFE', 90),
        ('expense', null, '📱 通讯', '📱', '#DDD6FE', 100),
        ('expense', null, '🤝 人情', '🤝', '#BBF7D0', 110),
        ('expense', null, '💴 金融', '💴', '#FDE68A', 120),
        ('income', '💰 工资收入', '💴 工资', '💴', '#D1FAE5', 10),
        ('income', '💰 工资收入', '🎁 奖金', '🎁', '#D1FAE5', 20),
        ('income', '💰 工资收入', '💼 职务手当', '💼', '#D1FAE5', 30),
        ('income', '💰 工资收入', '📄 公司报销', '📄', '#D1FAE5', 40),
        ('income', '💰 工资收入', '🏅 资格手当', '🏅', '#D1FAE5', 50),
        ('income', '💰 工资收入', '🏠 住房手当', '🏠', '#D1FAE5', 60),
        ('income', '💰 工资收入', '🚃 通勤手当', '🚃', '#D1FAE5', 70),
        ('income', '💰 工资收入', '💒 结婚手当', '💒', '#D1FAE5', 80),
        ('income', '💸 其他收入', '📈 理财收益', '📈', '#DBEAFE', 10),
        ('income', '💸 其他收入', '💼 活动返现', '💼', '#DBEAFE', 20),
        ('income', '💸 其他收入', '📄 报销', '📄', '#DBEAFE', 30),
        ('income', '💸 其他收入', '💰 其他收入', '💰', '#DBEAFE', 40),
        ('income', '💸 其他收入', '🔑 退押金', '🔑', '#DBEAFE', 50),
        ('income', '💸 其他收入', '💴 現金還元', '💴', '#DBEAFE', 60),
        ('income', '💸 其他收入', '🏦 利息スーパーフウツ', '🏦', '#DBEAFE', 70),
        ('income', '💸 其他收入', '🎁 デビットキャンペン', '🎁', '#DBEAFE', 80),
        ('income', '💸 其他收入', '🏛️ 退税', '🏛️', '#DBEAFE', 90),
        ('expense', '🍽️ 饮食', '🥬 做饭食材/调料', '🥬', '#FEE2E2', 10),
        ('expense', '🍽️ 饮食', '🍱 便当', '🍱', '#FEE2E2', 20),
        ('expense', '🍽️ 饮食', '🍜 外食', '🍜', '#FEE2E2', 30),
        ('expense', '🍽️ 饮食', '🍎 水果', '🍎', '#FEE2E2', 40),
        ('expense', '🍽️ 饮食', '🍿 零食', '🍿', '#FEE2E2', 50),
        ('expense', '🍽️ 饮食', '🧃 饮料', '🧃', '#FEE2E2', 60),
        ('expense', '🍽️ 饮食', '🛵 外卖', '🛵', '#FEE2E2', 70),
        ('expense', '🏠 住房', '🏠 房租', '🏠', '#FEF3C7', 10),
        ('expense', '🏠 住房', '🏢 物业费', '🏢', '#FEF3C7', 20),
        ('expense', '🏠 住房', '💧 水', '💧', '#FEF3C7', 30),
        ('expense', '🏠 住房', '⚡ 电', '⚡', '#FEF3C7', 40),
        ('expense', '🏠 住房', '🔥 煤气', '🔥', '#FEF3C7', 50),
        ('expense', '🏠 住房', '🧴 日常用品', '🧴', '#FEF3C7', 60),
        ('expense', '🏠 住房', '🛋️ 家具', '🛋️', '#FEF3C7', 70),
        ('expense', '🏠 住房', '📺 家电', '📺', '#FEF3C7', 80),
        ('expense', '🏠 住房', '🔧 人工费', '🔧', '#FEF3C7', 90),
        ('expense', '🏠 住房', '🏫 宿舍费', '🏫', '#FEF3C7', 100),
        ('expense', '🚃 出行', '🚃 JR地铁公交', '🚃', '#A5F3FC', 10),
        ('expense', '🚃 出行', '🚄 高铁大巴新干线', '🚄', '#A5F3FC', 20),
        ('expense', '🚃 出行', '✈️ 飞机票', '✈️', '#A5F3FC', 30),
        ('expense', '🚃 出行', '🚢 船票', '🚢', '#A5F3FC', 40),
        ('expense', '🚃 出行', '🚕 打车', '🚕', '#A5F3FC', 50),
        ('expense', '🚃 出行', '🚗 租车', '🚗', '#A5F3FC', 60),
        ('expense', '🚃 出行', '⛽ 油费', '⛽', '#A5F3FC', 70),
        ('expense', '🚃 出行', '🛣️ 过路费', '🛣️', '#A5F3FC', 80),
        ('expense', '🚃 出行', '🅿️ 停车费', '🅿️', '#A5F3FC', 90),
        ('expense', '🚃 出行', '🔩 保养', '🔩', '#A5F3FC', 100),
        ('expense', '🚃 出行', '🚲 共享单车', '🚲', '#A5F3FC', 110),
        ('expense', '🚃 出行', '🛠️ 自行车用品', '🛠️', '#A5F3FC', 120),
        ('expense', '👗 穿衣', '👕 上衣', '👕', '#E9D5FF', 10),
        ('expense', '👗 穿衣', '👖 下裤', '👖', '#E9D5FF', 20),
        ('expense', '👗 穿衣', '👟 鞋子', '👟', '#E9D5FF', 30),
        ('expense', '👗 穿衣', '🩲 内衣裤', '🩲', '#E9D5FF', 40),
        ('expense', '👗 穿衣', '💍 饰品', '💍', '#E9D5FF', 50),
        ('expense', '👗 穿衣', '💇 美容美发', '💇', '#E9D5FF', 60),
        ('expense', '👗 穿衣', '💄 化妆品', '💄', '#E9D5FF', 70),
        ('expense', '👗 穿衣', '🧴 护肤品', '🧴', '#E9D5FF', 80),
        ('expense', '🎮 玩耍', '🎮 游戏', '🎮', '#FCE7F3', 10),
        ('expense', '🎮 玩耍', '🎁 纪念品', '🎁', '#FCE7F3', 20),
        ('expense', '🎮 玩耍', '🎣 钓鱼', '🎣', '#FCE7F3', 30),
        ('expense', '🎮 玩耍', '🎫 门票', '🎫', '#FCE7F3', 40),
        ('expense', '🎮 玩耍', '🎤 KTV', '🎤', '#FCE7F3', 50),
        ('expense', '🎮 玩耍', '🗺️ 旅行服务费', '🗺️', '#FCE7F3', 60),
        ('expense', '🎮 玩耍', '🏨 酒店费', '🏨', '#FCE7F3', 70),
        ('expense', '🎮 玩耍', '💒 结婚', '💒', '#FCE7F3', 80),
        ('expense', '🎮 玩耍', '💱 换汇手续费', '💱', '#FCE7F3', 90),
        ('expense', '💊 医疗', '💊 药费', '💊', '#FED7AA', 10),
        ('expense', '💊 医疗', '🏥 检查费', '🏥', '#FED7AA', 20),
        ('expense', '💊 医疗', '💉 治疗费', '💉', '#FED7AA', 30),
        ('expense', '💊 医疗', '🌿 保健品', '🌿', '#FED7AA', 40),
        ('expense', '📚 教育', '💻 网课', '💻', '#BFDBFE', 10),
        ('expense', '📚 教育', '📖 资料费', '📖', '#BFDBFE', 20),
        ('expense', '📚 教育', '🖨️ 打印费', '🖨️', '#BFDBFE', 30),
        ('expense', '📚 教育', '🎓 学费报名费', '🎓', '#BFDBFE', 40),
        ('expense', '📱 通讯', '📲 APP订阅费', '📲', '#DDD6FE', 10),
        ('expense', '📱 通讯', '☎️ 话费', '☎️', '#DDD6FE', 20),
        ('expense', '📱 通讯', '🌐 网费', '🌐', '#DDD6FE', 30),
        ('expense', '📱 通讯', '📦 快递费', '📦', '#DDD6FE', 40),
        ('expense', '📱 通讯', '📱 电子数码', '📱', '#DDD6FE', 50),
        ('expense', '🤝 人情', '🎁 份子钱', '🎁', '#BBF7D0', 10),
        ('expense', '🤝 人情', '🎀 特产', '🎀', '#BBF7D0', 20),
        ('expense', '🤝 人情', '🪙 小费', '🪙', '#BBF7D0', 30),
        ('expense', '💴 金融', '💴 厚生年金', '💴', '#FDE68A', 10),
        ('expense', '💴 金融', '💴 国民年金', '💴', '#FDE68A', 20),
        ('expense', '💴 金融', '🏥 健康保险', '🏥', '#FDE68A', 30),
        ('expense', '💴 金融', '📋 雇佣保险', '📋', '#FDE68A', 40),
        ('expense', '💴 金融', '🏛️ 个人所得税', '🏛️', '#FDE68A', 50),
        ('expense', '💴 金融', '👶 子育支援金', '👶', '#FDE68A', 60),
        ('expense', '💴 金融', '🚲 自行车保险', '🚲', '#FDE68A', 70),
        ('expense', '💴 金融', '⚠️ 罚款', '⚠️', '#FDE68A', 80),
        ('expense', '💴 金融', '🗾 故乡纳税', '🗾', '#FDE68A', 90),
        ('expense', '💴 金融', '🏦 办事手续费', '🏦', '#FDE68A', 100)
    ) as default_category(category_type, parent_name, name, icon_name, color, sort_order);
$$;

revoke all on function public.ledger_default_categories() from public, anon, authenticated, service_role;

-- 默认分类（大分类 / 小分类）初始化。数据取自 ledger_default_categories()；已存在同名分类时跳过。
create or replace function public.initialize_ledger_default_categories(
    p_ledger_id uuid,
    p_user_id uuid
)
returns void
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
    v_root record;
    v_child record;
    v_parent_id uuid;
begin
    for v_root in
        select d.category_type, d.name, d.icon_name, d.color, d.sort_order
        from public.ledger_default_categories() d
        where d.parent_name is null
        order by d.sort_order
    loop
        insert into public.category (
            ledger_id,
            parent_id,
            type,
            name,
            icon_name,
            color,
            sort_order,
            created_by,
            updated_by
        )
        select
            p_ledger_id,
            null,
            v_root.category_type,
            v_root.name,
            v_root.icon_name,
            v_root.color,
            v_root.sort_order,
            p_user_id,
            p_user_id
        where not exists (
            select 1
            from public.category c
            where c.ledger_id = p_ledger_id
              and c.parent_id is null
              and c.type = v_root.category_type
              and c.is_archived = false
              and lower(c.name) = lower(v_root.name)
        );
    end loop;

    -- 小分类按所属大分类的排序、再按自身排序写入。
    for v_child in
        select child.category_type, child.parent_name, child.name, child.icon_name, child.color, child.sort_order
        from public.ledger_default_categories() child
        join public.ledger_default_categories() root
          on root.parent_name is null
         and root.category_type = child.category_type
         and root.name = child.parent_name
        order by root.sort_order, child.sort_order
    loop
        select c.id
        into v_parent_id
        from public.category c
        where c.ledger_id = p_ledger_id
          and c.parent_id is null
          and c.type = v_child.category_type
          and c.is_archived = false
          and lower(c.name) = lower(v_child.parent_name)
        limit 1;

        if v_parent_id is null then
            raise exception 'default_parent_category_missing' using errcode = '22023';
        end if;

        insert into public.category (
            ledger_id,
            parent_id,
            type,
            name,
            icon_name,
            color,
            sort_order,
            created_by,
            updated_by
        )
        select
            p_ledger_id,
            v_parent_id,
            v_child.category_type,
            v_child.name,
            v_child.icon_name,
            v_child.color,
            v_child.sort_order,
            p_user_id,
            p_user_id
        where not exists (
            select 1
            from public.category c
            where c.ledger_id = p_ledger_id
              and c.parent_id = v_parent_id
              and c.type = v_child.category_type
              and c.is_archived = false
              and lower(c.name) = lower(v_child.name)
        );
    end loop;
end;
$$;

revoke all on function public.initialize_ledger_default_categories(uuid, uuid) from public, anon, authenticated, service_role;

-- 创建账本向导读取将自动创建的大分类（按排序）。只返回默认分类定义，不涉及任何账本数据。
create or replace function public.get_ledger_default_root_categories()
returns table (
    name text,
    sort_order integer
)
language sql
stable
security definer
set search_path = pg_catalog, pg_temp
as $$
    select d.name, d.sort_order
    from public.ledger_default_categories() d
    where d.parent_name is null
    order by d.sort_order;
$$;

revoke all on function public.get_ledger_default_root_categories() from public, anon, authenticated, service_role;
grant execute on function public.get_ledger_default_root_categories() to authenticated;
