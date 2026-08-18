-- Issue #605 PR1：新增“核销超过原始支出”的结余状态。
-- 与使用该枚举值的函数定义拆成独立 migration，避免在同一事务内使用刚新增的 enum value。
alter type public.transaction_item_special_status
    add value if not exists 'reimbursement_surplus' after 'reimbursed';
