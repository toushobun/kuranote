begin;

-- Issue #395：创建账本向导（实施拆分第 2 项）。
-- 1. 账本基本信息校验、owner 成员 bootstrap、成员显示设置写入、默认分类初始化
--    抽成共用内部函数，既有 /ledgers/new 流程与向导 RPC 共用，数据库内只保留一份。
-- 2. 修改创建中账本的默认货币时，在同一事务内清空草稿中与旧币种模板相关的部分。
-- 3. 保存草稿时校验草稿记录的模板币种与账本当前默认货币一致。
-- 4. 新增完成写入 RPC complete_ledger_setup：同一事务内写入默认分类、账户、商家标签、
--    商家、商家别名、标签关联与功能开关，再将账本标记为 completed 并切换为当前账本。
--
-- 完成写入的放行方式：写入业务数据时账本仍为 in_progress，权限函数会拒绝。
-- complete_ledger_setup 经 lock_current_user_setup_ledger 校验 owner 与创建中状态后，
-- 把事务内 GUC app.ledger_setup_completion_ledger_id 设为该账本 ID，
-- 账户 / 持有人 / 分类 / 商家 / 商家标签 / 商家别名 / 标签关联的权限 trigger 只对
-- 「INSERT + 同一账本 + 当前用户为 owner 的创建中账本」放行；写完立即清空。
-- current_user_can_manage_ledger / current_user_can_write_ledger 本身不放宽。

-- 账本基本信息校验（由 validate_ledger_setup_basic_info 改名）。
-- create_ledger_with_owner_settings、create_ledger_setup、update_ledger_setup_basic_info 共用。
create or replace function public.validate_ledger_basic_info(
    p_name text,
    p_base_currency text,
    p_display_name text,
    p_display_color text
)
returns void
language plpgsql immutable
set search_path = pg_catalog, pg_temp
as $$
begin
    if p_name is null or btrim(p_name) = '' then
        raise exception 'ledger_name_required'
            using errcode = '22023', detail = 'ledger_name_required';
    end if;

    if length(btrim(p_name)) > 100 then
        raise exception 'ledger_name_too_long'
            using errcode = '22023', detail = 'ledger_name_too_long';
    end if;

    if p_base_currency is null
       or upper(btrim(p_base_currency)) not in (
           'CNY', 'JPY', 'USD', 'EUR', 'GBP', 'KRW', 'THB'
       ) then
        raise exception 'currency_invalid'
            using errcode = '22023', detail = 'currency_invalid';
    end if;

    if p_display_name is null or btrim(p_display_name) = '' then
        raise exception 'display_name_required'
            using errcode = '22023', detail = 'display_name_required';
    end if;

    if length(btrim(p_display_name)) > 100 then
        raise exception 'display_name_too_long'
            using errcode = '22023', detail = 'display_name_too_long';
    end if;

    if p_display_color is null
       or btrim(p_display_color) not in (
           'jade',
           'aqua',
           'sky',
           'indigo',
           'lavender',
           'magenta',
           'sakura',
           'rose',
           'amber',
           'lime'
       ) then
        raise exception 'display_color_invalid'
            using errcode = '22023', detail = 'display_color_invalid';
    end if;
end;
$$;

revoke all on function public.validate_ledger_basic_info(text, text, text, text) from public, anon, authenticated, service_role;

-- 新账本的 owner 成员 bootstrap。只在事务内短暂打开 app.allow_ledger_owner_bootstrap，
-- 由 enforce_ledger_member_management_permission 校验首个 owner 成员的身份与审计字段。
create or replace function public.bootstrap_ledger_owner_member(
    p_ledger_id uuid,
    p_user_id uuid
)
returns void
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
    perform set_config('app.allow_ledger_owner_bootstrap', 'true', true);

    insert into public.ledger_member (
        ledger_id,
        user_id,
        role,
        status,
        invited_by,
        invited_at,
        joined_at,
        created_by,
        updated_by
    )
    values (
        p_ledger_id,
        p_user_id,
        'owner',
        'active',
        p_user_id,
        now(),
        now(),
        p_user_id,
        p_user_id
    );

    perform set_config('app.allow_ledger_owner_bootstrap', 'false', true);
end;
$$;

revoke all on function public.bootstrap_ledger_owner_member(uuid, uuid) from public, anon, authenticated, service_role;

-- 写入（或更新）成员在账本中的显示名与个性色。调用方负责先校验取值。
create or replace function public.upsert_ledger_member_display_setting(
    p_ledger_id uuid,
    p_user_id uuid,
    p_display_name text,
    p_display_color text
)
returns void
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
    insert into public.ledger_member_display_setting (
        ledger_id,
        user_id,
        display_name,
        display_color,
        created_by,
        updated_by
    ) values (
        p_ledger_id,
        p_user_id,
        btrim(p_display_name),
        btrim(p_display_color),
        p_user_id,
        p_user_id
    )
    on conflict (ledger_id, user_id)
    do update set
        display_name = excluded.display_name,
        display_color = excluded.display_color,
        updated_by = p_user_id;
end;
$$;

revoke all on function public.upsert_ledger_member_display_setting(uuid, uuid, text, text) from public, anon, authenticated, service_role;

