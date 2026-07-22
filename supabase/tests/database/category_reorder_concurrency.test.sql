begin;

create extension if not exists dblink with schema extensions;
set local search_path = public, extensions;

select plan(4);

do $$
declare
    connection_string constant text :=
        'host=127.0.0.1 port=5432 dbname=postgres user=postgres password=postgres';
begin
    perform extensions.dblink_connect('category_reorder_setup', connection_string);
    perform extensions.dblink_exec(
        'category_reorder_setup',
        $remote_setup$
            begin;

            delete from public.category
            where ledger_id = '46900000-0000-4000-8000-000000000003';

            delete from public.ledger_member
            where ledger_id = '46900000-0000-4000-8000-000000000003';

            delete from public.ledger
            where id = '46900000-0000-4000-8000-000000000003';

            insert into public.ledger (
                id,
                name,
                base_currency,
                owner_user_id,
                created_by,
                updated_by
            )
            values (
                '46900000-0000-4000-8000-000000000003',
                '分类排序并发测试账本',
                'JPY',
                '00000000-0000-4000-8000-000000000031',
                '00000000-0000-4000-8000-000000000031',
                '00000000-0000-4000-8000-000000000031'
            );

            insert into public.ledger_member (
                id,
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
                '46901000-0000-4000-8000-000000000004',
                '46900000-0000-4000-8000-000000000003',
                '00000000-0000-4000-8000-000000000031',
                'owner',
                'active',
                '00000000-0000-4000-8000-000000000031',
                now(),
                now(),
                '00000000-0000-4000-8000-000000000031',
                '00000000-0000-4000-8000-000000000031'
            );

            insert into public.category (
                id,
                ledger_id,
                parent_id,
                type,
                name,
                sort_order,
                created_by,
                updated_by
            )
            values
                (
                    '46950000-0000-4000-8000-000000000001',
                    '46900000-0000-4000-8000-000000000003',
                    null,
                    'expense',
                    '并发分类一',
                    30,
                    '00000000-0000-4000-8000-000000000031',
                    '00000000-0000-4000-8000-000000000031'
                ),
                (
                    '46950000-0000-4000-8000-000000000002',
                    '46900000-0000-4000-8000-000000000003',
                    null,
                    'expense',
                    '并发分类二',
                    10,
                    '00000000-0000-4000-8000-000000000031',
                    '00000000-0000-4000-8000-000000000031'
                ),
                (
                    '46950000-0000-4000-8000-000000000003',
                    '46900000-0000-4000-8000-000000000003',
                    null,
                    'expense',
                    '并发分类三',
                    20,
                    '00000000-0000-4000-8000-000000000031',
                    '00000000-0000-4000-8000-000000000031'
                );

            commit;
        $remote_setup$
    );

    perform extensions.dblink_connect('category_reorder_a', connection_string);
    perform extensions.dblink_connect('category_reorder_b', connection_string);

    perform extensions.dblink_exec('category_reorder_a', 'begin');
    perform extensions.dblink_exec(
        'category_reorder_a',
        'set role authenticated'
    );
    perform extensions.dblink_exec(
        'category_reorder_a',
        'set request.jwt.claim.sub = ''00000000-0000-4000-8000-000000000031'''
    );

    perform extensions.dblink_exec('category_reorder_b', 'begin');
    perform extensions.dblink_exec(
        'category_reorder_b',
        'set role authenticated'
    );
    perform extensions.dblink_exec(
        'category_reorder_b',
        'set request.jwt.claim.sub = ''00000000-0000-4000-8000-000000000031'''
    );

    perform extensions.dblink_send_query(
        'category_reorder_a',
        $request_a$
            select public.reorder_categories(
                '46900000-0000-4000-8000-000000000003',
                'expense',
                null,
                array[
                    '46950000-0000-4000-8000-000000000001'::uuid,
                    '46950000-0000-4000-8000-000000000002'::uuid,
                    '46950000-0000-4000-8000-000000000003'::uuid
                ]
            )
        $request_a$
    );
end;
$$;

select is(
    (
        select updated_count
        from extensions.dblink_get_result('category_reorder_a')
            as result(updated_count integer)
    ),
    3,
    '第一个并发排序请求完整写入'
);

do $$
begin
    perform extensions.dblink_send_query(
        'category_reorder_b',
        $request_b$
            select public.reorder_categories(
                '46900000-0000-4000-8000-000000000003',
                'expense',
                null,
                array[
                    '46950000-0000-4000-8000-000000000003'::uuid,
                    '46950000-0000-4000-8000-000000000001'::uuid,
                    '46950000-0000-4000-8000-000000000002'::uuid
                ]
            )
        $request_b$
    );
end;
$$;

select pg_sleep(0.2);

select is(
    extensions.dblink_is_busy('category_reorder_b'),
    1,
    '第二个并发请求等待第一个请求释放分类写锁'
);

do $$
begin
    perform extensions.dblink_exec('category_reorder_a', 'commit');
end;
$$;

do $$
declare
    attempt integer := 0;
begin
    while extensions.dblink_is_busy('category_reorder_b') = 1 loop
        perform pg_sleep(0.05);
        attempt := attempt + 1;

        if attempt > 100 then
            raise exception 'concurrent category reorder timed out';
        end if;
    end loop;
end;
$$;

select is(
    (
        select updated_count
        from extensions.dblink_get_result('category_reorder_b')
            as result(updated_count integer)
    ),
    3,
    '第二个并发排序请求在锁释放后完整写入'
);

do $$
begin
    perform extensions.dblink_exec('category_reorder_b', 'commit');
end;
$$;

select is(
    (
        select ordered_ids
        from extensions.dblink(
            'category_reorder_setup',
            $final_order$
                select array_agg(id order by sort_order)
                from public.category
                where ledger_id = '46900000-0000-4000-8000-000000000003'
                  and type = 'expense'
                  and parent_id is null
                  and is_archived = false
            $final_order$
        ) as result(ordered_ids uuid[])
    ),
    array[
        '46950000-0000-4000-8000-000000000003'::uuid,
        '46950000-0000-4000-8000-000000000001'::uuid,
        '46950000-0000-4000-8000-000000000002'::uuid
    ],
    '并发排序最终结果完整来自其中一个请求，不产生混合顺序'
);

do $$
begin
    perform extensions.dblink_exec(
        'category_reorder_setup',
        $remote_cleanup$
            begin;

            delete from public.category
            where ledger_id = '46900000-0000-4000-8000-000000000003';

            delete from public.ledger_member
            where ledger_id = '46900000-0000-4000-8000-000000000003';

            delete from public.ledger
            where id = '46900000-0000-4000-8000-000000000003';

            commit;
        $remote_cleanup$
    );

    perform extensions.dblink_disconnect('category_reorder_a');
    perform extensions.dblink_disconnect('category_reorder_b');
    perform extensions.dblink_disconnect('category_reorder_setup');
end;
$$;

select * from finish();

rollback;
