-- Issue #944：建立系统收入分类，并对系统分类与保留名称实施数据库保护。
-- 后续交易关联一致性及改选原支出的事务 RPC 在本 Issue 的后续改动中实现。

alter table public.category
  add column system_key text
  constraint category_system_key_check
  check (system_key in ('special_income', 'refund', 'reimbursement'));

create unique index category_ledger_system_key_unique
  on public.category (ledger_id, system_key)
  where system_key is not null;

-- 默认分类不再将真实核销到账当成普通收入类别。
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
        ('income', '💰 工资收入', '🏅 资格手当', '🏅', '#D1FAE5', 50),
        ('income', '💰 工资收入', '🏠 住房手当', '🏠', '#D1FAE5', 60),
        ('income', '💰 工资收入', '🚃 通勤手当', '🚃', '#D1FAE5', 70),
        ('income', '💰 工资收入', '💒 结婚手当', '💒', '#D1FAE5', 80),
        ('income', '💸 其他收入', '📈 理财收益', '📈', '#DBEAFE', 10),
        ('income', '💸 其他收入', '💼 活动返现', '💼', '#DBEAFE', 20),
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

create or replace function public.guard_system_category()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
declare
  v_parent_key text;
  v_normalized_name text;
  v_allow_system_write boolean :=
    current_user = 'postgres'
    and current_setting('app.allow_system_category_write', true) = 'true';
begin
  if tg_op = 'DELETE' then
    -- 删除整个账本由既有的受控 RPC 执行，不能被系统分类防线阻断。
    if public.ledger_deletion_allows_delete(old.ledger_id) then
      return old;
    end if;
    if old.system_key is not null then
      raise exception 'category_system_locked'
        using errcode = '22023', detail = 'category_system_locked';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.system_key is not null then
    -- 排序可以改变，但系统分类的身份、名称、图标及归档等业务字段不可改变。
    if (to_jsonb(new) - array['sort_order', 'updated_at', 'updated_by'])
       is distinct from
       (to_jsonb(old) - array['sort_order', 'updated_at', 'updated_by']) then
      raise exception 'category_system_locked'
        using errcode = '22023', detail = 'category_system_locked';
    end if;
    return new;
  end if;

  if new.system_key is not null and not v_allow_system_write then
    raise exception 'category_system_locked'
      using errcode = '22023', detail = 'category_system_locked';
  end if;

  if new.parent_id is not null then
    select c.system_key into v_parent_key
      from public.category c
     where c.id = new.parent_id
       and c.ledger_id = new.ledger_id;
    if v_parent_key = 'special_income'
       and coalesce(new.system_key, '') not in ('refund', 'reimbursement') then
      raise exception 'category_system_parent_locked'
        using errcode = '22023', detail = 'category_system_parent_locked';
    end if;
  end if;

  if new.system_key is not null then
    if new.type <> 'income'
       or (new.system_key = 'special_income' and new.parent_id is not null)
       or (new.system_key in ('refund', 'reimbursement')
           and (new.parent_id is null or v_parent_key is distinct from 'special_income')) then
      raise exception 'category_system_invalid'
        using errcode = '22023', detail = 'category_system_invalid';
    end if;
  else
    -- 分类库在存储名称前加 emoji 前缀，保留名称按用户实际看到的名称判断。
    v_normalized_name := btrim(
      regexp_replace(btrim(new.name), '^[^[:space:]]+[[:space:]]+', '')
    );
    if v_normalized_name in ('特殊收入', '退款', '报销') then
      raise exception 'category_name_reserved'
        using errcode = '22023', detail = 'category_name_reserved';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_system_category() from public, anon, authenticated, service_role;

create trigger category_guard_system
before insert or update or delete on public.category
for each row execute function public.guard_system_category();

create or replace function public.initialize_ledger_system_categories(
  p_ledger_id uuid,
  p_user_id uuid
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_root_id uuid;
begin
  perform set_config('app.allow_system_category_write', 'true', true);

  insert into public.category (
    ledger_id, parent_id, type, name, icon_name, color,
    system_key, sort_order, created_by, updated_by
  )
  values (
    p_ledger_id, null, 'income', '💸 特殊收入', '💸', '#DBEAFE',
    'special_income', 30, p_user_id, p_user_id
  )
  on conflict (ledger_id, system_key) where system_key is not null do nothing;

  select id into strict v_root_id
    from public.category
   where ledger_id = p_ledger_id and system_key = 'special_income';

  insert into public.category (
    ledger_id, parent_id, type, name, icon_name, color,
    system_key, sort_order, created_by, updated_by
  )
  values
    (p_ledger_id, v_root_id, 'income', '💴 退款', '💴', '#DBEAFE',
     'refund', 10, p_user_id, p_user_id),
    (p_ledger_id, v_root_id, 'income', '📄 报销', '📄', '#DBEAFE',
     'reimbursement', 20, p_user_id, p_user_id)
  on conflict (ledger_id, system_key) where system_key is not null do nothing;

  perform set_config('app.allow_system_category_write', 'false', true);
end;
$$;

revoke all on function public.initialize_ledger_system_categories(uuid, uuid)
  from public, anon, authenticated, service_role;

create or replace function public.initialize_system_categories_after_setup()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  perform public.initialize_ledger_system_categories(new.id, new.owner_user_id);
  return new;
end;
$$;

revoke all on function public.initialize_system_categories_after_setup()
  from public, anon, authenticated, service_role;

-- 创建账本先进入向导（in_progress），完成向导后转为 completed。
create trigger ledger_system_categories_on_completion
after update of setup_status on public.ledger
for each row
when (new.setup_status = 'completed' and old.setup_status is distinct from new.setup_status)
execute function public.initialize_system_categories_after_setup();

-- 当前开发库已有账本补齐；正式上线前不迁移旧关联记录。
do $$
declare
  v_ledger record;
begin
  for v_ledger in select id, owner_user_id from public.ledger loop
    perform public.initialize_ledger_system_categories(v_ledger.id, v_ledger.owner_user_id);
  end loop;
end;
$$;
