-- Issue #550：移除尚未正式上线的交易整体标签功能。
-- 历史 migration 保持不变，本 migration 仅向前删除标签 schema 与 RPC 参数。

-- 账本初始化不再创建默认标签。
create or replace function public.initialize_ledger_default_data(
    p_ledger_id uuid,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_root record;
    v_child record;
    v_parent_id uuid;
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

revoke all on function public.initialize_ledger_default_data(uuid, uuid) from public;
revoke all on function public.initialize_ledger_default_data(uuid, uuid) from anon;
revoke all on function public.initialize_ledger_default_data(uuid, uuid) from authenticated;

-- 删除仍带标签参数或标签分组逻辑的旧 RPC 签名。
drop function if exists public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text, jsonb
);
drop function if exists public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text, jsonb
);
drop function if exists public.convert_transaction_type(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, jsonb, uuid, uuid, numeric
);
drop function if exists public.load_transaction_group_summaries(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid, uuid, uuid, integer, integer
);

-- 删除标签同步入口与表级触发器后，再删除关联表。
drop function if exists public.sync_transaction_record_tags(uuid, uuid, jsonb, uuid);

drop trigger if exists transaction_record_tag_require_write_permission
    on public.transaction_record_tag;
drop trigger if exists transaction_tag_require_management_permission
    on public.transaction_tag;
drop trigger if exists transaction_tag_set_updated_at
    on public.transaction_tag;

-- 该策略定义在 transaction_tag 上，但 USING 子查询依赖 transaction_record_tag，
-- 必须在删除关联表之前显式移除。
drop policy if exists "transaction_tag_select_assigned_archived"
    on public.transaction_tag;

drop table if exists public.transaction_record_tag;
drop table if exists public.transaction_tag;

-- create_transaction（移除标签参数）
create or replace function public.create_transaction(
    p_ledger_id uuid,
    p_type text,
    p_transaction_at timestamptz,
    p_items jsonb,
    p_account_id uuid,
    p_merchant_id uuid default null,
    p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_transaction_record_id uuid;
    v_user_id uuid := auth.uid();
    v_item jsonb;
    v_item_amount numeric(14,2);
    v_item_category_id uuid;
    v_item_category_type text;
    v_balance_delta numeric(14,2);
    v_sort_order integer := 0;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_type not in ('expense', 'income', 'normal') then
        raise exception 'transaction_type_invalid' using errcode = '22023';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
        raise exception 'items_invalid' using errcode = '22023';
    end if;

    if not exists (
        select 1 from public.account a
        where a.id = p_account_id
          and a.ledger_id = p_ledger_id
          and a.is_archived = false
    ) then
        raise exception 'account_invalid' using errcode = '22023';
    end if;

    if p_merchant_id is not null and not exists (
        select 1 from public.merchant m
        where m.id = p_merchant_id
          and m.ledger_id = p_ledger_id
          and m.is_archived = false
    ) then
        raise exception 'merchant_invalid' using errcode = '22023';
    end if;

    insert into public.transaction_record (
        ledger_id,
        type,
        status,
        transaction_at,
        merchant_id,
        title,
        note,
        created_by,
        updated_by
    ) values (
        p_ledger_id,
        'normal',
        'active',
        p_transaction_at,
        p_merchant_id,
        null,
        p_note,
        v_user_id,
        v_user_id
    ) returning id into v_transaction_record_id;

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_item_amount := (v_item ->> 'amount')::numeric(14,2);
        v_item_category_id := (v_item ->> 'categoryId')::uuid;

        if v_item_amount is null or v_item_amount < 0 or v_item_amount <> round(v_item_amount, 2) then
            raise exception 'amount_invalid' using errcode = '22023';
        end if;

        select c.type
        into v_item_category_type
        from public.category c
        where c.id = v_item_category_id
          and c.ledger_id = p_ledger_id
          and c.is_archived = false
          and c.parent_id is not null
          and c.type in ('expense', 'income');

        if v_item_category_type is null then
            raise exception 'category_invalid' using errcode = '22023';
        end if;

        v_balance_delta := case
            when v_item_category_type = 'expense' then -v_item_amount
            else v_item_amount
        end;

        insert into public.transaction_item (
            ledger_id,
            transaction_record_id,
            account_id,
            category_id,
            amount,
            discount_amount,
            balance_delta,
            note,
            sort_order,
            created_by,
            updated_by
        ) values (
            p_ledger_id,
            v_transaction_record_id,
            p_account_id,
            v_item_category_id,
            v_item_amount,
            0,
            v_balance_delta,
            null,
            v_sort_order,
            v_user_id,
            v_user_id
        );

        perform public.apply_account_balance_delta(
            p_ledger_id,
            p_account_id,
            v_balance_delta,
            v_user_id
        );

        v_sort_order := v_sort_order + 1;
    end loop;


    return v_transaction_record_id;
end;
$$;

revoke all on function public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text
) from public;
revoke all on function public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text
) from anon;
grant execute on function public.create_transaction(
    uuid, text, timestamptz, jsonb, uuid, uuid, text
) to authenticated;

