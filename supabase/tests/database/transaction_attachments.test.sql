-- #1120：照片 bucket / 认领原子性 / 账本隔离 / 删除队列。
begin;
set local search_path = public, extensions;
select no_plan();

create function pg_temp.id(p_n integer) returns uuid
language sql immutable as $$
  select ('11200000-0000-4000-8000-' || lpad(p_n::text,12,'0'))::uuid;
$$;
create function pg_temp.set_user(p_user uuid) returns void
language sql as $$
  select set_config('request.jwt.claims',jsonb_build_object('sub',p_user,'role','authenticated')::text,true);
$$;
create function pg_temp.try_sql(p_sql text) returns text
language plpgsql as $$
begin
  execute p_sql;
  return 'ok';
exception when others then
  return SQLSTATE;
end;
$$;

select is((select public from storage.buckets where id='transaction-attachments'),
  false,'小票照片 bucket 为私有');
select is((select file_size_limit from storage.buckets where id='transaction-attachments'),
  2097152::bigint,'单文件最大 2MB');
select is((select allowed_mime_types from storage.buckets where id='transaction-attachments'),
  array['image/jpeg'],'仅可上传 JPEG');
select ok((select relrowsecurity from pg_class where oid='public.transaction_attachment'::regclass),
  '附件表启用 RLS');
select ok(not has_table_privilege('authenticated','public.transaction_attachment','insert')
  and not has_table_privilege('authenticated','public.transaction_attachment','update')
  and not has_table_privilege('authenticated','public.transaction_attachment','delete'),
  '客户端不可直接增删修改附件');
select ok(not has_function_privilege('authenticated',
  'public.sync_transaction_attachments(uuid,uuid,uuid[])','execute'),
  '内部照片同步函数不可直呼');
select ok(has_function_privilege('authenticated',
  'public.create_transaction(uuid,text,timestamptz,jsonb,jsonb,uuid,text,uuid[])','execute'),
  '普通交易新增接口支持照片参数');

-- 制造第二账本（由同一用户持有），验证活跃成员只能读取其所属账本。
insert into public.ledger(id,name,base_currency,owner_user_id,created_by,updated_by)
values(pg_temp.id(32),'照片测试隔离账本','JPY',
  '00000000-0000-4000-8000-000000000031',
  '00000000-0000-4000-8000-000000000031',
  '00000000-0000-4000-8000-000000000031');
insert into public.ledger_member(id,ledger_id,user_id,role,status,joined_at)
values(pg_temp.id(33),pg_temp.id(32),
  '00000000-0000-4000-8000-000000000031','owner','active',now());

-- 预置 7 张缩略图和原图的元数据，不通过公共客户端直接写表。
insert into public.transaction_attachment(
    id,ledger_id,status,storage_path,thumbnail_path,
    byte_size,width,height,created_by
)
select
    pg_temp.id(n),
    case when n=7 then pg_temp.id(32)
         else '00000000-0000-4000-8000-000000000032'::uuid end,
    case when n=5 then 'pending' else 'uploaded' end,
    case when n=7 then pg_temp.id(32)::text
         else '00000000-0000-4000-8000-000000000032' end
      || '/' || pg_temp.id(n)::text || '.jpg',
    case when n=7 then pg_temp.id(32)::text
         else '00000000-0000-4000-8000-000000000032' end
      || '/' || pg_temp.id(n)::text || '_thumb.jpg',
    200000, 1000, 800,
    case when n=4 then '00000000-0000-4000-8000-000000000034'::uuid
         else '00000000-0000-4000-8000-000000000031'::uuid end
from generate_series(1,7) n;

insert into storage.objects(bucket_id,name,owner_id)
select 'transaction-attachments',storage_path,created_by::text
from public.transaction_attachment;

set local role authenticated;
select pg_temp.set_user('00000000-0000-4000-8000-000000000034');
select is((select count(*) from public.transaction_attachment),6::bigint,
  '同账本成员能看到照片表中的 6 张，别的账本不可见');
select is((select count(*) from storage.objects where bucket_id='transaction-attachments'),
  6::bigint,'Storage RLS 也不能读取别的账本照片');
select is(pg_temp.try_sql(format(
  'select public.create_transaction(%L,%L,now(),%L::jsonb,%L::jsonb,%L,null,%L::uuid[])',
  '00000000-0000-4000-8000-000000000032','expense',
  '[{"amount":10,"categoryId":"00000000-0000-4000-8000-000000005021"}]',
  '[{"accountId":"00000000-0000-4000-8000-000000000043"}]',
  '00000000-0000-4000-8000-000000001001',
  array[pg_temp.id(1)]::text)), '22023',
  '其他成员不能认领自己没有上传的照片');
select pg_temp.set_user('00000000-0000-4000-8000-000000000031');
select is(pg_temp.try_sql(format(
  'select public.create_transaction(%L,%L,now(),%L::jsonb,%L::jsonb,%L,null,%L::uuid[])',
  '00000000-0000-4000-8000-000000000032','expense',
  '[{"amount":10,"categoryId":"00000000-0000-4000-8000-000000005021"}]',
  '[{"accountId":"00000000-0000-4000-8000-000000000043"}]',
  '00000000-0000-4000-8000-000000001001',
  array[pg_temp.id(5)]::text)), '22023',
  '未确认上传的照片不能认领');