-- 默认分类（大分类 / 小分类）初始化。从 initialize_ledger_default_data_without_merchant_tags
-- 中抽出，既有初始化与完成写入 RPC 共用；已存在同名分类时跳过。
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
        select *
        from (
            values
            ('income', '💰 工资收入', '💰', '#D1FAE5', 10),
        ('income', '💸 其他收入', '💸', '#DBEAFE', 20),
        ('expense', '🍽️ 饮食', '🍽️', '#FEE2E2', 30),
        ('expense', '🏠 住房', '🏠', '#FEF3C7', 40),
        ('expense', '🚃 出行', '🚃', '#A5F3FC', 50),
        ('expense', '👗 穿衣', '👗', '#E9D5FF', 60),
        ('expense', '🎮 玩耍', '🎮', '#FCE7F3', 70),
        ('expense', '💊 医疗', '💊', '#FED7AA', 80),
        ('expense', '📚 教育', '📚', '#BFDBFE', 90),
        ('expense', '📱 通讯', '📱', '#DDD6FE', 100),
        ('expense', '🤝 人情', '🤝', '#BBF7D0', 110),
        ('expense', '💴 金融', '💴', '#FDE68A', 120)
        ) as default_root(category_type, name, icon_name, color, sort_order)
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

    for v_child in
        select *
        from (
            values
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
        ) as default_child(category_type, parent_name, name, icon_name, color, sort_order)
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