-- update_transaction（移除标签参数）
create or replace function public.update_transaction(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_type text,
    p_transaction_at timestamptz,
    p_items jsonb,
    p_account_id uuid,
    p_merchant_id uuid,
    p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_record public.transaction_record;
    v_existing_item public.transaction_item;
    v_item jsonb;
    v_item_amount numeric(14,2);
    v_item_category_id uuid;
    v_item_category_type text;
    v_balance_delta numeric(14,2);
    v_sort_order integer := 0;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_type not in ('expense', 'income', 'normal') then
        raise exception 'transaction_type_invalid' using errcode = '22023';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
        raise exception 'items_invalid' using errcode = '22023';
    end if;

    if not exists (
        select 1 from public.account a
        where a.id = p_account_id
          and a.ledger_id = p_ledger_id
          and a.is_archived = false
    ) then
        raise exception 'account_invalid' using errcode = '22023';
    end if;

    if p_merchant_id is not null and not exists (
        select 1 from public.merchant m
        where m.id = p_merchant_id
          and m.ledger_id = p_ledger_id
          and m.is_archived = false
    ) then
        raise exception 'merchant_invalid' using errcode = '22023';
    end if;

    select *
    into v_record
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'normal'
    for update;

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    for v_existing_item in
        select *
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
        order by ti.sort_order, ti.id
        for update
    loop
        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_existing_item.account_id,
            -v_existing_item.balance_delta,
            v_user_id
        );
    end loop;

    delete from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id;

    update public.transaction_record tr
    set
        type = 'normal',
        transaction_at = p_transaction_at,
        merchant_id = p_merchant_id,
        note = p_note,
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active';

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_item_amount := (v_item ->> 'amount')::numeric(14,2);
        v_item_category_id := (v_item ->> 'categoryId')::uuid;

        if v_item_amount is null or v_item_amount < 0 or v_item_amount <> round(v_item_amount, 2) then
            raise exception 'amount_invalid' using errcode = '22023';
        end if;

        select c.type
        into v_item_category_type
        from public.category c
        where c.id = v_item_category_id
          and c.ledger_id = p_ledger_id
          and c.is_archived = false
          and c.parent_id is not null
          and c.type in ('expense', 'income');

        if v_item_category_type is null then
            raise exception 'category_invalid' using errcode = '22023';
        end if;

        v_balance_delta := case
            when v_item_category_type = 'expense' then -v_item_amount
            else v_item_amount
        end;

        insert into public.transaction_item (
            ledger_id,
            transaction_record_id,
            account_id,
            category_id,
            amount,
            discount_amount,
            balance_delta,
            note,
            sort_order,
            created_by,
            updated_by
        ) values (
            p_ledger_id,
            p_transaction_record_id,
            p_account_id,
            v_item_category_id,
            v_item_amount,
            0,
            v_balance_delta,
            null,
            v_sort_order,
            v_user_id,
            v_user_id
        );

        perform public.apply_account_balance_delta(
            p_ledger_id,
            p_account_id,
            v_balance_delta,
            v_user_id
        );

        v_sort_order := v_sort_order + 1;
    end loop;


    return p_transaction_record_id;
end;
$$;

revoke all on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) from public;
revoke all on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) from anon;
grant execute on function public.update_transaction(
    uuid, uuid, text, timestamptz, jsonb, uuid, uuid, text
) to authenticated;

