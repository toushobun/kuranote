begin;

set local search_path = public, extensions;

select plan(18);

select ok(
    to_regclass('public.transaction_consumer') is null,
    '消费者关联表已回收'
);
select ok(
    to_regprocedure('public.replace_transaction_consumers(uuid,uuid,uuid[],uuid)') is null,
    '消费者集合替换函数已回收'
);
select ok(
    to_regprocedure('public.set_default_transaction_consumer()') is null,
    '默认消费者 trigger 函数已回收'
);
select ok(
    to_regprocedure('public.validate_transaction_consumer_active_member()') is null,
    '消费者成员校验函数已回收'
);

select ok(
    to_regprocedure('public.create_transaction(uuid,text,timestamptz,jsonb,uuid,uuid,text)') is not null,
    '普通交易新增 RPC 恢复原签名'
);
select ok(
    to_regprocedure('public.create_transaction(uuid,text,timestamptz,jsonb,uuid,uuid,text,uuid[])') is null,
    '普通交易新增 RPC 不再接受消费者参数'
);
select ok(
    to_regprocedure('public.update_transaction(uuid,uuid,text,timestamptz,jsonb,uuid,uuid,text)') is not null,
    '普通交易编辑 RPC 恢复原签名'
);
select ok(
    to_regprocedure('public.update_transaction(uuid,uuid,text,timestamptz,jsonb,uuid,uuid,text,uuid[])') is null,
    '普通交易编辑 RPC 不再接受消费者参数'
);
select ok(
    to_regprocedure('public.create_transfer_transaction(uuid,timestamptz,numeric,uuid,uuid,text,uuid[])') is null,
    '转账新增 RPC 不再保留消费者重载'
);
select ok(
    to_regprocedure('public.update_transfer_transaction(uuid,uuid,timestamptz,numeric,uuid,uuid,text,uuid[])') is null,
    '转账编辑 RPC 不再保留消费者重载'
);
select ok(
    to_regprocedure('public.convert_transaction_type_with_special_status(uuid,uuid,text,timestamptz,text,uuid,uuid,jsonb,uuid,uuid,numeric)') is not null,
    '交易类型转换 RPC 恢复原签名'
);
select ok(
    to_regprocedure('public.convert_transaction_type_with_special_status(uuid,uuid,text,timestamptz,text,uuid,uuid,jsonb,uuid,uuid,numeric,uuid[])') is null,
    '交易类型转换 RPC 不再接受消费者参数'
);
select ok(
    to_regprocedure('public.update_linked_transaction_edit(uuid,uuid,timestamptz,uuid,text,jsonb)') is not null,
    '关联交易编辑 RPC 恢复原签名'
);
select ok(
    to_regprocedure('public.update_linked_transaction_edit(uuid,uuid,timestamptz,uuid,text,jsonb,uuid[])') is null,
    '关联交易编辑 RPC 不再接受消费者参数'
);

select ok(
    to_regprocedure('public.enforce_transaction_record_permission()') is not null,
    'transaction_record 写权限保护仍存在'
);
select ok(
    position(
        'new.created_by is distinct from auth.uid()'
        in pg_get_functiondef(to_regprocedure('public.enforce_transaction_record_permission()'))
    ) > 0,
    '新增交易时 created_by 必须等于当前登录用户'
);
select ok(
    position(
        'old.created_by is distinct from new.created_by'
        in pg_get_functiondef(to_regprocedure('public.enforce_transaction_record_permission()'))
    ) > 0,
    '编辑交易时禁止修改 created_by'
);
select ok(
    exists (
        select 1
        from pg_trigger t
        join pg_class c on c.oid = t.tgrelid
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = 'transaction_record'
          and t.tgname = 'transaction_record_require_write_permission'
          and not t.tgisinternal
    ),
    'transaction_record 的写权限 trigger 仍启用'
);

select * from finish();
rollback;