-- 既有初始化：商家与别名保持不变，分类改为调用共用函数（行为不变）。
create or replace function public.initialize_ledger_default_data_without_merchant_tags(
    p_ledger_id uuid,
    p_user_id uuid
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
    if p_ledger_id is null then
        raise exception 'ledger_id_required' using errcode = '22023';
    end if;

    if p_user_id is null then
        raise exception 'user_id_required' using errcode = '22023';
    end if;

    if not exists (
        select 1
        from public.ledger_member lm
        join public.app_user au
          on au.id = lm.user_id
        where lm.ledger_id = p_ledger_id
          and lm.user_id = p_user_id
          and lm.status = 'active'
          and au.status = 'active'
    ) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    insert into public.merchant (
        ledger_id,
        name,
        website_url,
        note,
        sort_order,
        created_by,
        updated_by
    )
    select
        p_ledger_id,
        default_merchant.name,
        null,
        null,
        default_merchant.sort_order,
        p_user_id,
        p_user_id
    from (
        values
        ('業務スーパー', 10),
        ('肉のハナマサ', 20),
        ('天满市场', 30),
        ('コノミヤ', 40),
        ('KOHYO超市', 50),
        ('A-PRICE超市', 60),
        ('LIFE', 70),
        ('Amazon', 80),
        ('Rakuten', 90),
        ('日本铁路', 100),
        ('三菱UFJ', 110),
        ('罗森', 120),
        ('FamilyMart', 130),
        ('711', 140),
        ('DAILY', 150),
        ('小松制造厂便利店', 160),
        ('中华物产店', 170),
        ('UR团地', 180),
        ('机场', 190),
        ('大阪ガス', 200),
        ('株式会社共逹', 210),
        ('Eliss umeda', 220),
        ('任天堂', 230),
        ('堂吉诃德', 240),
        ('麦当劳', 250),
        ('UBER', 260),
        ('THE NORTH FACE', 270),
        ('伊藤久右卫门-宇治抹茶', 280),
        ('优衣库', 290),
        ('WORKMAN', 300),
        ('各种小商铺', 310),
        ('自动贩卖机', 320),
        ('CHATGPT', 330),
        ('苹果', 340),
        ('邮局', 350),
        ('松本清', 360),
        ('友都巴喜', 370),
        ('环球影城', 380),
        ('Can★Do', 390),
        ('HOMECENTER', 400),
        ('爱电王', 410),
        ('BIKE SHARE', 420),
        ('自行车てるてる', 430),
        ('大阪出入境管理局', 440),
        ('大阪市政府', 450),
        ('JAF自动车联盟', 460),
        ('日本政府（保险）', 470),
        ('Tackle Berry（二手渔具）', 480),
        ('不二家', 490),
        ('SoftBank', 500),
        ('三井住友', 510),
        ('圣巴拿巴医院', 520),
        ('BIJOUPIKO', 530),
        ('株式会社アジティス', 540),
        ('吉野家', 550)
    ) as default_merchant(name, sort_order)
    where not exists (
        select 1
        from public.merchant m
        where m.ledger_id = p_ledger_id
          and m.is_archived = false
          and lower(m.name) = lower(default_merchant.name)
    );

    insert into public.merchant_alias (
        merchant_id,
        alias,
        locale,
        sort_order,
        created_by,
        updated_by
    )
    select
        m.id,
        default_alias.alias,
        default_alias.locale,
        default_alias.sort_order,
        p_user_id,
        p_user_id
    from (
        values
            ('業務スーパー', '业务超市', 'zh-Hans', 10),
            ('業務スーパー', 'Gyomu Super', 'en', 20),
            ('肉のハナマサ', '牛头店', 'zh-Hans', 10),
            ('肉のハナマサ', '肉之花正', 'zh-Hans', 20),
            ('天满市场', '天満市场', 'zh-Hans', 10),
            ('天满市场', 'Tenma Market', 'en', 20),
            ('コノミヤ', 'Konomiya', 'en', 10),
            ('コノミヤ', '近江屋超市', 'zh-Hans', 20),
            ('KOHYO超市', '光洋超市', 'zh-Hans', 10),
            ('KOHYO超市', 'KOHYO', 'en', 20),
            ('A-PRICE超市', 'A-PRICE', 'en', 10),
            ('A-PRICE超市', '批发超市', 'zh-Hans', 20),
            ('LIFE', 'ライフ', 'ja', 10),
            ('LIFE', '来福', 'zh-Hans', 20),
            ('Amazon', '亚马逊', 'zh-Hans', 10),
            ('Amazon', 'アマゾン', 'ja', 20),
            ('Rakuten', '乐天', 'zh-Hans', 10),
            ('Rakuten', '楽天', 'ja', 20),
            ('日本铁路', 'JR', 'en', 10),
            ('日本铁路', '日本鉄道', 'ja', 20),
            ('三菱UFJ', 'MUFG', 'en', 10),
            ('三菱UFJ', '三菱银行', 'zh-Hans', 20),
            ('罗森', 'Lawson', 'en', 10),
            ('罗森', 'ローソン', 'ja', 20),
            ('FamilyMart', '全家', 'zh-Hans', 10),
            ('FamilyMart', 'ファミマ', 'ja', 20),
            ('711', '7-Eleven', 'en', 10),
            ('711', 'セブン', 'ja', 20),
            ('DAILY', 'Daily Yamazaki', 'en', 10),
            ('DAILY', 'デイリー', 'ja', 20),
            ('小松制造厂便利店', '小松便利店', 'zh-Hans', 10),
            ('小松制造厂便利店', 'Komatsu Shop', 'en', 20),
            ('中华物产店', '中华超市', 'zh-Hans', 10),
            ('中华物产店', '中国物产店', 'zh-Hans', 20),
            ('UR团地', 'UR住宅', 'zh-Hans', 10),
            ('UR团地', 'UR賃貸', 'ja', 20),
            ('机场', '空港', 'ja', 10),
            ('机场', 'Airport', 'en', 20),
            ('大阪ガス', '大阪煤气', 'zh-Hans', 10),
            ('大阪ガス', 'Osaka Gas', 'en', 20),
            ('株式会社共逹', '共逹', 'zh-Hans', 10),
            ('株式会社共逹', '公司收入', 'zh-Hans', 20),
            ('Eliss umeda', '梅田美容', 'zh-Hans', 10),
            ('Eliss umeda', 'Eliss梅田', 'zh-Hans', 20),
            ('任天堂', 'Nintendo', 'en', 10),
            ('任天堂', 'ニンテンドー', 'ja', 20),
            ('堂吉诃德', 'Don Quijote', 'en', 10),
            ('堂吉诃德', 'ドンキ', 'ja', 20),
            ('麦当劳', 'McDonald''s', 'en', 10),
            ('麦当劳', 'マクドナルド', 'ja', 20),
            ('UBER', 'Uber Eats', 'en', 10),
            ('UBER', '优步', 'zh-Hans', 20),
            ('THE NORTH FACE', '北面', 'zh-Hans', 10),
            ('THE NORTH FACE', 'TNF', 'en', 20),
            ('伊藤久右卫门-宇治抹茶', '伊藤久右卫门', 'zh-Hans', 10),
            ('伊藤久右卫门-宇治抹茶', '宇治抹茶', 'zh-Hans', 20),
            ('优衣库', 'UNIQLO', 'en', 10),
            ('优衣库', 'ユニクロ', 'ja', 20),
            ('WORKMAN', '工作人', 'zh-Hans', 10),
            ('WORKMAN', 'ワークマン', 'ja', 20),
            ('各种小商铺', '小商铺', 'zh-Hans', 10),
            ('各种小商铺', '杂货店', 'zh-Hans', 20),
            ('自动贩卖机', '自贩机', 'zh-Hans', 10),
            ('自动贩卖机', 'Vending Machine', 'en', 20),
            ('CHATGPT', 'ChatGPT', 'en', 10),
            ('CHATGPT', 'OpenAI', 'en', 20),
            ('苹果', 'Apple', 'en', 10),
            ('苹果', 'アップル', 'ja', 20),
            ('邮局', '日本邮便', 'zh-Hans', 10),
            ('邮局', '郵便局', 'ja', 20),
            ('松本清', 'Matsukiyo', 'en', 10),
            ('松本清', 'マツキヨ', 'ja', 20),
            ('友都巴喜', 'Yodobashi', 'en', 10),
            ('友都巴喜', 'ヨドバシ', 'ja', 20),
            ('环球影城', 'USJ', 'en', 10),
            ('环球影城', 'Universal Studios Japan', 'en', 20),
            ('Can★Do', 'CanDo', 'en', 10),
            ('Can★Do', '百元店', 'zh-Hans', 20),
            ('HOMECENTER', 'Home Center', 'en', 10),
            ('HOMECENTER', 'ホームセンター', 'ja', 20),
            ('爱电王', 'Edion', 'en', 10),
            ('爱电王', 'エディオン', 'ja', 20),
            ('BIKE SHARE', '共享单车', 'zh-Hans', 10),
            ('BIKE SHARE', 'Bike Share', 'en', 20),
            ('自行车てるてる', '自行车Teruteru', 'zh-Hans', 10),
            ('自行车てるてる', 'てるてる', 'ja', 20),
            ('大阪出入境管理局', '入管', 'zh-Hans', 10),
            ('大阪出入境管理局', '大阪入管', 'ja', 20),
            ('大阪市政府', '大阪市役所', 'ja', 10),
            ('大阪市政府', '市政府', 'zh-Hans', 20),
            ('JAF自动车联盟', 'JAF', 'en', 10),
            ('JAF自动车联盟', '日本自动车联盟', 'zh-Hans', 20),
            ('日本政府（保险）', '日本保险', 'zh-Hans', 10),
            ('日本政府（保险）', '政府保险', 'zh-Hans', 20),
            ('Tackle Berry（二手渔具）', 'Tackle Berry', 'en', 10),
            ('Tackle Berry（二手渔具）', '二手渔具', 'zh-Hans', 20),
            ('不二家', 'Fujiya', 'en', 10),
            ('不二家', 'ペコちゃん', 'ja', 20),
            ('SoftBank', '软银', 'zh-Hans', 10),
            ('SoftBank', 'ソフトバンク', 'ja', 20),
            ('三井住友', 'SMBC', 'en', 10),
            ('三井住友', '三井住友银行', 'zh-Hans', 20),
            ('圣巴拿巴医院', 'St. Barnabas', 'en', 10),
            ('圣巴拿巴医院', '圣巴拿巴', 'zh-Hans', 20),
            ('BIJOUPIKO', 'Bijou Piko', 'en', 10),
            ('BIJOUPIKO', '珠宝店', 'zh-Hans', 20),
            ('株式会社アジティス', 'アジティス', 'ja', 10),
            ('株式会社アジティス', 'Agitis', 'en', 20),
            ('吉野家', 'Yoshinoya', 'en', 10),
            ('吉野家', 'よしのや', 'ja', 20)
    ) as default_alias(merchant_name, alias, locale, sort_order)
    join public.merchant m
      on m.ledger_id = p_ledger_id
     and m.is_archived = false
     and lower(m.name) = lower(default_alias.merchant_name)
    where not exists (
        select 1
        from public.merchant_alias ma
        where ma.merchant_id = m.id
          and ma.is_archived = false
          and lower(ma.alias) = lower(default_alias.alias)
    );

    perform public.initialize_ledger_default_categories(p_ledger_id, p_user_id);
end;
$$;

-- 既有建账本流程：owner bootstrap 改为调用共用函数（行为不变）。
create or replace function public.create_ledger_with_owner(
    p_name text,
    p_base_currency text default 'JPY'
)
returns public.ledger
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid;
    v_ledger public.ledger;
begin
    v_user_id = auth.uid();

    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if not exists (
        select 1
        from public.app_user au
        where au.id = v_user_id
          and au.status = 'active'
    ) then
        raise exception 'user_inactive'
            using errcode = '42501', detail = 'user_inactive';
    end if;

    insert into public.ledger (
        name,
        base_currency,
        owner_user_id,
        created_by,
        updated_by
    )
    values (
        p_name,
        p_base_currency,
        v_user_id,
        v_user_id,
        v_user_id
    )
    returning * into v_ledger;

    perform public.bootstrap_ledger_owner_member(v_ledger.id, v_user_id);

    perform public.initialize_ledger_default_data(v_ledger.id, v_user_id);

    update public.app_user
    set
        current_ledger_id = v_ledger.id,
        updated_by = v_user_id
    where id = v_user_id;

    return v_ledger;
end;
$$;

-- 既有 /ledgers/new 流程：取值校验与成员显示设置改为调用共用函数（行为不变）。
create or replace function public.create_ledger_with_owner_settings(
    p_name text,
    p_base_currency text,
    p_display_name text,
    p_display_color text
)
returns public.ledger
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid;
    v_ledger public.ledger;
    v_account_id uuid;
begin
    v_user_id = auth.uid();

    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    perform public.validate_ledger_basic_info(
        p_name,
        p_base_currency,
        p_display_name,
        p_display_color
    );

    v_ledger = public.create_ledger_with_owner(
        btrim(p_name),
        upper(btrim(p_base_currency))
    );

    perform public.upsert_ledger_member_display_setting(
        v_ledger.id,
        v_user_id,
        p_display_name,
        p_display_color
    );

    insert into public.account (
        ledger_id,
        name,
        type,
        currency,
        initial_balance,
        sort_order,
        created_by,
        updated_by
    ) values (
        v_ledger.id,
        '现金',
        'cash',
        upper(btrim(p_base_currency)),
        0,
        0,
        v_user_id,
        v_user_id
    )
    returning id into v_account_id;

    insert into public.account_holder (
        ledger_id,
        account_id,
        user_id,
        role,
        created_by,
        updated_by
    ) values (
        v_ledger.id,
        v_account_id,
        v_user_id,
        'owner',
        v_user_id,
        v_user_id
    );

    return v_ledger;
end;
$$;

-- 向导第 1 步：创建「创建中」账本、owner 成员与成员显示设置（行为不变）。
create or replace function public.create_ledger_setup(
    p_name text,
    p_base_currency text,
    p_display_name text,
    p_display_color text
)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_ledger_id uuid;
    v_constraint text;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    perform public.validate_ledger_basic_info(
        p_name,
        p_base_currency,
        p_display_name,
        p_display_color
    );

    if not public.current_app_user_is_active() then
        raise exception 'user_inactive'
            using errcode = '42501', detail = 'user_inactive';
    end if;

    begin
        insert into public.ledger (
            name,
            base_currency,
            owner_user_id,
            setup_status,
            setup_step,
            setup_draft,
            created_by,
            updated_by
        )
        values (
            btrim(p_name),
            upper(btrim(p_base_currency)),
            v_user_id,
            'in_progress',
            2,
            '{}'::jsonb,
            v_user_id,
            v_user_id
        )
        returning id into v_ledger_id;
    exception when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;
        if v_constraint = 'ledger_owner_in_progress_setup_key' then
            raise exception 'ledger_setup_in_progress_exists'
                using errcode = '23505', detail = 'ledger_setup_in_progress_exists';
        end if;
        raise;
    end;

    perform public.bootstrap_ledger_owner_member(v_ledger_id, v_user_id);

    perform public.upsert_ledger_member_display_setting(
        v_ledger_id,
        v_user_id,
        p_display_name,
        p_display_color
    );

    return v_ledger_id;
end;
$$;

-- 修改创建中账本的基本信息。默认货币变化时，在同一事务内移除草稿中与旧币种模板相关的
-- 部分（账户、商家、模板币种与版本），保留其他内容；货币未变时草稿不动。
create or replace function public.update_ledger_setup_basic_info(
    p_ledger_id uuid,
    p_name text,
    p_base_currency text,
    p_display_name text,
    p_display_color text
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_ledger public.ledger;
    v_currency text;
begin
    v_ledger := public.lock_current_user_setup_ledger(p_ledger_id);

    perform public.validate_ledger_basic_info(
        p_name,
        p_base_currency,
        p_display_name,
        p_display_color
    );

    v_currency := upper(btrim(p_base_currency));

    perform set_config('app.allow_ledger_setup_update', 'true', true);

    update public.ledger
       set name = btrim(p_name),
           base_currency = v_currency,
           setup_draft = case
               when v_ledger.base_currency = v_currency then setup_draft
               else setup_draft - array[
                   'templateCurrency',
                   'templateVersion',
                   'accounts',
                   'merchants'
               ]::text[]
           end,
           updated_by = v_user_id
     where id = p_ledger_id;

    perform set_config('app.allow_ledger_setup_update', 'false', true);

    perform public.upsert_ledger_member_display_setting(
        p_ledger_id,
        v_user_id,
        p_display_name,
        p_display_color
    );
end;
$$;

-- 保存向导草稿。草稿结构与模板 key / 版本由 Service 校验；数据库在持有账本行锁的
-- 前提下校验草稿记录的模板币种与账本当前默认货币一致，避免与修改货币的请求竞争。
create or replace function public.save_ledger_setup_draft(
    p_ledger_id uuid,
    p_step integer,
    p_draft jsonb
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_ledger public.ledger;
begin
    v_ledger := public.lock_current_user_setup_ledger(p_ledger_id);

    if p_step is null or p_step < 1 or p_step > 5 then
        raise exception 'ledger_setup_step_invalid'
            using errcode = '22023', detail = 'ledger_setup_step_invalid';
    end if;

    if p_draft is null or jsonb_typeof(p_draft) <> 'object' then
        raise exception 'ledger_setup_draft_invalid'
            using errcode = '22023', detail = 'ledger_setup_draft_invalid';
    end if;

    if octet_length(p_draft::text) > public.ledger_setup_draft_max_bytes() then
        raise exception 'ledger_setup_draft_too_large'
            using errcode = '22023', detail = 'ledger_setup_draft_too_large';
    end if;

    if p_draft ? 'templateCurrency'
       and p_draft ->> 'templateCurrency' is distinct from v_ledger.base_currency then
        raise exception 'ledger_setup_draft_currency_mismatch'
            using errcode = '22023', detail = 'ledger_setup_draft_currency_mismatch';
    end if;

    perform set_config('app.allow_ledger_setup_update', 'true', true);

    update public.ledger
       set setup_step = p_step,
           setup_draft = p_draft,
           updated_by = auth.uid()
     where id = p_ledger_id;

    perform set_config('app.allow_ledger_setup_update', 'false', true);
end;
$$;

-- 完成写入放行判定：只有 complete_ledger_setup 在事务内把
-- app.ledger_setup_completion_ledger_id 设为该账本，且该账本仍是当前用户作为 owner 的
-- 未归档创建中账本时返回 true。供权限 trigger 的 INSERT 分支调用。
create or replace function public.ledger_setup_completion_allows_insert(p_ledger_id uuid)
returns boolean
language sql stable
set search_path = pg_catalog, pg_temp
as $$
    select p_ledger_id is not null
       and p_ledger_id::text = nullif(current_setting('app.ledger_setup_completion_ledger_id', true), '')
       and exists (
           select 1
           from public.ledger l
           where l.id = p_ledger_id
             and l.owner_user_id = auth.uid()
             and l.setup_status = 'in_progress'
             and l.is_archived = false
       );
$$;

revoke all on function public.ledger_setup_completion_allows_insert(uuid) from public, anon, authenticated, service_role;

-- 在原有逻辑基础上，增加完成写入 RPC 的 INSERT 放行分支（账户、持有人、分类、商家、商家标签）。
create or replace function public.enforce_ledger_management_permission()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_row jsonb;
    v_ledger_id uuid;
    v_ledger_field text := coalesce(nullif(tg_argv[0], ''), 'ledger_id');
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    if tg_table_name = 'account'
       and tg_op = 'UPDATE'
       and current_setting('app.allow_account_balance_update', true) = 'true' then
        return new;
    end if;

    if tg_table_name = 'ledger'
       and tg_op = 'UPDATE'
       and current_setting('app.allow_ledger_setup_update', true) = 'true' then
        return new;
    end if;

    -- 认领迁移：旧占位引用改为当前用户，且除身份列与更新审计列外不变；
    -- 必须已有该用户接受的同账本绑定邀请、占位尚未标记认领、用户为 active 成员。
    -- 外层单独判断表名，避免其他表的 NEW/OLD 解析 account_holder 专有列。
    if tg_table_name = 'account_holder' and tg_op = 'UPDATE' then
        if old.placeholder_id is not null
           and new.placeholder_id is null
           and new.user_id = auth.uid()
           and new.updated_by = auth.uid()
           and (to_jsonb(new) - array['user_id', 'placeholder_id', 'updated_by', 'updated_at'])
               = (to_jsonb(old) - array['user_id', 'placeholder_id', 'updated_by', 'updated_at'])
           and exists (
               select 1
               from public.ledger_invite li
               where li.ledger_id = old.ledger_id
                 and li.placeholder_id = old.placeholder_id
                 and li.accepted_by = auth.uid()
                 and li.accepted_at is not null
           )
           and exists (
               select 1
               from public.ledger_placeholder_member p
               where p.id = old.placeholder_id
                 and p.ledger_id = old.ledger_id
                 and p.claimed_by is null
           )
           and exists (
               select 1
               from public.ledger_member lm
               join public.app_user au on au.id = lm.user_id
               where lm.ledger_id = old.ledger_id
                 and lm.user_id = auth.uid()
                 and lm.status = 'active'
                 and au.status = 'active'
           ) then
            return new;
        end if;
    end if;

    v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
    v_ledger_id := nullif(v_row ->> v_ledger_field, '')::uuid;

    if tg_op = 'INSERT'
       and tg_table_name in ('account', 'account_holder', 'category', 'merchant', 'merchant_tags')
       and public.ledger_setup_completion_allows_insert(v_ledger_id) then
        return new;
    end if;

    if v_ledger_id is null or not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

-- 在原有逻辑基础上，增加完成写入 RPC 的商家别名 INSERT 放行分支。
create or replace function public.enforce_merchant_alias_management_permission()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_merchant_id uuid;
    v_ledger_id uuid;
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    v_merchant_id := case when tg_op = 'DELETE' then old.merchant_id else new.merchant_id end;

    select m.ledger_id
      into v_ledger_id
      from public.merchant m
     where m.id = v_merchant_id;

    if tg_op = 'INSERT' and public.ledger_setup_completion_allows_insert(v_ledger_id) then
        return new;
    end if;

    if v_ledger_id is null or not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

-- 在原有逻辑基础上，增加完成写入 RPC 的商家标签关联 INSERT 放行分支。
create or replace function public.enforce_merchant_tag_link_management_permission()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_merchant_id uuid;
    v_ledger_id uuid;
begin
    if auth.uid() is null then
        return case when tg_op = 'DELETE' then old else new end;
    end if;

    v_merchant_id := case
        when tg_op = 'DELETE' then old.merchant_id
        else new.merchant_id
    end;

    select m.ledger_id into v_ledger_id
    from public.merchant m
    where m.id = v_merchant_id;

    if tg_op = 'INSERT' and public.ledger_setup_completion_allows_insert(v_ledger_id) then
        return new;
    end if;

    if v_ledger_id is null
       or not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- 完成写入 payload 的通用校验：结构、条数上限、字段长度、类型枚举、标签引用存在、
-- 名称在 payload 内不重复。payload 由 Service 根据草稿与代码模板生成；
-- owner 直接调用时最多写入自己账本的普通数据，与完成后手动添加等价。
create or replace function public.validate_ledger_setup_completion_payload(p_payload jsonb)
returns void
language plpgsql immutable
set search_path = pg_catalog, pg_temp
as $$
begin
    if p_payload is null
       or jsonb_typeof(p_payload) <> 'object'
       or jsonb_typeof(p_payload -> 'accounts') is distinct from 'array'
       or jsonb_typeof(p_payload -> 'merchantTags') is distinct from 'array'
       or jsonb_typeof(p_payload -> 'merchants') is distinct from 'array'
       or jsonb_typeof(p_payload -> 'specialStatusEnabled') is distinct from 'boolean'
       or jsonb_array_length(p_payload -> 'accounts') > 50
       or jsonb_array_length(p_payload -> 'merchantTags') > 50
       or jsonb_array_length(p_payload -> 'merchants') > 200 then
        raise exception 'ledger_setup_payload_invalid'
            using errcode = '22023', detail = 'ledger_setup_payload_invalid';
    end if;

    -- 账户：类型枚举、名称长度；同一类型内名称（忽略大小写）不重复。
    -- 向导中账户的币种与持有人都相同，因此与 account_active_name_unique 的范围一致。
    if exists (
           select 1
           from jsonb_array_elements(p_payload -> 'accounts') a(v)
           where jsonb_typeof(a.v) <> 'object'
              or jsonb_typeof(a.v -> 'type') is distinct from 'string'
              or jsonb_typeof(a.v -> 'name') is distinct from 'string'
              or a.v ->> 'type' not in ('cash', 'bank', 'credit_card', 'e_money')
              or length(btrim(a.v ->> 'name')) not between 1 and 100
       )
       or (
           select count(*)
           from (
               select distinct lower(btrim(a.v ->> 'name')), a.v ->> 'type'
               from jsonb_array_elements(p_payload -> 'accounts') a(v)
           ) distinct_accounts
       ) <> jsonb_array_length(p_payload -> 'accounts') then
        raise exception 'ledger_setup_payload_invalid'
            using errcode = '22023', detail = 'ledger_setup_payload_invalid';
    end if;

    -- 商家标签：key / 名称 / icon 长度；key 与名称（忽略大小写）不重复。
    if exists (
           select 1
           from jsonb_array_elements(p_payload -> 'merchantTags') t(v)
           where jsonb_typeof(t.v) <> 'object'
              or jsonb_typeof(t.v -> 'key') is distinct from 'string'
              or jsonb_typeof(t.v -> 'name') is distinct from 'string'
              or jsonb_typeof(t.v -> 'icon') is distinct from 'string'
              or length(t.v ->> 'key') not between 1 and 100
              or length(btrim(t.v ->> 'name')) not between 1 and 100
              or length(t.v ->> 'icon') not between 1 and 32
       )
       or (
           select count(distinct t.v ->> 'key')
           from jsonb_array_elements(p_payload -> 'merchantTags') t(v)
       ) <> jsonb_array_length(p_payload -> 'merchantTags')
       or (
           select count(distinct lower(btrim(t.v ->> 'name')))
           from jsonb_array_elements(p_payload -> 'merchantTags') t(v)
       ) <> jsonb_array_length(p_payload -> 'merchantTags') then
        raise exception 'ledger_setup_payload_invalid'
            using errcode = '22023', detail = 'ledger_setup_payload_invalid';
    end if;

    -- 商家：名称长度、官网 URL（https、长度）、别名与标签引用；名称（忽略大小写）不重复。
    if exists (
           select 1
           from jsonb_array_elements(p_payload -> 'merchants') m(v)
           where jsonb_typeof(m.v) <> 'object'
              or jsonb_typeof(m.v -> 'name') is distinct from 'string'
              or length(btrim(m.v ->> 'name')) not between 1 and 100
              or jsonb_typeof(m.v -> 'websiteUrl') not in ('string', 'null')
              or (
                  jsonb_typeof(m.v -> 'websiteUrl') = 'string'
                  and (
                      m.v ->> 'websiteUrl' !~ '^https://'
                      or length(m.v ->> 'websiteUrl') > 2048
                  )
              )
              or jsonb_typeof(m.v -> 'tagKeys') is distinct from 'array'
              or jsonb_typeof(m.v -> 'aliases') is distinct from 'array'
              or jsonb_array_length(m.v -> 'tagKeys') > 20
              or jsonb_array_length(m.v -> 'aliases') > 20
       )
       or (
           select count(distinct lower(btrim(m.v ->> 'name')))
           from jsonb_array_elements(p_payload -> 'merchants') m(v)
       ) <> jsonb_array_length(p_payload -> 'merchants') then
        raise exception 'ledger_setup_payload_invalid'
            using errcode = '22023', detail = 'ledger_setup_payload_invalid';
    end if;

    -- 标签引用：必须是字符串、存在于 merchantTags 中，且同一商家内不重复。
    if exists (
           select 1
           from jsonb_array_elements(p_payload -> 'merchants') m(v)
           cross join lateral jsonb_array_elements(m.v -> 'tagKeys') k(v)
           where jsonb_typeof(k.v) <> 'string'
              or not exists (
                  select 1
                  from jsonb_array_elements(p_payload -> 'merchantTags') t(v)
                  where t.v ->> 'key' = k.v #>> '{}'
              )
       )
       or exists (
           select 1
           from jsonb_array_elements(p_payload -> 'merchants') m(v)
           where (
               select count(distinct k.v)
               from jsonb_array_elements(m.v -> 'tagKeys') k(v)
           ) <> jsonb_array_length(m.v -> 'tagKeys')
       ) then
        raise exception 'ledger_setup_payload_invalid'
            using errcode = '22023', detail = 'ledger_setup_payload_invalid';
    end if;

    -- 别名：长度与 locale 符合 merchant_alias 的约束；同一商家内（忽略大小写）不重复。
    if exists (
           select 1
           from jsonb_array_elements(p_payload -> 'merchants') m(v)
           cross join lateral jsonb_array_elements(m.v -> 'aliases') a(v)
           where jsonb_typeof(a.v) <> 'object'
              or jsonb_typeof(a.v -> 'alias') is distinct from 'string'
              or length(btrim(a.v ->> 'alias')) not between 1 and 100
              or jsonb_typeof(a.v -> 'locale') not in ('string', 'null')
              or (
                  jsonb_typeof(a.v -> 'locale') = 'string'
                  and length(btrim(a.v ->> 'locale')) not between 2 and 20
              )
       )
       or exists (
           select 1
           from jsonb_array_elements(p_payload -> 'merchants') m(v)
           where (
               select count(distinct lower(btrim(a.v ->> 'alias')))
               from jsonb_array_elements(m.v -> 'aliases') a(v)
           ) <> jsonb_array_length(m.v -> 'aliases')
       ) then
        raise exception 'ledger_setup_payload_invalid'
            using errcode = '22023', detail = 'ledger_setup_payload_invalid';
    end if;
end;
$$;

revoke all on function public.validate_ledger_setup_completion_payload(jsonb) from public, anon, authenticated, service_role;

-- 向导完成写入。同一事务内依次写入默认分类 → 账户 → 商家标签 → 商家 → 商家别名 →
-- 商家标签关联 → 功能开关，再将账本标记为 completed 并切换为当前账本。
-- 账户、商家、商家标签为空（用户跳过）时正常完成。
create or replace function public.complete_ledger_setup(
    p_ledger_id uuid,
    p_payload jsonb
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_ledger public.ledger;
    v_item record;
    v_account_id uuid;
    v_merchant_id uuid;
    v_tag_id uuid;
    v_tag_ids jsonb := '{}'::jsonb;
begin
    v_ledger := public.lock_current_user_setup_ledger(p_ledger_id);

    perform public.validate_ledger_setup_completion_payload(p_payload);

    perform set_config('app.ledger_setup_completion_ledger_id', p_ledger_id::text, true);

    perform public.initialize_ledger_default_categories(p_ledger_id, v_user_id);

    for v_item in
        select a.v, a.ordinality
        from jsonb_array_elements(p_payload -> 'accounts') with ordinality a(v, ordinality)
        order by a.ordinality
    loop
        insert into public.account (
            ledger_id,
            name,
            type,
            currency,
            initial_balance,
            sort_order,
            created_by,
            updated_by
        ) values (
            p_ledger_id,
            btrim(v_item.v ->> 'name'),
            v_item.v ->> 'type',
            v_ledger.base_currency,
            0,
            v_item.ordinality - 1,
            v_user_id,
            v_user_id
        )
        returning id into v_account_id;

        insert into public.account_holder (
            ledger_id,
            account_id,
            user_id,
            role,
            created_by,
            updated_by
        ) values (
            p_ledger_id,
            v_account_id,
            v_user_id,
            'owner',
            v_user_id,
            v_user_id
        );
    end loop;

    for v_item in
        select t.v, t.ordinality
        from jsonb_array_elements(p_payload -> 'merchantTags') with ordinality t(v, ordinality)
        order by t.ordinality
    loop
        insert into public.merchant_tags (
            ledger_id,
            name,
            icon,
            sort_order,
            created_by
        ) values (
            p_ledger_id,
            btrim(v_item.v ->> 'name'),
            v_item.v ->> 'icon',
            v_item.ordinality - 1,
            v_user_id
        )
        returning id into v_tag_id;

        v_tag_ids := v_tag_ids || jsonb_build_object(v_item.v ->> 'key', v_tag_id);
    end loop;

    for v_item in
        select m.v, m.ordinality
        from jsonb_array_elements(p_payload -> 'merchants') with ordinality m(v, ordinality)
        order by m.ordinality
    loop
        insert into public.merchant (
            ledger_id,
            name,
            website_url,
            sort_order,
            created_by,
            updated_by
        ) values (
            p_ledger_id,
            btrim(v_item.v ->> 'name'),
            v_item.v ->> 'websiteUrl',
            v_item.ordinality - 1,
            v_user_id,
            v_user_id
        )
        returning id into v_merchant_id;

        insert into public.merchant_alias (
            merchant_id,
            alias,
            locale,
            sort_order,
            created_by,
            updated_by
        )
        select
            v_merchant_id,
            btrim(a.v ->> 'alias'),
            nullif(btrim(a.v ->> 'locale'), ''),
            a.ordinality - 1,
            v_user_id,
            v_user_id
        from jsonb_array_elements(v_item.v -> 'aliases') with ordinality a(v, ordinality);

        insert into public.merchant_tag_links (merchant_id, tag_id)
        select v_merchant_id, (v_tag_ids ->> k.tag_key)::uuid
        from jsonb_array_elements_text(v_item.v -> 'tagKeys') k(tag_key);
    end loop;

    perform set_config('app.ledger_setup_completion_ledger_id', '', true);

    perform set_config('app.allow_ledger_setup_update', 'true', true);

    update public.ledger
       set transaction_item_special_status_enabled = (p_payload ->> 'specialStatusEnabled')::boolean,
           setup_status = 'completed',
           setup_step = null,
           setup_draft = null,
           updated_by = v_user_id
     where id = p_ledger_id;

    perform set_config('app.allow_ledger_setup_update', 'false', true);

    update public.app_user
       set current_ledger_id = p_ledger_id,
           updated_by = v_user_id
     where id = v_user_id;
end;
$$;

revoke all on function public.complete_ledger_setup(uuid, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.complete_ledger_setup(uuid, jsonb) to authenticated;

drop function public.validate_ledger_setup_basic_info(text, text, text, text);

commit;