select is(pg_temp.try_sql(format(
  'select public.create_transaction(%L,%L,now(),%L::jsonb,%L::jsonb,%L,null,%L::uuid[])',
  '00000000-0000-4000-8000-000000000032','expense',
  '[{"amount":10,"categoryId":"00000000-0000-4000-8000-000000005021"}]',
  '[{"accountId":"00000000-0000-4000-8000-000000000043"}]',
  '00000000-0000-4000-8000-000000001001',
  array[pg_temp.id(7)]::text)), '22023',
  '不能认领另一个账本的照片');
select is(pg_temp.try_sql(format(
  'select public.create_transaction(%L,%L,now(),%L::jsonb,%L::jsonb,%L,null,%L::uuid[])',
  '00000000-0000-4000-8000-000000000032','expense',
  '[{"amount":10,"categoryId":"00000000-0000-4000-8000-000000005021"}]',
  '[{"accountId":"00000000-0000-4000-8000-000000000043"}]',
  '00000000-0000-4000-8000-000000001001',
  array[pg_temp.id(1),pg_temp.id(1)]::text)), '22023',
  '同一张照片不能重复认领');
select is(pg_temp.try_sql(format(
  'select public.create_transaction(%L,%L,now(),%L::jsonb,%L::jsonb,%L,null,%L::uuid[])',
  '00000000-0000-4000-8000-000000000032','expense',
  '[{"amount":10,"categoryId":"00000000-0000-4000-8000-000000005021"}]',
  '[{"accountId":"00000000-0000-4000-8000-000000000043"}]',
  '00000000-0000-4000-8000-000000001001',
  array[pg_temp.id(1),pg_temp.id(2),pg_temp.id(3),pg_temp.id(4),pg_temp.id(5),pg_temp.id(6)]::text)),
  '22023','超过五张被拒绝');

create temporary table receipt_test_record(id uuid);
grant select,insert on receipt_test_record to authenticated;
insert into receipt_test_record
select public.create_transaction(
  '00000000-0000-4000-8000-000000000032','expense', now(),
  '[{"amount":10,"categoryId":"00000000-0000-4000-8000-000000005021"}]'::jsonb,
  '[{"accountId":"00000000-0000-4000-8000-000000000043"}]'::jsonb,
  '00000000-0000-4000-8000-000000001001', null,
  array[pg_temp.id(2),pg_temp.id(1)]);
select results_eq(
  $$select id from public.transaction_attachment
    where transaction_record_id=(select id from receipt_test_record)
    order by sort_order$$,
  array[pg_temp.id(2),pg_temp.id(1)],
  '认领顺序按用户选图顺序保存');
select is(pg_temp.try_sql(format(
  'select public.create_transaction(%L,%L,now(),%L::jsonb,%L::jsonb,%L,null,%L::uuid[])',
  '00000000-0000-4000-8000-000000000032','expense',
  '[{"amount":10,"categoryId":"00000000-0000-4000-8000-000000005021"}]',
  '[{"accountId":"00000000-0000-4000-8000-000000000043"}]',
  '00000000-0000-4000-8000-000000001001',
  array[pg_temp.id(1)]::text)), '22023',
  '已经被别的记录认领的照片不能重复使用');

select public.update_transaction(
  '00000000-0000-4000-8000-000000000032',
  (select id from receipt_test_record), 'expense', now(),
  '[{"amount":10,"categoryId":"00000000-0000-4000-8000-000000005021"}]'::jsonb,
  '[{"accountId":"00000000-0000-4000-8000-000000000043"}]'::jsonb,
  '00000000-0000-4000-8000-000000001001', null,
  array[pg_temp.id(1)]);
select is((select count(*) from public.transaction_attachment
  where transaction_record_id=(select id from receipt_test_record)),1::bigint,
  '编辑移除一张后只保留剩余照片');
reset role;
select is((select count(*) from public.transaction_attachment_storage_deletion
    where storage_path='00000000-0000-4000-8000-000000000032/'||pg_temp.id(2)::text||'.jpg'),
  1::bigint,'移除后的文件路径进入待删队列');
-- 即使绕过服务端直接调用确认 RPC，也不能跳过双文件存在检查。
set local role authenticated;
select pg_temp.set_user('00000000-0000-4000-8000-000000000031');
select is(
  pg_temp.try_sql(format(
    'select public.confirm_transaction_attachment_upload(%L,%L)',
    '00000000-0000-4000-8000-000000000032', pg_temp.id(5)
  )),
  '22023',
  '缺少缩略图时不能直接确认上传'
);
reset role;
insert into storage.objects(bucket_id,name,owner_id)
select 'transaction-attachments',thumbnail_path,created_by::text
from public.transaction_attachment where id=pg_temp.id(5);
set local role authenticated;
select pg_temp.set_user('00000000-0000-4000-8000-000000000031');
select is(
  pg_temp.try_sql(format(
    'select public.confirm_transaction_attachment_upload(%L,%L)',
    '00000000-0000-4000-8000-000000000032', pg_temp.id(5)
  )),
  'ok',
  '两张图片均存在时允许确认上传'
);
reset role;
select * from finish();
rollback;
