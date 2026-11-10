-- Issue #1056：明细抽屉的「常用快捷」随旧记账页删除，常用分类查询已无调用方。
drop function public.load_frequent_transaction_category_counts(
    uuid,
    timestamptz,
    timestamptz,
    integer
);
