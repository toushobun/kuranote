-- Issue #944：兼容直接 INSERT 为 completed 的旧建账路径。
-- 向导由 setup_status 的 UPDATE 触发系统分类初始化；
-- create_ledger_with_owner_settings 通过 create_ledger_with_owner 直接插入 completed 账本。
-- 复用同一个幂等初始化函数，避免旧入口缺失三项系统分类。
create trigger ledger_system_categories_on_create
after insert on public.ledger
for each row
when (new.setup_status = 'completed')
execute function public.initialize_system_categories_after_setup();
