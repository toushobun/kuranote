-- 初始化新建账本的默认标签、分类、商家、商家别名。
-- 对应 Issue #253。

create or replace function public.initialize_ledger_default_data(
    p_ledger_id uuid,
    p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
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

    insert into public.transaction_tag (
        ledger_id,
        name,
        color,
        created_by,
        updated_by
    )
    select
        p_ledger_id,
        default_tag.name,
        default_tag.color,
        p_user_id,
        p_user_id
    from (
        values
        ('日常', '#E0F2FE', 10),
        ('腐败', '#FCE7F3', 20),
        ('公司', '#D1FAE5', 30),
        ('人情', '#BBF7D0', 40),
        ('孩子', '#FED7AA', 50),
        ('旅游', '#DBEAFE', 60),
        ('装修', '#DDD6FE', 70),
        ('结婚', '#FDE68A', 80)
    ) as default_tag(name, color, sort_order)
    where not exists (
        select 1
        from public.transaction_tag tt
        where tt.ledger_id = p_ledger_id
          and tt.is_archived = false
          and lower(tt.name) = lower(default_tag.name)
    );

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

-- 创建账本并同时创建 owner 成员关系与默认基础数据。
-- 该流程必须原子化，避免账本已创建但 owner 成员关系或默认数据缺失。
create or replace function public.create_ledger_with_owner(
    p_name text,
    p_base_currency text default 'JPY'
)
returns public.ledger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_ledger public.ledger;
begin
    v_user_id = auth.uid();

    if v_user_id is null then
        raise exception 'auth_required' using errcode = '42501';
    end if;

    if not exists (
        select 1
        from public.app_user au
        where au.id = v_user_id
          and au.status = 'active'
    ) then
        raise exception 'user_inactive' using errcode = '42501';
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
        v_ledger.id,
        v_user_id,
        'owner',
        'active',
        v_user_id,
        now(),
        now(),
        v_user_id,
        v_user_id
    );

    perform public.initialize_ledger_default_data(v_ledger.id, v_user_id);

    return v_ledger;
end;
$$;

revoke all on function public.create_ledger_with_owner(text, text) from public;
revoke all on function public.create_ledger_with_owner(text, text) from anon;

grant execute on function public.create_ledger_with_owner(text, text) to authenticated;