-- convert_transaction_type（移除标签参数与关联清理）
create or replace function public.convert_transaction_type(
    p_ledger_id uuid,
    p_transaction_record_id uuid,
    p_target_type text,
    p_transaction_at timestamptz,
    p_note text default null,
    p_account_id uuid default null,
    p_merchant_id uuid default null,
    p_items jsonb default null,
    p_from_account_id uuid default null,
    p_to_account_id uuid default null,
    p_transfer_amount numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_record public.transaction_record;
    v_old_item public.transaction_item;
    v_new_item jsonb;
    v_item_amount numeric(14,2);
    v_item_category_id uuid;
    v_item_category_type text;
    v_balance_delta numeric(14,2);
    v_sort_order integer := 0;
    v_target_record_type text;
    v_old_account_ids uuid[];
    v_new_account_ids uuid[];
    v_all_account_ids uuid[];
    v_locked_account_count integer := 0;
    v_from_account public.account;
    v_to_account public.account;
    v_normal_account public.account;
    v_locked_account public.account;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_target_type not in ('expense', 'income', 'normal', 'transfer') then
        raise exception 'transaction_type_invalid' using errcode = '22023';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    v_target_record_type := case
        when p_target_type = 'transfer' then 'transfer'
        else 'normal'
    end;

    select *
    into v_record
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type in ('normal', 'transfer')
    for update;

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    if v_record.type = v_target_record_type then
        raise exception 'transaction_type_not_changed' using errcode = '22023';
    end if;

    select array_agg(distinct ti.account_id order by ti.account_id)
    into v_old_account_ids
    from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id;

    if coalesce(array_length(v_old_account_ids, 1), 0) = 0 then
        raise exception 'transaction_items_invalid' using errcode = '22023';
    end if;

    if v_target_record_type = 'transfer' then
        if p_from_account_id is null or p_to_account_id is null then
            raise exception 'transfer_account_invalid' using errcode = '22023';
        end if;

        if p_from_account_id = p_to_account_id then
            raise exception 'transfer_account_invalid' using errcode = '22023';
        end if;

        if p_transfer_amount is null or p_transfer_amount <= 0 or p_transfer_amount <> round(p_transfer_amount, 2) then
            raise exception 'amount_invalid' using errcode = '22023';
        end if;

        v_new_account_ids := array[p_from_account_id, p_to_account_id];
    else
        if p_account_id is null then
            raise exception 'account_invalid' using errcode = '22023';
        end if;

        if p_merchant_id is null or not exists (
            select 1 from public.merchant m
            where m.id = p_merchant_id
              and m.ledger_id = p_ledger_id
              and m.is_archived = false
        ) then
            raise exception 'merchant_invalid' using errcode = '22023';
        end if;

        if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
            raise exception 'items_invalid' using errcode = '22023';
        end if;

        for v_new_item in select * from jsonb_array_elements(p_items)
        loop
            v_item_amount := (v_new_item ->> 'amount')::numeric(14,2);
            v_item_category_id := (v_new_item ->> 'categoryId')::uuid;

            if v_item_amount is null or v_item_amount < 0 or v_item_amount <> round(v_item_amount, 2) then
                raise exception 'amount_invalid' using errcode = '22023';
            end if;

            if not exists (
                select 1 from public.category c
                where c.id = v_item_category_id
                  and c.ledger_id = p_ledger_id
                  and c.is_archived = false
                  and c.parent_id is not null
                  and c.type in ('expense', 'income')
            ) then
                raise exception 'category_invalid' using errcode = '22023';
            end if;
        end loop;

        v_new_account_ids := array[p_account_id];
    end if;

    v_all_account_ids := array(
        select distinct account_id
        from unnest(v_old_account_ids || v_new_account_ids) as account_id
        where account_id is not null
        order by account_id
    );

    for v_locked_account in
        select *
        from public.account a
        where a.id = any(v_all_account_ids)
          and a.ledger_id = p_ledger_id
        order by a.id
        for update
    loop
        v_locked_account_count := v_locked_account_count + 1;

        if v_locked_account.id = p_from_account_id then
            v_from_account := v_locked_account;
        end if;
        if v_locked_account.id = p_to_account_id then
            v_to_account := v_locked_account;
        end if;
        if v_locked_account.id = p_account_id then
            v_normal_account := v_locked_account;
        end if;
    end loop;

    if v_locked_account_count <> coalesce(array_length(v_all_account_ids, 1), 0) then
        raise exception 'account_invalid' using errcode = '22023';
    end if;

    if v_target_record_type = 'transfer' then
        if v_from_account.id is null or v_from_account.is_archived then
            raise exception 'from_account_invalid' using errcode = '22023';
        end if;

        if v_to_account.id is null or v_to_account.is_archived then
            raise exception 'to_account_invalid' using errcode = '22023';
        end if;

        if v_from_account.currency <> v_to_account.currency then
            raise exception 'transfer_currency_invalid' using errcode = '22023';
        end if;
    else
        if v_normal_account.id is null or v_normal_account.is_archived then
            raise exception 'account_invalid' using errcode = '22023';
        end if;
    end if;

    for v_old_item in
        select *
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
        order by ti.sort_order, ti.id
    loop
        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_old_item.account_id,
            -v_old_item.balance_delta,
            v_user_id
        );
    end loop;

    delete from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id;


    if v_target_record_type = 'transfer' then
        update public.transaction_record tr
        set
            type = 'transfer',
            merchant_id = null,
            transaction_at = p_transaction_at,
            note = p_note,
            updated_by = v_user_id,
            updated_at = now()
        where tr.id = p_transaction_record_id
          and tr.ledger_id = p_ledger_id;

        insert into public.transaction_item (
            ledger_id,
            transaction_record_id,
            account_id,
            category_id,
            amount,
            discount_amount,
            balance_delta,
            note,
            sort_order,
            created_by,
            updated_by
        ) values
        (
            p_ledger_id,
            p_transaction_record_id,
            p_from_account_id,
            null,
            p_transfer_amount,
            0,
            -p_transfer_amount,
            null,
            0,
            v_user_id,
            v_user_id
        ),
        (
            p_ledger_id,
            p_transaction_record_id,
            p_to_account_id,
            null,
            p_transfer_amount,
            0,
            p_transfer_amount,
            null,
            1,
            v_user_id,
            v_user_id
        );

        perform public.apply_account_balance_delta(p_ledger_id, p_from_account_id, -p_transfer_amount, v_user_id);
        perform public.apply_account_balance_delta(p_ledger_id, p_to_account_id, p_transfer_amount, v_user_id);
    else
        update public.transaction_record tr
        set
            type = 'normal',
            merchant_id = p_merchant_id,
            transaction_at = p_transaction_at,
            note = p_note,
            updated_by = v_user_id,
            updated_at = now()
        where tr.id = p_transaction_record_id
          and tr.ledger_id = p_ledger_id;

        v_sort_order := 0;
        for v_new_item in select * from jsonb_array_elements(p_items)
        loop
            v_item_amount := (v_new_item ->> 'amount')::numeric(14,2);
            v_item_category_id := (v_new_item ->> 'categoryId')::uuid;

            select c.type
            into v_item_category_type
            from public.category c
            where c.id = v_item_category_id
              and c.ledger_id = p_ledger_id
              and c.is_archived = false
              and c.parent_id is not null
              and c.type in ('expense', 'income');

            if v_item_category_type is null then
                raise exception 'category_invalid' using errcode = '22023';
            end if;

            v_balance_delta := case
                when v_item_category_type = 'expense' then -v_item_amount
                else v_item_amount
            end;

            insert into public.transaction_item (
                ledger_id,
                transaction_record_id,
                account_id,
                category_id,
                amount,
                discount_amount,
                balance_delta,
                note,
                sort_order,
                created_by,
                updated_by
            ) values (
                p_ledger_id,
                p_transaction_record_id,
                p_account_id,
                v_item_category_id,
                v_item_amount,
                0,
                v_balance_delta,
                null,
                v_sort_order,
                v_user_id,
                v_user_id
            );

            perform public.apply_account_balance_delta(p_ledger_id, p_account_id, v_balance_delta, v_user_id);
            v_sort_order := v_sort_order + 1;
        end loop;

    end if;

    return p_transaction_record_id;
end;
$$;

revoke all on function public.convert_transaction_type(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
) from public;
revoke all on function public.convert_transaction_type(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
) from anon;
grant execute on function public.convert_transaction_type(
    uuid, uuid, text, timestamptz, text, uuid, uuid, jsonb, uuid, uuid, numeric
) to authenticated;

-- 非时间维度分组不再接受标签筛选，也不再生成标签分组。
create or replace function public.load_transaction_group_summaries(
    p_ledger_id uuid,
    p_group_by text,
    p_date_start timestamptz default null,
    p_date_end timestamptz default null,
    p_record_type text default 'all',
    p_merchant_id uuid default null,
    p_account_id uuid default null,
    p_parent_category_id uuid default null,
    p_category_id uuid default null,
    p_member_id uuid default null,
    p_offset integer default 0,
    p_limit integer default 20
)
returns table (
    group_id text,
    group_key text,
    group_label text,
    income numeric,
    expense numeric,
    balance numeric,
    transaction_count integer,
    latest_transaction_at timestamptz
)
language sql
security definer
set search_path = pg_catalog, pg_temp
stable
as $$
    with record_amounts as (
        select
            tr.id,
            tr.ledger_id,
            tr.type,
            tr.transaction_at,
            tr.merchant_id,
            tr.created_by,
            coalesce(sum(
                case
                    when c.type = 'income' then ti.amount
                    when c.type = 'expense' then -ti.amount
                    else 0
                end
            ), 0) as net_amount,
            coalesce(bool_or(c.type = 'expense'), false) as has_expense,
            coalesce(bool_or(c.type = 'income'), false) as has_income
        from public.transaction_record tr
        left join public.transaction_item ti
          on ti.transaction_record_id = tr.id
         and ti.ledger_id = tr.ledger_id
        left join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        where tr.ledger_id = p_ledger_id
          and tr.status = 'active'
          and tr.type in ('normal', 'transfer')
          and public.current_user_is_active_ledger_member(p_ledger_id)
        group by
            tr.id,
            tr.ledger_id,
            tr.type,
            tr.transaction_at,
            tr.merchant_id,
            tr.created_by
    ),
    record_profiles as (
        select
            ra.*,
            case
                when ra.type = 'transfer' then 'transfer'
                when ra.net_amount > 0 then 'income'
                when ra.net_amount < 0 then 'expense'
                when ra.has_expense then 'expense'
                when ra.has_income then 'income'
                else 'expense'
            end as computed_record_type
        from record_amounts ra
    ),
    filtered_records as (
        select rp.*
        from record_profiles rp
        where p_group_by in (
            'merchant',
            'account',
            'parentCategory',
            'category',
            'member'
        )
          and p_record_type in ('all', 'income', 'expense', 'transfer')
          and (p_date_start is null or rp.transaction_at >= p_date_start)
          and (p_date_end is null or rp.transaction_at < p_date_end)
          and (
              p_record_type = 'all'
              or rp.computed_record_type = p_record_type
          )
          and (p_merchant_id is null or rp.merchant_id = p_merchant_id)
          and (p_member_id is null or rp.created_by = p_member_id)
          and (
              p_account_id is null
              or exists (
                  select 1
                  from public.transaction_item ti
                  where ti.ledger_id = p_ledger_id
                    and ti.transaction_record_id = rp.id
                    and ti.account_id = p_account_id
              )
          )
          and (
              p_category_id is null
              or exists (
                  select 1
                  from public.transaction_item ti
                  where ti.ledger_id = p_ledger_id
                    and ti.transaction_record_id = rp.id
                    and ti.category_id = p_category_id
              )
          )
          and (
              p_parent_category_id is null
              or exists (
                  select 1
                  from public.transaction_item ti
                  left join public.category c
                    on c.id = ti.category_id
                   and c.ledger_id = ti.ledger_id
                  left join public.category parent
                    on parent.id = c.parent_id
                   and parent.ledger_id = c.ledger_id
                  where ti.ledger_id = p_ledger_id
                    and ti.transaction_record_id = rp.id
                    and coalesce(parent.id, c.id) = p_parent_category_id
              )
          )
    ),
    record_group_rows as (
        select
            case
                when p_group_by = 'merchant' then 'merchant:' || coalesce(fr.merchant_id::text, 'unknown')
                else 'member:' || coalesce(fr.created_by::text, 'unknown')
            end as group_id,
            case
                when p_group_by = 'merchant' then coalesce(fr.merchant_id::text, 'unknown')
                else coalesce(fr.created_by::text, 'unknown')
            end as group_key,
            case
                when p_group_by = 'merchant' then coalesce(m.name, '未知商家')
                else coalesce(nullif(btrim(lmds.display_name), ''), au.display_name, '未知成员')
            end as group_label,
            fr.id as transaction_record_id,
            fr.transaction_at,
            case
                when fr.type = 'transfer' then 0
                else fr.net_amount
            end as signed_amount
        from filtered_records fr
        left join public.merchant m
          on m.id = fr.merchant_id
         and m.ledger_id = p_ledger_id
        left join public.app_user au
          on au.id = fr.created_by
        left join public.ledger_member_display_setting lmds
          on lmds.ledger_id = p_ledger_id
         and lmds.user_id = fr.created_by
        where p_group_by in ('merchant', 'member')
    ),
    item_group_rows as (
        select
            case
                when p_group_by = 'account' then 'account:' || ti.account_id::text
                when p_group_by = 'parentCategory' then 'parentCategory:' || coalesce(coalesce(parent.id, c.id)::text, 'unknown')
                else 'category:' || coalesce(c.id::text, 'unknown')
            end as group_id,
            case
                when p_group_by = 'account' then ti.account_id::text
                when p_group_by = 'parentCategory' then coalesce(coalesce(parent.id, c.id)::text, 'unknown')
                else coalesce(c.id::text, 'unknown')
            end as group_key,
            case
                when p_group_by = 'account' then coalesce(a.name, '未知账户')
                when p_group_by = 'parentCategory' then coalesce(parent.name, c.name, '未知大分类')
                else coalesce(c.name, '未知小分类')
            end as group_label,
            fr.id as transaction_record_id,
            fr.transaction_at,
            case
                when fr.type = 'transfer' then 0
                when c.type = 'income' then ti.amount
                when c.type = 'expense' then -ti.amount
                else 0
            end as signed_amount
        from filtered_records fr
        join public.transaction_item ti
          on ti.transaction_record_id = fr.id
         and ti.ledger_id = p_ledger_id
        left join public.account a
          on a.id = ti.account_id
         and a.ledger_id = ti.ledger_id
        left join public.category c
          on c.id = ti.category_id
         and c.ledger_id = ti.ledger_id
        left join public.category parent
          on parent.id = c.parent_id
         and parent.ledger_id = c.ledger_id
        where p_group_by in ('account', 'parentCategory', 'category')
    ),
    all_group_rows as (
        select * from record_group_rows
        union all
        select * from item_group_rows
    ),
    aggregated_groups as (
        select
            agr.group_id,
            agr.group_key,
            agr.group_label,
            coalesce(sum(
                case when agr.signed_amount > 0 then agr.signed_amount else 0 end
            ), 0) as income,
            coalesce(sum(
                case when agr.signed_amount < 0 then abs(agr.signed_amount) else 0 end
            ), 0) as expense,
            coalesce(sum(agr.signed_amount), 0) as balance,
            count(distinct agr.transaction_record_id)::integer as transaction_count,
            max(agr.transaction_at) as latest_transaction_at
        from all_group_rows agr
        group by agr.group_id, agr.group_key, agr.group_label
    )
    select
        ag.group_id,
        ag.group_key,
        ag.group_label,
        ag.income,
        ag.expense,
        ag.balance,
        ag.transaction_count,
        ag.latest_transaction_at
    from aggregated_groups ag
    order by ag.latest_transaction_at desc, ag.group_id asc
    limit greatest(coalesce(p_limit, 20), 0)
    offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.load_transaction_group_summaries(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid, uuid, integer, integer
) from public;
revoke all on function public.load_transaction_group_summaries(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid, uuid, integer, integer
) from anon;
grant execute on function public.load_transaction_group_summaries(
    uuid, text, timestamptz, timestamptz, text, uuid, uuid, uuid, uuid, uuid, integer, integer
) to authenticated;
