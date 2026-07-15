-- 此文件由 supabase/migrations 自动生成，禁止手工修改。
-- 更新命令：npm run db:schema:snapshot:update




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ledger_member" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "status" "text" DEFAULT 'invited'::"text" NOT NULL,
    "invited_by" "uuid",
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "joined_at" timestamp with time zone,
    "removed_by" "uuid",
    "removed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ledger_member_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'member'::"text", 'viewer'::"text"]))),
    CONSTRAINT "ledger_member_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'invited'::"text", 'removed'::"text"]))),
    CONSTRAINT "ledger_member_status_time_check" CHECK (((("status" = 'invited'::"text") AND ("joined_at" IS NULL) AND ("removed_at" IS NULL) AND ("removed_by" IS NULL)) OR (("status" = 'active'::"text") AND ("joined_at" IS NOT NULL) AND ("removed_at" IS NULL) AND ("removed_by" IS NULL)) OR (("status" = 'removed'::"text") AND ("removed_at" IS NOT NULL))))
);


ALTER TABLE "public"."ledger_member" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_ledger_invitation"("p_ledger_member_id" "uuid") RETURNS "public"."ledger_member"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_member public.ledger_member;
begin
    v_user_id = auth.uid();

    if v_user_id is null then
        raise exception '必须登录后才能接受邀请';
    end if;

    if not exists (
        select 1
        from public.app_user au
        where au.id = v_user_id
          and au.status = 'active'
    ) then
        raise exception '当前用户不存在或已停用';
    end if;

    update public.ledger_member
    set
        status = 'active',
        joined_at = now(),
        updated_by = v_user_id
    where id = p_ledger_member_id
      and user_id = v_user_id
      and status = 'invited'
    returning * into v_member;

    if not found then
        raise exception '邀请不存在、已处理，或不属于当前用户';
    end if;

    return v_member;
end;
$$;


ALTER FUNCTION "public"."accept_ledger_invitation"("p_ledger_member_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_ledger_invite"("p_token" "text") RETURNS TABLE("ledger_id" "uuid", "ledger_name" "text", "result" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_token_hash text;
    v_invite public.ledger_invite;
    v_ledger public.ledger;
    v_existing_status text;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_token is null or btrim(p_token) = '' or length(btrim(p_token)) > 256 then
        raise exception 'invite_invalid'
            using errcode = '22023', detail = 'invite_invalid';
    end if;

    v_token_hash := encode(extensions.digest(btrim(p_token), 'sha256'), 'hex');

    select *
      into v_invite
      from public.ledger_invite li
     where li.token_hash = v_token_hash
     for update;

    if v_invite.id is null or v_invite.revoked_at is not null then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    select *
      into v_ledger
      from public.ledger l
     where l.id = v_invite.ledger_id
       and l.is_archived = false;

    if v_ledger.id is null then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    select lm.status
      into v_existing_status
     from public.ledger_member lm
     where lm.ledger_id = v_invite.ledger_id
       and lm.user_id = v_user_id
       and lm.status <> 'removed';

    if v_existing_status = 'active' then
        insert into public.user_setting (user_id, current_ledger_id, created_by, updated_by)
        values (v_user_id, v_invite.ledger_id, v_user_id, v_user_id)
        on conflict (user_id) do update set
            current_ledger_id = excluded.current_ledger_id,
            updated_by = v_user_id;

        return query select v_ledger.id, v_ledger.name, 'already_member'::text;
        return;
    end if;

    if v_invite.accepted_at is not null then
        raise exception 'invite_already_used'
            using errcode = '23505', detail = 'invite_already_used';
    end if;

    perform set_config('app.allow_ledger_invite_accept', 'true', true);

    insert into public.ledger_member (
        ledger_id,
        user_id,
        role,
        status,
        joined_at,
        invited_by,
        created_by,
        updated_by
    ) values (
        v_invite.ledger_id,
        v_user_id,
        v_invite.role,
        'active',
        now(),
        v_invite.inviter_user_id,
        v_invite.inviter_user_id,
        v_user_id
    )
    on conflict (ledger_id, user_id) where status <> 'removed' do update set
        role = excluded.role,
        status = 'active',
        joined_at = now(),
        removed_at = null,
        removed_by = null,
        updated_by = v_user_id;

    perform set_config('app.allow_ledger_invite_accept', 'false', true);

    update public.ledger_invite
       set accepted_at = now(),
           accepted_by = v_user_id
     where id = v_invite.id;

    insert into public.user_setting (user_id, current_ledger_id, created_by, updated_by)
    values (v_user_id, v_invite.ledger_id, v_user_id, v_user_id)
    on conflict (user_id) do update set
        current_ledger_id = excluded.current_ledger_id,
        updated_by = v_user_id;

    return query select v_ledger.id, v_ledger.name, 'joined'::text;
end;
$$;


ALTER FUNCTION "public"."accept_ledger_invite"("p_token" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "currency" "text" DEFAULT 'JPY'::"text" NOT NULL,
    "initial_balance" numeric(14,2) DEFAULT 0 NOT NULL,
    "current_balance" numeric(14,2) DEFAULT 0 NOT NULL,
    "closing_day" integer,
    "payment_due_day" integer,
    "credit_limit" numeric(14,2),
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "archived_by" "uuid",
    "archived_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "account_archive_check" CHECK (((("is_archived" = false) AND ("archived_at" IS NULL) AND ("archived_by" IS NULL)) OR (("is_archived" = true) AND ("archived_at" IS NOT NULL)))),
    CONSTRAINT "account_closing_day_check" CHECK ((("closing_day" IS NULL) OR (("closing_day" >= 1) AND ("closing_day" <= 31)))),
    CONSTRAINT "account_credit_limit_check" CHECK ((("credit_limit" IS NULL) OR ("credit_limit" > (0)::numeric))),
    CONSTRAINT "account_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "account_name_check" CHECK ((("length"(TRIM(BOTH FROM "name")) >= 1) AND ("length"(TRIM(BOTH FROM "name")) <= 100))),
    CONSTRAINT "account_payment_due_day_check" CHECK ((("payment_due_day" IS NULL) OR (("payment_due_day" >= 1) AND ("payment_due_day" <= 31)))),
    CONSTRAINT "account_type_check" CHECK (("type" = ANY (ARRAY['cash'::"text", 'bank'::"text", 'credit_card'::"text", 'e_money'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."account" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_account_balance_delta"("p_ledger_id" "uuid", "p_account_id" "uuid", "p_delta" numeric, "p_updated_by" "uuid" DEFAULT NULL::"uuid") RETURNS "public"."account"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_account public.account;
begin
    if p_delta is null then
        raise exception '账户余额变动值不能为空';
    end if;

    -- 当前事务内临时允许受控余额更新
    perform set_config('app.allow_account_balance_update', 'true', true);

    update public.account
    set
        current_balance = current_balance + p_delta,
        updated_by = p_updated_by
    where id = p_account_id
      and ledger_id = p_ledger_id
      and is_archived = false
    returning * into v_account;

    if not found then
        raise exception '账户不存在、账本不匹配或账户已归档';
    end if;

    return v_account;
end;
$$;


ALTER FUNCTION "public"."apply_account_balance_delta"("p_ledger_id" "uuid", "p_account_id" "uuid", "p_delta" numeric, "p_updated_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_ledger_member_default_display_color"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor_id uuid;
begin
    if new.status <> 'active' then
        return new;
    end if;

    if tg_op = 'UPDATE' and old.status = 'active' then
        return new;
    end if;

    -- 同一账本的并发加入流程串行分配颜色，避免两名成员同时拿到同一个空闲色。
    perform 1
    from public.ledger l
    where l.id = new.ledger_id
    for update;

    v_actor_id = coalesce(auth.uid(), new.created_by, new.user_id);

    insert into public.ledger_member_display_setting (
        ledger_id,
        user_id,
        display_color,
        created_by,
        updated_by
    ) values (
        new.ledger_id,
        new.user_id,
        public.get_next_ledger_member_display_color(new.ledger_id),
        v_actor_id,
        v_actor_id
    )
    on conflict (ledger_id, user_id) do nothing;

    return new;
end;
$$;


ALTER FUNCTION "public"."assign_ledger_member_default_display_color"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."assign_ledger_member_default_display_color"() IS '成员首次成为 active 时自动建立账本内显示色设置。';



CREATE OR REPLACE FUNCTION "public"."cleanup_ledger_member_display_setting_on_member_leave"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    if old.status = 'active' and new.status <> 'active' then
        delete from public.ledger_member_display_setting setting
        where setting.ledger_id = old.ledger_id
          and setting.user_id = old.user_id;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."cleanup_ledger_member_display_setting_on_member_leave"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."convert_transaction_type"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_target_type" "text", "p_transaction_at" timestamp with time zone, "p_note" "text" DEFAULT NULL::"text", "p_account_id" "uuid" DEFAULT NULL::"uuid", "p_merchant_id" "uuid" DEFAULT NULL::"uuid", "p_items" "jsonb" DEFAULT NULL::"jsonb", "p_tag_names" "jsonb" DEFAULT '[]'::"jsonb", "p_from_account_id" "uuid" DEFAULT NULL::"uuid", "p_to_account_id" "uuid" DEFAULT NULL::"uuid", "p_transfer_amount" numeric DEFAULT NULL::numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

    delete from public.transaction_record_tag trt
    where trt.transaction_record_id = p_transaction_record_id
      and trt.ledger_id = p_ledger_id;

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

        perform public.sync_transaction_record_tags(
            p_ledger_id,
            p_transaction_record_id,
            coalesce(p_tag_names, '[]'::jsonb),
            v_user_id
        );
    end if;

    return p_transaction_record_id;
end;
$$;


ALTER FUNCTION "public"."convert_transaction_type"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_target_type" "text", "p_transaction_at" timestamp with time zone, "p_note" "text", "p_account_id" "uuid", "p_merchant_id" "uuid", "p_items" "jsonb", "p_tag_names" "jsonb", "p_from_account_id" "uuid", "p_to_account_id" "uuid", "p_transfer_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_account_with_holders"("p_ledger_id" "uuid", "p_name" "text", "p_type" "text", "p_currency" "text", "p_initial_balance" numeric, "p_holder_user_ids" "uuid"[] DEFAULT '{}'::"uuid"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_account_id uuid;
    v_holder_user_ids uuid[];
    v_active_holder_user_ids uuid[];
begin
    v_user_id = auth.uid();

    if v_user_id is null then
        raise exception 'must be authenticated';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'current user cannot write this ledger';
    end if;

    select coalesce(array_agg(distinct holder_user_id), '{}'::uuid[])
    into v_holder_user_ids
    from unnest(coalesce(p_holder_user_ids, '{}'::uuid[])) as holder_user_ids(holder_user_id);

    if cardinality(v_holder_user_ids) > 0 then
        with locked_active_holders as (
            select lm.user_id
            from public.ledger_member lm
            join public.app_user au
              on au.id = lm.user_id
            where lm.ledger_id = p_ledger_id
              and lm.user_id = any(v_holder_user_ids)
              and lm.status = 'active'
              and au.status = 'active'
            for update of lm
        )
        select coalesce(array_agg(user_id), '{}'::uuid[])
        into v_active_holder_user_ids
        from locked_active_holders;

        if cardinality(v_active_holder_user_ids) <> cardinality(v_holder_user_ids) then
            raise exception 'account holders must be active ledger members';
        end if;
    end if;

    insert into public.account (
        ledger_id,
        name,
        type,
        currency,
        initial_balance,
        sort_order,
        created_by,
        updated_by
    )
    values (
        p_ledger_id,
        p_name,
        p_type,
        p_currency,
        p_initial_balance,
        0,
        v_user_id,
        v_user_id
    )
    returning id into v_account_id;

    if cardinality(v_holder_user_ids) > 0 then
        insert into public.account_holder (
            ledger_id,
            account_id,
            user_id,
            role,
            created_by,
            updated_by
        )
        select
            p_ledger_id,
            v_account_id,
            holder_user_id,
            case
                when cardinality(v_holder_user_ids) = 1 then 'owner'
                else 'co_owner'
            end,
            v_user_id,
            v_user_id
        from unnest(v_holder_user_ids) as holder_user_ids(holder_user_id);
    end if;

    return v_account_id;
end;
$$;


ALTER FUNCTION "public"."create_account_with_holders"("p_ledger_id" "uuid", "p_name" "text", "p_type" "text", "p_currency" "text", "p_initial_balance" numeric, "p_holder_user_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_ledger_invite_v2"("p_ledger_id" "uuid", "p_role" "text" DEFAULT 'member'::"text") RETURNS TABLE("invite_id" "uuid", "token" "text", "ledger_name" "text", "invite_role" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_invite_id uuid;
    v_token text;
    v_role text := lower(btrim(coalesce(p_role, 'member')));
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_ledger_id is null then
        raise exception 'ledger_required'
            using errcode = '22023', detail = 'ledger_required';
    end if;

    if v_role not in ('admin', 'member', 'viewer') then
        raise exception 'invite_role_invalid'
            using errcode = '22023', detail = 'invite_role_invalid';
    end if;

    if not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    if not exists (
        select 1
        from public.ledger l
        where l.id = p_ledger_id
          and l.is_archived = false
    ) then
        raise exception 'ledger_not_found'
            using errcode = 'P0002', detail = 'ledger_not_found';
    end if;

    v_token := encode(extensions.gen_random_bytes(32), 'hex');

    insert into public.ledger_invite (
        ledger_id,
        inviter_user_id,
        token_hash,
        role,
        created_by
    ) values (
        p_ledger_id,
        v_user_id,
        encode(extensions.digest(v_token, 'sha256'), 'hex'),
        v_role,
        v_user_id
    )
    returning id into v_invite_id;

    return query
    select v_invite_id, v_token, l.name, v_role
    from public.ledger l
    where l.id = p_ledger_id;
end;
$$;


ALTER FUNCTION "public"."create_ledger_invite_v2"("p_ledger_id" "uuid", "p_role" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "base_currency" "text" DEFAULT 'JPY'::"text" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "archived_by" "uuid",
    "archived_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ledger_archive_check" CHECK (((("is_archived" = false) AND ("archived_at" IS NULL) AND ("archived_by" IS NULL)) OR (("is_archived" = true) AND ("archived_at" IS NOT NULL)))),
    CONSTRAINT "ledger_base_currency_check" CHECK (("base_currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "ledger_name_check" CHECK ((("length"(TRIM(BOTH FROM "name")) >= 1) AND ("length"(TRIM(BOTH FROM "name")) <= 100)))
);


ALTER TABLE "public"."ledger" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_ledger_with_owner"("p_name" "text", "p_base_currency" "text" DEFAULT 'JPY'::"text") RETURNS "public"."ledger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

    update public.app_user
    set
        current_ledger_id = v_ledger.id,
        updated_by = v_user_id
    where id = v_user_id;

    return v_ledger;
end;
$$;


ALTER FUNCTION "public"."create_ledger_with_owner"("p_name" "text", "p_base_currency" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_ledger_with_owner_settings"("p_name" "text", "p_base_currency" "text", "p_display_name" "text", "p_display_color" "text") RETURNS "public"."ledger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

    v_ledger = public.create_ledger_with_owner(
        btrim(p_name),
        upper(btrim(p_base_currency))
    );

    insert into public.ledger_member_display_setting (
        ledger_id,
        user_id,
        display_name,
        display_color,
        created_by,
        updated_by
    ) values (
        v_ledger.id,
        v_user_id,
        btrim(p_display_name),
        btrim(p_display_color),
        v_user_id,
        v_user_id
    )
    on conflict (ledger_id, user_id)
    do update set
        display_name = excluded.display_name,
        display_color = excluded.display_color,
        updated_by = v_user_id;

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


ALTER FUNCTION "public"."create_ledger_with_owner_settings"("p_name" "text", "p_base_currency" "text", "p_display_name" "text", "p_display_color" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_transaction"("p_ledger_id" "uuid", "p_type" "text", "p_transaction_at" timestamp with time zone, "p_items" "jsonb", "p_account_id" "uuid", "p_merchant_id" "uuid" DEFAULT NULL::"uuid", "p_note" "text" DEFAULT NULL::"text", "p_tag_names" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

    perform public.sync_transaction_record_tags(
        p_ledger_id,
        v_transaction_record_id,
        p_tag_names,
        v_user_id
    );

    return v_transaction_record_id;
end;
$$;


ALTER FUNCTION "public"."create_transaction"("p_ledger_id" "uuid", "p_type" "text", "p_transaction_at" timestamp with time zone, "p_items" "jsonb", "p_account_id" "uuid", "p_merchant_id" "uuid", "p_note" "text", "p_tag_names" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_transfer_transaction"("p_ledger_id" "uuid", "p_transaction_at" timestamp with time zone, "p_amount" numeric, "p_from_account_id" "uuid", "p_to_account_id" "uuid", "p_note" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_transaction_record_id uuid;
    v_user_id uuid := auth.uid();
    v_from_account public.account;
    v_to_account public.account;
    v_locked_account public.account;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
        raise exception 'amount_invalid' using errcode = '22023';
    end if;

    if p_from_account_id = p_to_account_id then
        raise exception 'transfer_account_invalid' using errcode = '22023';
    end if;

    for v_locked_account in
        select *
        from public.account a
        where a.id in (p_from_account_id, p_to_account_id)
          and a.ledger_id = p_ledger_id
          and a.is_archived = false
        order by a.id
        for update
    loop
        if v_locked_account.id = p_from_account_id then
            v_from_account := v_locked_account;
        elsif v_locked_account.id = p_to_account_id then
            v_to_account := v_locked_account;
        end if;
    end loop;

    if v_from_account.id is null then
        raise exception 'from_account_invalid' using errcode = '22023';
    end if;

    if v_to_account.id is null then
        raise exception 'to_account_invalid' using errcode = '22023';
    end if;

    if v_from_account.currency <> v_to_account.currency then
        raise exception 'transfer_currency_invalid' using errcode = '22023';
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
        'transfer',
        'active',
        p_transaction_at,
        null,
        null,
        p_note,
        v_user_id,
        v_user_id
    ) returning id into v_transaction_record_id;

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
        v_transaction_record_id,
        p_from_account_id,
        null,
        p_amount,
        0,
        -p_amount,
        null,
        0,
        v_user_id,
        v_user_id
    ),
    (
        p_ledger_id,
        v_transaction_record_id,
        p_to_account_id,
        null,
        p_amount,
        0,
        p_amount,
        null,
        1,
        v_user_id,
        v_user_id
    );

    perform public.apply_account_balance_delta(p_ledger_id, p_from_account_id, -p_amount, v_user_id);
    perform public.apply_account_balance_delta(p_ledger_id, p_to_account_id, p_amount, v_user_id);

    return v_transaction_record_id;
end;
$$;


ALTER FUNCTION "public"."create_transfer_transaction"("p_ledger_id" "uuid", "p_transaction_at" timestamp with time zone, "p_amount" numeric, "p_from_account_id" "uuid", "p_to_account_id" "uuid", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_app_user_is_active"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.app_user au
        where au.id = auth.uid()
          and au.status = 'active'
    );
$$;


ALTER FUNCTION "public"."current_app_user_is_active"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_can_manage_ledger"("p_ledger_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select public.current_user_has_ledger_role(
        p_ledger_id,
        array['owner', 'admin']::text[]
    );
$$;


ALTER FUNCTION "public"."current_user_can_manage_ledger"("p_ledger_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_can_manage_member_display_setting"("p_ledger_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.ledger_member lm
        join public.app_user au
          on au.id = lm.user_id
        where lm.ledger_id = p_ledger_id
          and lm.user_id = auth.uid()
          and lm.role in ('owner', 'admin')
          and lm.status = 'active'
          and au.status = 'active'
    );
$$;


ALTER FUNCTION "public"."current_user_can_manage_member_display_setting"("p_ledger_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_can_mutate_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.ledger_member lm
        join public.app_user au
          on au.id = lm.user_id
        join public.transaction_record tr
          on tr.ledger_id = lm.ledger_id
         and tr.id = p_transaction_record_id
        where lm.ledger_id = p_ledger_id
          and lm.user_id = auth.uid()
          and lm.status = 'active'
          and au.status = 'active'
          and tr.status = 'active'
          and (
              lm.role in ('owner', 'admin')
              or (lm.role = 'member' and tr.created_by = auth.uid())
          )
    );
$$;


ALTER FUNCTION "public"."current_user_can_mutate_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_can_write_ledger"("p_ledger_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select public.current_user_has_ledger_role(
        p_ledger_id,
        array['owner', 'admin', 'member']::text[]
    );
$$;


ALTER FUNCTION "public"."current_user_can_write_ledger"("p_ledger_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_has_ledger_role"("p_ledger_id" "uuid", "p_roles" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.ledger_member lm
        join public.app_user au
          on au.id = lm.user_id
        where lm.ledger_id = p_ledger_id
          and lm.user_id = auth.uid()
          and lm.status = 'active'
          and lm.role = any(p_roles)
          and au.status = 'active'
    );
$$;


ALTER FUNCTION "public"."current_user_has_ledger_role"("p_ledger_id" "uuid", "p_roles" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_is_active_ledger_member"("p_ledger_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.ledger_member lm
        join public.app_user au
          on au.id = lm.user_id
        where lm.ledger_id = p_ledger_id
          and lm.user_id = auth.uid()
          and lm.status = 'active'
          and au.status = 'active'
    );
$$;


ALTER FUNCTION "public"."current_user_is_active_ledger_member"("p_ledger_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_ledger_management_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

    v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
    v_ledger_id := nullif(v_row ->> v_ledger_field, '')::uuid;

    if v_ledger_id is null or not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;


ALTER FUNCTION "public"."enforce_ledger_management_permission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_ledger_member_management_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_ledger_id uuid;
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    v_ledger_id := case when tg_op = 'INSERT' then new.ledger_id else old.ledger_id end;

    if tg_op = 'INSERT'
       and current_setting('app.allow_ledger_invite_accept', true) = 'true'
       and new.user_id = auth.uid()
       and new.status = 'active'
       and new.role in ('admin', 'member', 'viewer')
       and new.invited_by is not null then
        return new;
    end if;

    if tg_op = 'UPDATE'
       and current_setting('app.allow_ledger_invite_accept', true) = 'true'
       and old.user_id = auth.uid()
       and new.user_id = old.user_id
       and new.ledger_id = old.ledger_id
       and new.status = 'active'
       and new.role in ('admin', 'member', 'viewer')
       and new.joined_at is not null
       and new.removed_at is null
       and new.removed_by is null
       and new.created_by = old.created_by
       and new.created_at = old.created_at
       and new.invited_by is not distinct from old.invited_by
       and new.updated_by = auth.uid() then
        return new;
    end if;

    if tg_op = 'UPDATE'
       and old.user_id = auth.uid()
       and new.user_id = old.user_id
       and new.ledger_id = old.ledger_id
       and old.status = 'invited'
       and new.status = 'active'
       and new.role = old.role
       and new.joined_at is not null
       and new.removed_at is null
       and new.removed_by is null then
        return new;
    end if;

    if not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;


ALTER FUNCTION "public"."enforce_ledger_member_management_permission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_merchant_alias_management_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

    if v_ledger_id is null or not public.current_user_can_manage_ledger(v_ledger_id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;


ALTER FUNCTION "public"."enforce_merchant_alias_management_permission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_transaction_child_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_old_ledger_id uuid;
    v_old_record_id uuid;
    v_new_ledger_id uuid;
    v_new_record_id uuid;
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    if tg_op <> 'INSERT' then
        v_old_ledger_id := old.ledger_id;
        v_old_record_id := old.transaction_record_id;

        if not public.current_user_can_mutate_transaction(v_old_ledger_id, v_old_record_id) then
            raise exception 'permission_denied' using errcode = '42501';
        end if;
    end if;

    if tg_op <> 'DELETE' then
        v_new_ledger_id := new.ledger_id;
        v_new_record_id := new.transaction_record_id;

        if not public.current_user_can_mutate_transaction(v_new_ledger_id, v_new_record_id) then
            raise exception 'permission_denied' using errcode = '42501';
        end if;
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;


ALTER FUNCTION "public"."enforce_transaction_child_permission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_transaction_record_permission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    if auth.uid() is null then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    if tg_op = 'INSERT' then
        if not public.current_user_can_write_ledger(new.ledger_id)
           or new.created_by is distinct from auth.uid() then
            raise exception 'permission_denied' using errcode = '42501';
        end if;
        return new;
    end if;

    if not public.current_user_can_mutate_transaction(old.ledger_id, old.id) then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'UPDATE' and old.created_by is distinct from new.created_by then
        raise exception 'permission_denied' using errcode = '42501';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;


ALTER FUNCTION "public"."enforce_transaction_record_permission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ledger_invite_preview"("p_token" "text") RETURNS TABLE("invite_status" "text", "ledger_name" "text", "inviter_name" "text", "invite_role" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_token_hash text;
begin
    if p_token is null or btrim(p_token) = '' or length(btrim(p_token)) > 256 then
        return query select 'invalid'::text, null::text, null::text, null::text;
        return;
    end if;

    v_token_hash := encode(extensions.digest(btrim(p_token), 'sha256'), 'hex');

    return query
    select
        case
            when auth.uid() is not null and exists (
                select 1
                from public.ledger_member lm
                where lm.ledger_id = li.ledger_id
                  and lm.user_id = auth.uid()
                  and lm.status = 'active'
            ) then 'already_member'
            when li.revoked_at is not null then 'revoked'
            when li.accepted_at is not null then 'accepted'
            when l.is_archived then 'invalid'
            else 'valid'
        end,
        l.name,
        coalesce(
            nullif(btrim(lds.display_name), ''),
            nullif(btrim(au.display_name), ''),
            '账本管理员'
        ),
        li.role
    from public.ledger_invite li
    join public.ledger l on l.id = li.ledger_id
    join public.app_user au on au.id = li.inviter_user_id
    left join public.ledger_member_display_setting lds
      on lds.ledger_id = li.ledger_id
     and lds.user_id = li.inviter_user_id
    where li.token_hash = v_token_hash;

    if not found then
        return query select 'invalid'::text, null::text, null::text, null::text;
    end if;
end;
$$;


ALTER FUNCTION "public"."get_ledger_invite_preview"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_ledger_member_display_color"("p_ledger_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    with color_options(display_color, sort_order) as (
        values
            ('amber'::text, 1),
            ('sakura'::text, 2),
            ('lime'::text, 3),
            ('jade'::text, 4),
            ('sky'::text, 5),
            ('lavender'::text, 6)
    )
    select coalesce(
        (
            select option.display_color
            from color_options option
            where not exists (
                select 1
                from public.ledger_member lm
                join public.ledger_member_display_setting setting
                  on setting.ledger_id = lm.ledger_id
                 and setting.user_id = lm.user_id
                where lm.ledger_id = p_ledger_id
                  and lm.status = 'active'
                  and setting.display_color = option.display_color
            )
            order by option.sort_order
            limit 1
        ),
        'amber'
    );
$$;


ALTER FUNCTION "public"."get_next_ledger_member_display_color"("p_ledger_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_next_ledger_member_display_color"("p_ledger_id" "uuid") IS '按成员颜色预设顺序返回账本内第一个未被 active 成员使用的颜色；全部占用时回退 amber。';



CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    insert into public.app_user (
        id,
        display_name,
        email
    )
    values (
        new.id,
        coalesce(
            nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
            nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
            '未命名用户'
        ),
        null
    )
    on conflict (id) do nothing;

    return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_ledger_default_data"("p_ledger_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."initialize_ledger_default_data"("p_ledger_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_pending_ledger_invites"("p_ledger_id" "uuid") RETURNS TABLE("invite_id" "uuid", "invite_role" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_ledger_id is null then
        raise exception 'ledger_required'
            using errcode = '22023', detail = 'ledger_required';
    end if;

    if not exists (
        select 1
        from public.ledger_member lm
        where lm.ledger_id = p_ledger_id
          and lm.user_id = v_user_id
          and lm.status = 'active'
    ) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    return query
    select li.id, li.role, li.created_at
    from public.ledger_invite li
    where li.ledger_id = p_ledger_id
      and li.accepted_at is null
      and li.revoked_at is null
    order by li.created_at desc, li.id;
end;
$$;


ALTER FUNCTION "public"."list_pending_ledger_invites"("p_ledger_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."load_transaction_group_summaries"("p_ledger_id" "uuid", "p_group_by" "text", "p_date_start" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_date_end" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_record_type" "text" DEFAULT 'all'::"text", "p_merchant_id" "uuid" DEFAULT NULL::"uuid", "p_account_id" "uuid" DEFAULT NULL::"uuid", "p_parent_category_id" "uuid" DEFAULT NULL::"uuid", "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_tag_id" "uuid" DEFAULT NULL::"uuid", "p_member_id" "uuid" DEFAULT NULL::"uuid", "p_offset" integer DEFAULT 0, "p_limit" integer DEFAULT 20) RETURNS TABLE("group_id" "text", "group_key" "text", "group_label" "text", "income" numeric, "expense" numeric, "balance" numeric, "transaction_count" integer, "latest_transaction_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
            'tag',
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
          and (
              p_tag_id is null
              or exists (
                  select 1
                  from public.transaction_record_tag trt
                  where trt.ledger_id = p_ledger_id
                    and trt.transaction_record_id = rp.id
                    and trt.tag_id = p_tag_id
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
    active_record_tags as (
        select
            trt.transaction_record_id,
            tt.id as tag_id,
            tt.name as tag_name
        from public.transaction_record_tag trt
        join public.transaction_tag tt
          on tt.id = trt.tag_id
         and tt.ledger_id = trt.ledger_id
         and tt.is_archived = false
        where trt.ledger_id = p_ledger_id
    ),
    tag_group_rows as (
        select
            'tag:' || art.tag_id::text as group_id,
            art.tag_id::text as group_key,
            art.tag_name as group_label,
            fr.id as transaction_record_id,
            fr.transaction_at,
            case
                when fr.type = 'transfer' then 0
                else fr.net_amount
            end as signed_amount
        from filtered_records fr
        join active_record_tags art
          on art.transaction_record_id = fr.id
        where p_group_by = 'tag'

        union all

        select
            'tag:untagged' as group_id,
            'untagged' as group_key,
            '无标签' as group_label,
            fr.id as transaction_record_id,
            fr.transaction_at,
            case
                when fr.type = 'transfer' then 0
                else fr.net_amount
            end as signed_amount
        from filtered_records fr
        where p_group_by = 'tag'
          and not exists (
              select 1
              from active_record_tags art
              where art.transaction_record_id = fr.id
          )
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
        select * from tag_group_rows
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


ALTER FUNCTION "public"."load_transaction_group_summaries"("p_ledger_id" "uuid", "p_group_by" "text", "p_date_start" timestamp with time zone, "p_date_end" timestamp with time zone, "p_record_type" "text", "p_merchant_id" "uuid", "p_account_id" "uuid", "p_parent_category_id" "uuid", "p_category_id" "uuid", "p_tag_id" "uuid", "p_member_id" "uuid", "p_offset" integer, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_transaction_record_type_for_compat"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    if new.type in ('expense', 'income', 'refund', 'reimbursement') then
        new.type := 'normal';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."normalize_transaction_record_type_for_compat"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_direct_account_balance_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if old.current_balance is distinct from new.current_balance then
        if current_setting('app.allow_account_balance_update', true) is distinct from 'true' then
            raise exception '不允许直接修改账户当前余额，请通过受控余额更新流程处理';
        end if;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."prevent_direct_account_balance_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_ledger_member_display_setting_identity_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if old.ledger_id <> new.ledger_id then
        raise exception '不允许修改成员显示色所属账本';
    end if;

    if old.user_id <> new.user_id then
        raise exception '不允许修改成员显示色所属用户';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."prevent_ledger_member_display_setting_identity_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_ledger_member_identity_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if old.id <> new.id then
        raise exception '不允许修改账本成员 id';
    end if;

    if old.ledger_id <> new.ledger_id then
        raise exception '不允许修改账本成员所属账本';
    end if;

    if old.user_id <> new.user_id then
        raise exception '不允许修改账本成员用户';
    end if;

    if old.role <> new.role
       and coalesce(current_setting('app.allow_ledger_member_role_change', true), '') <> 'on' then
        raise exception '不允许直接修改账本成员角色';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."prevent_ledger_member_identity_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_merchant_alias_identity_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if old.id <> new.id then
        raise exception '不允许修改商家别名 id';
    end if;

    if old.merchant_id <> new.merchant_id then
        raise exception '不允许修改商家别名所属商家';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."prevent_merchant_alias_identity_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_used_category_type_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    if old.type is distinct from new.type
       and exists (
           select 1
           from public.transaction_item ti
           where ti.ledger_id = old.ledger_id
             and ti.category_id = old.id
           limit 1
       ) then
        raise exception 'category_type_locked' using errcode = '23514';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."prevent_used_category_type_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."replace_ledger_invite"("p_ledger_id" "uuid", "p_invite_id" "uuid") RETURNS TABLE("invite_id" "uuid", "token" "text", "ledger_name" "text", "invite_role" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_invite public.ledger_invite;
    v_new_invite_id uuid;
    v_token text;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_ledger_id is null or p_invite_id is null then
        raise exception 'invite_invalid'
            using errcode = '22023', detail = 'invite_invalid';
    end if;

    if not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    select *
      into v_invite
      from public.ledger_invite li
     where li.id = p_invite_id
       and li.ledger_id = p_ledger_id
     for update;

    if v_invite.id is null or v_invite.revoked_at is not null then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    if v_invite.accepted_at is not null then
        raise exception 'invite_already_used'
            using errcode = '23505', detail = 'invite_already_used';
    end if;

    if v_invite.role not in ('admin', 'member', 'viewer') then
        raise exception 'invite_role_invalid'
            using errcode = '22023', detail = 'invite_role_invalid';
    end if;

    if not exists (
        select 1
        from public.ledger l
        where l.id = p_ledger_id
          and l.is_archived = false
    ) then
        raise exception 'ledger_not_found'
            using errcode = 'P0002', detail = 'ledger_not_found';
    end if;

    v_token := encode(extensions.gen_random_bytes(32), 'hex');

    update public.ledger_invite
       set revoked_at = now(),
           revoked_by = v_user_id
     where id = v_invite.id;

    insert into public.ledger_invite (
        ledger_id,
        inviter_user_id,
        token_hash,
        role,
        created_by
    ) values (
        p_ledger_id,
        v_user_id,
        encode(extensions.digest(v_token, 'sha256'), 'hex'),
        v_invite.role,
        v_user_id
    )
    returning id into v_new_invite_id;

    return query
    select v_new_invite_id, v_token, l.name, v_invite.role
    from public.ledger l
    where l.id = p_ledger_id;
end;
$$;


ALTER FUNCTION "public"."replace_ledger_invite"("p_ledger_id" "uuid", "p_invite_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_ledger_invite"("p_ledger_id" "uuid", "p_invite_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_invite public.ledger_invite;
begin
    if v_user_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    if p_ledger_id is null or p_invite_id is null then
        raise exception 'invite_invalid'
            using errcode = '22023', detail = 'invite_invalid';
    end if;

    if not public.current_user_can_manage_ledger(p_ledger_id) then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    select *
      into v_invite
      from public.ledger_invite li
     where li.id = p_invite_id
       and li.ledger_id = p_ledger_id
     for update;

    if v_invite.id is null then
        raise exception 'invite_invalid'
            using errcode = 'P0002', detail = 'invite_invalid';
    end if;

    if v_invite.accepted_at is not null then
        raise exception 'invite_already_used'
            using errcode = '23505', detail = 'invite_already_used';
    end if;

    if v_invite.revoked_at is not null then
        raise exception 'invite_already_revoked'
            using errcode = '23505', detail = 'invite_already_revoked';
    end if;

    update public.ledger_invite
       set revoked_at = now(),
           revoked_by = v_user_id
     where id = v_invite.id;
end;
$$;


ALTER FUNCTION "public"."revoke_ledger_invite"("p_ledger_id" "uuid", "p_invite_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_account_initial_current_balance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.current_balance = new.initial_balance;
    return new;
end;
$$;


ALTER FUNCTION "public"."set_account_initial_current_balance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_ledger_member_display_setting_audit_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
    v_user_id uuid;
begin
    v_user_id = auth.uid();

    if v_user_id is null then
        return new;
    end if;

    if tg_op = 'INSERT' then
        new.created_by = v_user_id;
        new.updated_by = v_user_id;
    else
        new.created_by = old.created_by;
        new.updated_by = v_user_id;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."set_ledger_member_display_setting_audit_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_transaction_record_tags"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_tag_names" "jsonb", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_max_tag_count constant integer := 10;
    v_max_tag_name_length constant integer := 40;
    v_raw_tag jsonb;
    v_tag_name text;
    v_tag_names text[] := '{}';
    v_tag_id uuid;
    v_tag_ids uuid[] := '{}';
    v_sort_order integer := 0;
begin
    if p_tag_names is null then
        p_tag_names := '[]'::jsonb;
    end if;

    if jsonb_typeof(p_tag_names) <> 'array' then
        raise exception 'tag_names_invalid' using errcode = '22023';
    end if;

    for v_raw_tag in select * from jsonb_array_elements(p_tag_names)
    loop
        v_tag_name := nullif(trim(v_raw_tag #>> '{}'), '');

        if v_tag_name is null then
            continue;
        end if;

        if length(v_tag_name) > v_max_tag_name_length then
            raise exception 'tag_name_invalid' using errcode = '22023';
        end if;

        if not exists (
            select 1
            from unnest(v_tag_names) as existing_tag(name)
            where lower(existing_tag.name) = lower(v_tag_name)
        ) then
            if coalesce(array_length(v_tag_names, 1), 0) >= v_max_tag_count then
                raise exception 'tag_count_invalid' using errcode = '22023';
            end if;

            v_tag_names := array_append(v_tag_names, v_tag_name);
        end if;
    end loop;

    foreach v_tag_name in array v_tag_names
    loop
        v_tag_id := null;

        -- 编辑保存时优先复用当前记录已关联的同名标签，包含已归档标签。
        -- 这样 no-op 编辑不会把历史归档标签重新创建为 active 标签。
        select tt.id
        into v_tag_id
        from public.transaction_record_tag trt
        join public.transaction_tag tt
          on tt.id = trt.tag_id
         and tt.ledger_id = trt.ledger_id
        where trt.ledger_id = p_ledger_id
          and trt.transaction_record_id = p_transaction_record_id
          and lower(tt.name) = lower(v_tag_name)
        order by trt.sort_order asc
        limit 1;

        if v_tag_id is null then
            select tt.id
            into v_tag_id
            from public.transaction_tag tt
            where tt.ledger_id = p_ledger_id
              and tt.is_archived = false
              and lower(tt.name) = lower(v_tag_name)
            limit 1;
        end if;

        if v_tag_id is null then
            begin
                insert into public.transaction_tag (
                    ledger_id,
                    name,
                    created_by,
                    updated_by
                ) values (
                    p_ledger_id,
                    v_tag_name,
                    p_user_id,
                    p_user_id
                )
                returning id into v_tag_id;
            exception when unique_violation then
                select tt.id
                into v_tag_id
                from public.transaction_tag tt
                where tt.ledger_id = p_ledger_id
                  and tt.is_archived = false
                  and lower(tt.name) = lower(v_tag_name)
                limit 1;
            end;
        end if;

        -- 极端竞态下（INSERT 冲突后对方立即删除）兜底
        if v_tag_id is null then
            raise exception 'tag_sync_failed' using errcode = '22023';
        end if;

        v_tag_ids := array_append(v_tag_ids, v_tag_id);
    end loop;

    delete from public.transaction_record_tag trt
    where trt.ledger_id = p_ledger_id
      and trt.transaction_record_id = p_transaction_record_id;

    foreach v_tag_id in array v_tag_ids
    loop
        insert into public.transaction_record_tag (
            ledger_id,
            transaction_record_id,
            tag_id,
            sort_order,
            created_by
        ) values (
            p_ledger_id,
            p_transaction_record_id,
            v_tag_id,
            v_sort_order,
            p_user_id
        )
        on conflict do nothing;

        v_sort_order := v_sort_order + 1;
    end loop;
end;
$$;


ALTER FUNCTION "public"."sync_transaction_record_tags"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_tag_names" "jsonb", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_account_with_holders"("p_ledger_id" "uuid", "p_account_id" "uuid", "p_name" "text", "p_type" "text", "p_currency" "text", "p_holder_user_ids" "uuid"[] DEFAULT '{}'::"uuid"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_user_id uuid;
    v_updated_account_id uuid;
    v_holder_user_ids uuid[];
    v_active_holder_user_ids uuid[];
begin
    v_user_id = auth.uid();

    if v_user_id is null then
        raise exception 'must be authenticated';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'current user cannot write this ledger';
    end if;

    select coalesce(array_agg(distinct holder_user_id), '{}'::uuid[])
    into v_holder_user_ids
    from unnest(coalesce(p_holder_user_ids, '{}'::uuid[])) as holder_user_ids(holder_user_id);

    if cardinality(v_holder_user_ids) > 0 then
        with locked_active_holders as (
            select lm.user_id
            from public.ledger_member lm
            join public.app_user au
              on au.id = lm.user_id
            where lm.ledger_id = p_ledger_id
              and lm.user_id = any(v_holder_user_ids)
              and lm.status = 'active'
              and au.status = 'active'
            for update of lm
        )
        select coalesce(array_agg(user_id), '{}'::uuid[])
        into v_active_holder_user_ids
        from locked_active_holders;

        if cardinality(v_active_holder_user_ids) <> cardinality(v_holder_user_ids) then
            raise exception 'account holders must be active ledger members';
        end if;
    end if;

    update public.account
    set
        name = p_name,
        type = p_type,
        currency = p_currency,
        updated_by = v_user_id
    where id = p_account_id
      and ledger_id = p_ledger_id
      and is_archived = false
    returning id into v_updated_account_id;

    if v_updated_account_id is null then
        raise exception 'account not found';
    end if;

    delete from public.account_holder
    where account_holder.ledger_id = p_ledger_id
      and account_holder.account_id = p_account_id
      and not (account_holder.user_id = any(v_holder_user_ids))
      and exists (
          select 1
          from public.ledger_member lm
          join public.app_user au
            on au.id = lm.user_id
          where lm.ledger_id = account_holder.ledger_id
            and lm.user_id = account_holder.user_id
            and lm.status = 'active'
            and au.status = 'active'
      );

    if cardinality(v_holder_user_ids) > 0 then
        insert into public.account_holder (
            ledger_id,
            account_id,
            user_id,
            role,
            created_by,
            updated_by
        )
        select
            p_ledger_id,
            p_account_id,
            holder_user_id,
            case
                when cardinality(v_holder_user_ids) = 1 then 'owner'
                else 'co_owner'
            end,
            v_user_id,
            v_user_id
        from unnest(v_holder_user_ids) as holder_user_ids(holder_user_id)
        on conflict (account_id, user_id)
        do update set
            role = excluded.role,
            updated_by = excluded.updated_by;
    end if;

    return v_updated_account_id;
end;
$$;


ALTER FUNCTION "public"."update_account_with_holders"("p_ledger_id" "uuid", "p_account_id" "uuid", "p_name" "text", "p_type" "text", "p_currency" "text", "p_holder_user_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ledger_member_settings"("p_ledger_id" "uuid", "p_member_user_id" "uuid", "p_display_name" "text", "p_display_color" "text", "p_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor_id uuid;
    v_actor_role text;
    v_current_role text;
    v_can_manage_member boolean;
begin
    v_actor_id = auth.uid();

    if v_actor_id is null then
        raise exception 'auth_required'
            using errcode = '42501', detail = 'auth_required';
    end if;

    select lm.role
      into v_actor_role
      from public.ledger_member lm
      join public.app_user au
        on au.id = lm.user_id
     where lm.ledger_id = p_ledger_id
       and lm.user_id = v_actor_id
       and lm.status = 'active'
       and au.status = 'active';

    if not found then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    v_can_manage_member = v_actor_role in ('owner', 'admin');

    if not v_can_manage_member and v_actor_id <> p_member_user_id then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    if p_display_name is null or btrim(p_display_name) = '' then
        raise exception 'display_name_required'
            using errcode = '22023', detail = 'display_name_required';
    end if;

    if length(btrim(p_display_name)) > 100 then
        raise exception 'display_name_too_long'
            using errcode = '22023', detail = 'display_name_too_long';
    end if;

    if p_display_color not in (
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

    if p_role not in ('owner', 'admin', 'member', 'viewer') then
        raise exception 'role_invalid'
            using errcode = '22023', detail = 'role_invalid';
    end if;

    select lm.role
      into v_current_role
      from public.ledger_member lm
      join public.app_user au
        on au.id = lm.user_id
     where lm.ledger_id = p_ledger_id
       and lm.user_id = p_member_user_id
       and lm.status = 'active'
       and au.status = 'active'
     for update of lm;

    if not found then
        raise exception 'member_not_found'
            using errcode = '22023', detail = 'member_not_found';
    end if;

    if not v_can_manage_member and p_role <> v_current_role then
        raise exception 'permission_denied'
            using errcode = '42501', detail = 'permission_denied';
    end if;

    -- 所有者权限转移需要单独设计，避免误操作导致无 owner 或多 owner。
    if (v_current_role = 'owner' and p_role <> 'owner')
       or (v_current_role <> 'owner' and p_role = 'owner') then
        raise exception 'role_invalid'
            using errcode = '22023', detail = 'role_invalid';
    end if;

    insert into public.ledger_member_display_setting (
        ledger_id,
        user_id,
        display_name,
        display_color,
        created_by,
        updated_by
    ) values (
        p_ledger_id,
        p_member_user_id,
        btrim(p_display_name),
        p_display_color,
        v_actor_id,
        v_actor_id
    )
    on conflict (ledger_id, user_id)
    do update set
        display_name = excluded.display_name,
        display_color = excluded.display_color,
        updated_by = v_actor_id;

    if v_can_manage_member and p_role <> v_current_role then
        perform set_config('app.allow_ledger_member_role_change', 'on', true);

        update public.ledger_member
           set role = p_role,
               updated_by = v_actor_id
         where ledger_id = p_ledger_id
           and user_id = p_member_user_id
           and status = 'active';

        perform set_config('app.allow_ledger_member_role_change', 'off', true);
    end if;
end;
$$;


ALTER FUNCTION "public"."update_ledger_member_settings"("p_ledger_id" "uuid", "p_member_user_id" "uuid", "p_display_name" "text", "p_display_color" "text", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_type" "text", "p_transaction_at" timestamp with time zone, "p_items" "jsonb", "p_account_id" "uuid", "p_merchant_id" "uuid", "p_note" "text" DEFAULT NULL::"text", "p_tag_names" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

    perform public.sync_transaction_record_tags(
        p_ledger_id,
        p_transaction_record_id,
        p_tag_names,
        v_user_id
    );

    return p_transaction_record_id;
end;
$$;


ALTER FUNCTION "public"."update_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_type" "text", "p_transaction_at" timestamp with time zone, "p_items" "jsonb", "p_account_id" "uuid", "p_merchant_id" "uuid", "p_note" "text", "p_tag_names" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transfer_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_transaction_at" timestamp with time zone, "p_amount" numeric, "p_from_account_id" "uuid", "p_to_account_id" "uuid", "p_note" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_record public.transaction_record;
    v_old_from_account_id uuid;
    v_old_to_account_id uuid;
    v_old_amount numeric(14,2);
    v_item_count integer := 0;
    v_category_null_item_count integer := 0;
    v_positive_item_count integer := 0;
    v_negative_item_count integer := 0;
    v_positive_amount_count integer := 0;
    v_amount_delta_match_count integer := 0;
    v_distinct_amount_count integer := 0;
    v_balance_delta_total numeric(14,2) := 0;
    v_all_account_ids uuid[];
    v_from_account public.account;
    v_to_account public.account;
    v_locked_account public.account;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

    if p_transaction_at is null then
        raise exception 'transaction_at_invalid' using errcode = '22023';
    end if;

    if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
        raise exception 'amount_invalid' using errcode = '22023';
    end if;

    if p_from_account_id = p_to_account_id then
        raise exception 'transfer_account_invalid' using errcode = '22023';
    end if;

    select *
    into v_record
    from public.transaction_record tr
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active'
      and tr.type = 'transfer'
    for update;

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    select
        count(*)::integer,
        count(*) filter (where ti.category_id is null)::integer,
        count(*) filter (where ti.balance_delta > 0)::integer,
        count(*) filter (where ti.balance_delta < 0)::integer,
        count(*) filter (where ti.amount > 0)::integer,
        count(*) filter (where ti.amount = abs(ti.balance_delta))::integer,
        count(distinct ti.amount)::integer,
        coalesce(sum(ti.balance_delta), 0)
    into
        v_item_count,
        v_category_null_item_count,
        v_positive_item_count,
        v_negative_item_count,
        v_positive_amount_count,
        v_amount_delta_match_count,
        v_distinct_amount_count,
        v_balance_delta_total
    from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id;

    if v_item_count <> 2
        or v_category_null_item_count <> 2
        or v_positive_item_count <> 1
        or v_negative_item_count <> 1
        or v_positive_amount_count <> 2
        or v_amount_delta_match_count <> 2
        or v_distinct_amount_count <> 1
        or v_balance_delta_total <> 0 then
        raise exception 'transfer_items_invalid' using errcode = '22023';
    end if;

    select account_id, amount
    into v_old_from_account_id, v_old_amount
    from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id
      and ti.balance_delta < 0;

    select account_id
    into v_old_to_account_id
    from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id
      and ti.balance_delta > 0;

    v_all_account_ids := array(
        select distinct unnest(array[
            v_old_from_account_id,
            v_old_to_account_id,
            p_from_account_id,
            p_to_account_id
        ])
        order by 1
    );

    for v_locked_account in
        select *
        from public.account a
        where a.id = any(v_all_account_ids)
          and a.ledger_id = p_ledger_id
        order by a.id
        for update
    loop
        if v_locked_account.id = p_from_account_id then
            v_from_account := v_locked_account;
        end if;
        if v_locked_account.id = p_to_account_id then
            v_to_account := v_locked_account;
        end if;
    end loop;

    if v_from_account.id is null or v_from_account.is_archived then
        raise exception 'from_account_invalid' using errcode = '22023';
    end if;

    if v_to_account.id is null or v_to_account.is_archived then
        raise exception 'to_account_invalid' using errcode = '22023';
    end if;

    if v_from_account.currency <> v_to_account.currency then
        raise exception 'transfer_currency_invalid' using errcode = '22023';
    end if;

    perform public.apply_account_balance_delta(p_ledger_id, v_old_from_account_id, v_old_amount, v_user_id);
    perform public.apply_account_balance_delta(p_ledger_id, v_old_to_account_id, -v_old_amount, v_user_id);

    delete from public.transaction_item ti
    where ti.transaction_record_id = p_transaction_record_id
      and ti.ledger_id = p_ledger_id;

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
        p_amount,
        0,
        -p_amount,
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
        p_amount,
        0,
        p_amount,
        null,
        1,
        v_user_id,
        v_user_id
    );

    perform public.apply_account_balance_delta(p_ledger_id, p_from_account_id, -p_amount, v_user_id);
    perform public.apply_account_balance_delta(p_ledger_id, p_to_account_id, p_amount, v_user_id);

    update public.transaction_record tr
    set
        transaction_at = p_transaction_at,
        note = p_note,
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id;

    return p_transaction_record_id;
end;
$$;


ALTER FUNCTION "public"."update_transfer_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_transaction_at" timestamp with time zone, "p_amount" numeric, "p_from_account_id" "uuid", "p_to_account_id" "uuid", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_account_holder_active_member"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if not exists (
        select 1
        from public.ledger_member lm
        join public.app_user au on au.id = lm.user_id
        where lm.ledger_id = new.ledger_id
          and lm.user_id = new.user_id
          and lm.status = 'active'
          and au.status = 'active'
    ) then
        raise exception 'account holder must be an active ledger member';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_account_holder_active_member"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_app_user_current_ledger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if new.current_ledger_id is null then
        return new;
    end if;

    if not exists (
        select 1
        from public.ledger_member lm
        join public.ledger l
          on l.id = lm.ledger_id
        where lm.user_id = new.id
          and lm.ledger_id = new.current_ledger_id
          and lm.status = 'active'
          and l.is_archived = false
    ) then
        raise exception 'current_ledger_id_invalid' using errcode = '42501';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_app_user_current_ledger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_budget_category"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if new.is_archived = false then
        if not exists (
            select 1
            from public.category c
            where c.id = new.category_id
              and c.ledger_id = new.ledger_id
              and c.is_archived = false
        ) then
            raise exception '预算不能引用不存在或已归档的分类';
        end if;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_budget_category"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_category_parent"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
    v_parent_type text;
    v_parent_parent_id uuid;
    v_parent_is_archived boolean;
begin
    if new.parent_id is null then
        return new;
    end if;

    select
        c.type,
        c.parent_id,
        c.is_archived
    into
        v_parent_type,
        v_parent_parent_id,
        v_parent_is_archived
    from public.category c
    where c.id = new.parent_id
      and c.ledger_id = new.ledger_id;

    if not found then
        raise exception '父分类不存在或不属于同一账本';
    end if;

    if v_parent_parent_id is not null then
        raise exception '分类只允许大分类 / 小分类两级结构';
    end if;

    if v_parent_type <> new.type then
        raise exception '子分类类型必须与父分类类型一致';
    end if;

    if new.is_archived = false and v_parent_is_archived = true then
        raise exception '未归档子分类不能挂到已归档父分类下面';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_category_parent"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_ledger_member_display_setting_member"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    perform 1
    from public.ledger_member lm
    join public.app_user au
      on au.id = lm.user_id
    where lm.ledger_id = new.ledger_id
      and lm.user_id = new.user_id
      and lm.status = 'active'
      and au.status = 'active'
    for update of lm;

    if not found then
        raise exception 'member display setting target must be an active ledger member';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_ledger_member_display_setting_member"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_transaction_item_category_shape"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_record_type text;
begin
    select tr.type
    into v_record_type
    from public.transaction_record tr
    where tr.id = new.transaction_record_id
      and tr.ledger_id = new.ledger_id;

    if v_record_type is null then
        raise exception 'transaction_record_invalid' using errcode = '23503';
    end if;

    if v_record_type = 'transfer' and new.category_id is not null then
        raise exception 'transaction_item_category_invalid' using errcode = '23514';
    end if;

    if v_record_type = 'normal' and new.category_id is null then
        raise exception 'transaction_item_category_required' using errcode = '23514';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_transaction_item_category_shape"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_transaction_record"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if new.status = 'active' and new.merchant_id is not null then
        if not exists (
            select 1
            from public.merchant m
            where m.id = new.merchant_id
              and m.ledger_id = new.ledger_id
              and m.is_archived = false
        ) then
            raise exception '记账记录不能引用不存在或已归档的商家';
        end if;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."validate_transaction_record"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."void_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_user_id uuid := auth.uid();
    v_record public.transaction_record;
    v_item public.transaction_item;
    v_item_count integer := 0;
    v_category_null_item_count integer := 0;
    v_positive_item_count integer := 0;
    v_negative_item_count integer := 0;
    v_positive_amount_count integer := 0;
    v_amount_delta_match_count integer := 0;
    v_distinct_amount_count integer := 0;
    v_balance_delta_total numeric(14,2) := 0;
begin
    if v_user_id is null then
        raise exception 'not_authenticated' using errcode = '28000';
    end if;

    if not public.current_user_can_write_ledger(p_ledger_id) then
        raise exception 'ledger_forbidden' using errcode = '42501';
    end if;

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

    perform 1
    from public.account a
    where a.ledger_id = p_ledger_id
      and a.id in (
          select distinct ti.account_id
          from public.transaction_item ti
          where ti.transaction_record_id = p_transaction_record_id
            and ti.ledger_id = p_ledger_id
      )
    order by a.id
    for update;

    if v_record.type = 'transfer' then
        perform 1
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
        order by ti.account_id, ti.id
        for update;

        select
            count(*)::integer,
            count(*) filter (where ti.category_id is null)::integer,
            count(*) filter (where ti.balance_delta > 0)::integer,
            count(*) filter (where ti.balance_delta < 0)::integer,
            count(*) filter (where ti.amount > 0)::integer,
            count(*) filter (where ti.amount = abs(ti.balance_delta))::integer,
            count(distinct ti.amount)::integer,
            coalesce(sum(ti.balance_delta), 0)
        into
            v_item_count,
            v_category_null_item_count,
            v_positive_item_count,
            v_negative_item_count,
            v_positive_amount_count,
            v_amount_delta_match_count,
            v_distinct_amount_count,
            v_balance_delta_total
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id;

        if v_item_count <> 2
            or v_category_null_item_count <> 2
            or v_positive_item_count <> 1
            or v_negative_item_count <> 1
            or v_positive_amount_count <> 2
            or v_amount_delta_match_count <> 2
            or v_distinct_amount_count <> 1
            or v_balance_delta_total <> 0 then
            raise exception 'transfer_items_invalid' using errcode = '22023';
        end if;
    end if;

    v_item_count := 0;

    for v_item in
        select *
        from public.transaction_item ti
        where ti.transaction_record_id = p_transaction_record_id
          and ti.ledger_id = p_ledger_id
        order by ti.sort_order, ti.id
        for update
    loop
        v_item_count := v_item_count + 1;

        perform public.apply_account_balance_delta(
            p_ledger_id,
            v_item.account_id,
            -v_item.balance_delta,
            v_user_id
        );
    end loop;

    if v_item_count = 0 then
        raise exception 'transaction_item_invalid' using errcode = '22023';
    end if;

    update public.transaction_record tr
    set
        status = 'deleted',
        deleted_by = v_user_id,
        deleted_at = now(),
        updated_by = v_user_id,
        updated_at = now()
    where tr.id = p_transaction_record_id
      and tr.ledger_id = p_ledger_id
      and tr.status = 'active';

    if not found then
        raise exception 'transaction_not_found' using errcode = '22023';
    end if;

    return p_transaction_record_id;
end;
$$;


ALTER FUNCTION "public"."void_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account_holder" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'owner'::"text" NOT NULL,
    "share_ratio" numeric(5,2),
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "account_holder_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'co_owner'::"text"]))),
    CONSTRAINT "account_holder_share_ratio_check" CHECK ((("share_ratio" IS NULL) OR (("share_ratio" > (0)::numeric) AND ("share_ratio" <= (100)::numeric))))
);


ALTER TABLE "public"."account_holder" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_user" (
    "id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "email" "text",
    "avatar_url" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "current_ledger_id" "uuid",
    CONSTRAINT "app_user_avatar_url_check" CHECK ((("avatar_url" IS NULL) OR ("avatar_url" ~ '^https://'::"text"))),
    CONSTRAINT "app_user_display_name_check" CHECK ((("length"(TRIM(BOTH FROM "display_name")) >= 1) AND ("length"(TRIM(BOTH FROM "display_name")) <= 100))),
    CONSTRAINT "app_user_email_length_check" CHECK ((("email" IS NULL) OR ("length"("email") <= 255))),
    CONSTRAINT "app_user_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'disabled'::"text"])))
);


ALTER TABLE "public"."app_user" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_otp_attempt" (
    "id" bigint NOT NULL,
    "purpose" "text" NOT NULL,
    "attempt_type" "text" NOT NULL,
    "email_hash" "text" NOT NULL,
    "ip_hash" "text" NOT NULL,
    "result" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "auth_otp_attempt_attempt_type_check" CHECK (("attempt_type" = ANY (ARRAY['send'::"text", 'verify_failure'::"text", 'availability_check'::"text"]))),
    CONSTRAINT "auth_otp_attempt_email_hash_check" CHECK (("length"("email_hash") = 64)),
    CONSTRAINT "auth_otp_attempt_ip_hash_check" CHECK (("length"("ip_hash") = 64)),
    CONSTRAINT "auth_otp_attempt_purpose_check" CHECK (("purpose" = 'signup'::"text")),
    CONSTRAINT "auth_otp_attempt_result_check" CHECK (("result" = ANY (ARRAY['success'::"text", 'blocked'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."auth_otp_attempt" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."auth_otp_attempt_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."auth_otp_attempt_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."auth_otp_attempt_id_seq" OWNED BY "public"."auth_otp_attempt"."id";



CREATE TABLE IF NOT EXISTS "public"."budget" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "budget_month" "date" NOT NULL,
    "scope" "text" DEFAULT 'category_only'::"text" NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "note" "text",
    "is_archived" boolean DEFAULT false NOT NULL,
    "archived_by" "uuid",
    "archived_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "budget_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "budget_archive_check" CHECK (((("is_archived" = false) AND ("archived_at" IS NULL) AND ("archived_by" IS NULL)) OR (("is_archived" = true) AND ("archived_at" IS NOT NULL)))),
    CONSTRAINT "budget_month_check" CHECK ((EXTRACT(day FROM "budget_month") = (1)::numeric)),
    CONSTRAINT "budget_note_check" CHECK ((("note" IS NULL) OR ("length"("note") <= 1000))),
    CONSTRAINT "budget_scope_check" CHECK (("scope" = ANY (ARRAY['category_only'::"text", 'category_with_children'::"text"])))
);


ALTER TABLE "public"."budget" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."category" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "icon_name" "text",
    "color" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "archived_by" "uuid",
    "archived_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "category_archive_check" CHECK (((("is_archived" = false) AND ("archived_at" IS NULL) AND ("archived_by" IS NULL)) OR (("is_archived" = true) AND ("archived_at" IS NOT NULL)))),
    CONSTRAINT "category_color_check" CHECK ((("color" IS NULL) OR ("color" ~ '^#[0-9A-Fa-f]{6}$'::"text"))),
    CONSTRAINT "category_icon_name_check" CHECK ((("icon_name" IS NULL) OR ("length"("icon_name") <= 100))),
    CONSTRAINT "category_name_check" CHECK ((("length"(TRIM(BOTH FROM "name")) >= 1) AND ("length"(TRIM(BOTH FROM "name")) <= 100))),
    CONSTRAINT "category_parent_not_self_check" CHECK ((("parent_id" IS NULL) OR ("parent_id" <> "id"))),
    CONSTRAINT "category_type_check" CHECK (("type" = ANY (ARRAY['expense'::"text", 'income'::"text"])))
);


ALTER TABLE "public"."category" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ledger_invite" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_id" "uuid" NOT NULL,
    "inviter_user_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "accepted_at" timestamp with time zone,
    "accepted_by" "uuid",
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "ledger_invite_acceptance_check" CHECK (((("accepted_at" IS NULL) AND ("accepted_by" IS NULL)) OR (("accepted_at" IS NOT NULL) AND ("accepted_by" IS NOT NULL)))),
    CONSTRAINT "ledger_invite_revocation_check" CHECK (((("revoked_at" IS NULL) AND ("revoked_by" IS NULL)) OR (("revoked_at" IS NOT NULL) AND ("revoked_by" IS NOT NULL)))),
    CONSTRAINT "ledger_invite_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'member'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."ledger_invite" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ledger_member_display_setting" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_color" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_name" "text",
    CONSTRAINT "ledger_member_display_setting_color_check" CHECK (("display_color" = ANY (ARRAY['jade'::"text", 'aqua'::"text", 'sky'::"text", 'indigo'::"text", 'lavender'::"text", 'magenta'::"text", 'sakura'::"text", 'rose'::"text", 'amber'::"text", 'lime'::"text"]))),
    CONSTRAINT "ledger_member_display_setting_display_name_check" CHECK ((("display_name" IS NULL) OR (("btrim"("display_name") <> ''::"text") AND ("length"("btrim"("display_name")) <= 100))))
);


ALTER TABLE "public"."ledger_member_display_setting" OWNER TO "postgres";


COMMENT ON COLUMN "public"."ledger_member_display_setting"."display_name" IS '当前账本内使用的成员昵称。为空时回退到 app_user.display_name。';



CREATE TABLE IF NOT EXISTS "public"."merchant" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "website_url" "text",
    "icon_url" "text",
    "icon_fetch_status" "text" DEFAULT 'none'::"text" NOT NULL,
    "icon_fetched_at" timestamp with time zone,
    "icon_fetch_error" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "archived_by" "uuid",
    "archived_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    CONSTRAINT "merchant_archive_check" CHECK (((("is_archived" = false) AND ("archived_at" IS NULL) AND ("archived_by" IS NULL)) OR (("is_archived" = true) AND ("archived_at" IS NOT NULL)))),
    CONSTRAINT "merchant_icon_fetch_error_check" CHECK ((("icon_fetch_error" IS NULL) OR ("length"("icon_fetch_error") <= 1000))),
    CONSTRAINT "merchant_icon_fetch_status_check" CHECK (("icon_fetch_status" = ANY (ARRAY['none'::"text", 'pending'::"text", 'success'::"text", 'failed'::"text"]))),
    CONSTRAINT "merchant_icon_url_check" CHECK ((("icon_url" IS NULL) OR ("icon_url" ~ '^https://'::"text"))),
    CONSTRAINT "merchant_name_check" CHECK ((("length"(TRIM(BOTH FROM "name")) >= 1) AND ("length"(TRIM(BOTH FROM "name")) <= 100))),
    CONSTRAINT "merchant_note_check" CHECK ((("note" IS NULL) OR ("length"("note") <= 1000))),
    CONSTRAINT "merchant_website_url_check" CHECK ((("website_url" IS NULL) OR ("website_url" ~ '^https?://'::"text")))
);


ALTER TABLE "public"."merchant" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."merchant_alias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "alias" "text" NOT NULL,
    "locale" "text",
    "note" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "archived_by" "uuid",
    "archived_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "merchant_alias_alias_check" CHECK ((("length"(TRIM(BOTH FROM "alias")) >= 1) AND ("length"(TRIM(BOTH FROM "alias")) <= 100))),
    CONSTRAINT "merchant_alias_archive_check" CHECK (((("is_archived" = false) AND ("archived_at" IS NULL) AND ("archived_by" IS NULL)) OR (("is_archived" = true) AND ("archived_at" IS NOT NULL)))),
    CONSTRAINT "merchant_alias_locale_check" CHECK ((("locale" IS NULL) OR (("length"(TRIM(BOTH FROM "locale")) >= 2) AND ("length"(TRIM(BOTH FROM "locale")) <= 20)))),
    CONSTRAINT "merchant_alias_note_check" CHECK ((("note" IS NULL) OR ("length"("note") <= 1000)))
);


ALTER TABLE "public"."merchant_alias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_item" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_id" "uuid" NOT NULL,
    "transaction_record_id" "uuid" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "discount_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "balance_delta" numeric(14,2) DEFAULT 0 NOT NULL,
    "note" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transaction_item_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "transaction_item_discount_amount_check" CHECK (("discount_amount" >= (0)::numeric)),
    CONSTRAINT "transaction_item_discount_not_greater_than_amount_check" CHECK (("discount_amount" <= "amount")),
    CONSTRAINT "transaction_item_note_check" CHECK ((("note" IS NULL) OR ("length"("note") <= 1000)))
);


ALTER TABLE "public"."transaction_item" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_record" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "transaction_at" timestamp with time zone NOT NULL,
    "merchant_id" "uuid",
    "title" "text",
    "note" "text",
    "discount_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "discount_allocation_method" "text" DEFAULT 'none'::"text" NOT NULL,
    "deleted_by" "uuid",
    "deleted_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transaction_record_deleted_check" CHECK (((("status" = 'active'::"text") AND ("deleted_at" IS NULL) AND ("deleted_by" IS NULL)) OR (("status" = 'deleted'::"text") AND ("deleted_at" IS NOT NULL)))),
    CONSTRAINT "transaction_record_discount_allocation_method_check" CHECK (("discount_allocation_method" = ANY (ARRAY['none'::"text", 'proportional'::"text", 'manual'::"text"]))),
    CONSTRAINT "transaction_record_discount_amount_check" CHECK (("discount_amount" >= (0)::numeric)),
    CONSTRAINT "transaction_record_merchant_required_for_non_transfer" CHECK ((("type" = 'transfer'::"text") OR ("merchant_id" IS NOT NULL))),
    CONSTRAINT "transaction_record_note_check" CHECK ((("note" IS NULL) OR ("length"("note") <= 2000))),
    CONSTRAINT "transaction_record_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'deleted'::"text"]))),
    CONSTRAINT "transaction_record_title_check" CHECK ((("title" IS NULL) OR (("length"(TRIM(BOTH FROM "title")) >= 1) AND ("length"(TRIM(BOTH FROM "title")) <= 200)))),
    CONSTRAINT "transaction_record_type_check" CHECK (("type" = ANY (ARRAY['normal'::"text", 'transfer'::"text"])))
);


ALTER TABLE "public"."transaction_record" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_record_tag" (
    "ledger_id" "uuid" NOT NULL,
    "transaction_record_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."transaction_record_tag" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_tag" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "is_archived" boolean DEFAULT false NOT NULL,
    "archived_by" "uuid",
    "archived_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transaction_tag_archive_check" CHECK (((("is_archived" = false) AND ("archived_at" IS NULL) AND ("archived_by" IS NULL)) OR (("is_archived" = true) AND ("archived_at" IS NOT NULL)))),
    CONSTRAINT "transaction_tag_color_check" CHECK ((("color" IS NULL) OR ("color" ~ '^#[0-9A-Fa-f]{6}$'::"text"))),
    CONSTRAINT "transaction_tag_name_check" CHECK ((("length"(TRIM(BOTH FROM "name")) >= 1) AND ("length"(TRIM(BOTH FROM "name")) <= 40)))
);


ALTER TABLE "public"."transaction_tag" OWNER TO "postgres";


ALTER TABLE ONLY "public"."auth_otp_attempt" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."auth_otp_attempt_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."account_holder"
    ADD CONSTRAINT "account_holder_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."account_holder"
    ADD CONSTRAINT "account_holder_unique" UNIQUE ("account_id", "user_id");



ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_id_ledger_id_unique" UNIQUE ("id", "ledger_id");



ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_user"
    ADD CONSTRAINT "app_user_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."app_user"
    ADD CONSTRAINT "app_user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_otp_attempt"
    ADD CONSTRAINT "auth_otp_attempt_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget"
    ADD CONSTRAINT "budget_id_ledger_id_unique" UNIQUE ("id", "ledger_id");



ALTER TABLE ONLY "public"."budget"
    ADD CONSTRAINT "budget_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_id_ledger_id_unique" UNIQUE ("id", "ledger_id");



ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ledger_invite"
    ADD CONSTRAINT "ledger_invite_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ledger_invite"
    ADD CONSTRAINT "ledger_invite_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."ledger_member_display_setting"
    ADD CONSTRAINT "ledger_member_display_setting_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ledger_member_display_setting"
    ADD CONSTRAINT "ledger_member_display_setting_unique" UNIQUE ("ledger_id", "user_id");



ALTER TABLE ONLY "public"."ledger_member"
    ADD CONSTRAINT "ledger_member_id_ledger_id_unique" UNIQUE ("id", "ledger_id");



ALTER TABLE ONLY "public"."ledger_member"
    ADD CONSTRAINT "ledger_member_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchant_alias"
    ADD CONSTRAINT "merchant_alias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchant"
    ADD CONSTRAINT "merchant_id_ledger_id_unique" UNIQUE ("id", "ledger_id");



ALTER TABLE ONLY "public"."merchant"
    ADD CONSTRAINT "merchant_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_item"
    ADD CONSTRAINT "transaction_item_id_ledger_id_unique" UNIQUE ("id", "ledger_id");



ALTER TABLE ONLY "public"."transaction_item"
    ADD CONSTRAINT "transaction_item_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_record"
    ADD CONSTRAINT "transaction_record_id_ledger_id_unique" UNIQUE ("id", "ledger_id");



ALTER TABLE ONLY "public"."transaction_record"
    ADD CONSTRAINT "transaction_record_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_record_tag"
    ADD CONSTRAINT "transaction_record_tag_pkey" PRIMARY KEY ("ledger_id", "transaction_record_id", "tag_id");



ALTER TABLE ONLY "public"."transaction_tag"
    ADD CONSTRAINT "transaction_tag_id_ledger_id_unique" UNIQUE ("id", "ledger_id");



ALTER TABLE ONLY "public"."transaction_tag"
    ADD CONSTRAINT "transaction_tag_pkey" PRIMARY KEY ("id");



CREATE INDEX "account_active_idx" ON "public"."account" USING "btree" ("ledger_id", "sort_order", "id") WHERE ("is_archived" = false);



CREATE UNIQUE INDEX "account_active_name_unique" ON "public"."account" USING "btree" ("ledger_id", "lower"("name")) WHERE ("is_archived" = false);



CREATE INDEX "account_holder_account_ledger_idx" ON "public"."account_holder" USING "btree" ("account_id", "ledger_id");



CREATE INDEX "account_holder_ledger_id_idx" ON "public"."account_holder" USING "btree" ("ledger_id");



CREATE INDEX "account_holder_user_id_idx" ON "public"."account_holder" USING "btree" ("user_id");



CREATE INDEX "account_ledger_id_idx" ON "public"."account" USING "btree" ("ledger_id");



CREATE INDEX "app_user_current_ledger_id_idx" ON "public"."app_user" USING "btree" ("current_ledger_id") WHERE ("current_ledger_id" IS NOT NULL);



CREATE INDEX "auth_otp_attempt_purpose_email_send_success_created_at_idx" ON "public"."auth_otp_attempt" USING "btree" ("purpose", "email_hash", "created_at" DESC) WHERE (("attempt_type" = 'send'::"text") AND ("result" = 'success'::"text"));



CREATE INDEX "auth_otp_attempt_purpose_email_verify_failure_created_at_idx" ON "public"."auth_otp_attempt" USING "btree" ("purpose", "email_hash", "created_at" DESC) WHERE ("attempt_type" = 'verify_failure'::"text");



CREATE INDEX "auth_otp_attempt_purpose_ip_availability_check_created_at_idx" ON "public"."auth_otp_attempt" USING "btree" ("purpose", "ip_hash", "created_at" DESC) WHERE ("attempt_type" = 'availability_check'::"text");



CREATE INDEX "auth_otp_attempt_purpose_ip_send_success_created_at_idx" ON "public"."auth_otp_attempt" USING "btree" ("purpose", "ip_hash", "created_at" DESC) WHERE (("attempt_type" = 'send'::"text") AND ("result" = 'success'::"text"));



CREATE INDEX "budget_active_idx" ON "public"."budget" USING "btree" ("ledger_id", "budget_month", "category_id") WHERE ("is_archived" = false);



CREATE UNIQUE INDEX "budget_active_unique" ON "public"."budget" USING "btree" ("ledger_id", "category_id", "budget_month", "scope") WHERE ("is_archived" = false);



CREATE INDEX "budget_category_id_idx" ON "public"."budget" USING "btree" ("ledger_id", "category_id");



CREATE INDEX "budget_ledger_month_idx" ON "public"."budget" USING "btree" ("ledger_id", "budget_month");



CREATE UNIQUE INDEX "category_active_child_name_unique" ON "public"."category" USING "btree" ("ledger_id", "parent_id", "type", "lower"("name")) WHERE (("parent_id" IS NOT NULL) AND ("is_archived" = false));



CREATE INDEX "category_active_idx" ON "public"."category" USING "btree" ("ledger_id", "type", "parent_id", "sort_order", "id") WHERE ("is_archived" = false);



CREATE UNIQUE INDEX "category_active_root_name_unique" ON "public"."category" USING "btree" ("ledger_id", "type", "lower"("name")) WHERE (("parent_id" IS NULL) AND ("is_archived" = false));



CREATE INDEX "category_ledger_parent_idx" ON "public"."category" USING "btree" ("ledger_id", "parent_id", "sort_order", "id");



CREATE INDEX "ledger_active_idx" ON "public"."ledger" USING "btree" ("id") WHERE ("is_archived" = false);



CREATE INDEX "ledger_invite_ledger_id_created_at_idx" ON "public"."ledger_invite" USING "btree" ("ledger_id", "created_at" DESC);



CREATE INDEX "ledger_member_active_ledger_user_idx" ON "public"."ledger_member" USING "btree" ("ledger_id", "user_id") WHERE ("status" = 'active'::"text");



CREATE UNIQUE INDEX "ledger_member_active_owner_unique" ON "public"."ledger_member" USING "btree" ("ledger_id") WHERE (("role" = 'owner'::"text") AND ("status" = 'active'::"text"));



CREATE INDEX "ledger_member_display_setting_ledger_id_idx" ON "public"."ledger_member_display_setting" USING "btree" ("ledger_id");



CREATE INDEX "ledger_member_display_setting_user_id_idx" ON "public"."ledger_member_display_setting" USING "btree" ("user_id");



CREATE UNIQUE INDEX "ledger_member_not_removed_user_unique" ON "public"."ledger_member" USING "btree" ("ledger_id", "user_id") WHERE ("status" <> 'removed'::"text");



CREATE INDEX "ledger_member_user_id_active_idx" ON "public"."ledger_member" USING "btree" ("user_id") WHERE ("status" = 'active'::"text");



CREATE INDEX "ledger_member_user_id_idx" ON "public"."ledger_member" USING "btree" ("user_id");



CREATE INDEX "ledger_owner_user_id_idx" ON "public"."ledger" USING "btree" ("owner_user_id");



CREATE INDEX "merchant_active_idx" ON "public"."merchant" USING "btree" ("ledger_id", "sort_order", "id") WHERE ("is_archived" = false);



CREATE UNIQUE INDEX "merchant_active_name_unique" ON "public"."merchant" USING "btree" ("ledger_id", "lower"("name")) WHERE ("is_archived" = false);



CREATE INDEX "merchant_alias_active_alias_search_idx" ON "public"."merchant_alias" USING "gin" ("lower"("alias") "public"."gin_trgm_ops") WHERE ("is_archived" = false);



CREATE UNIQUE INDEX "merchant_alias_active_alias_unique" ON "public"."merchant_alias" USING "btree" ("merchant_id", "lower"("alias")) WHERE ("is_archived" = false);



CREATE INDEX "merchant_alias_active_idx" ON "public"."merchant_alias" USING "btree" ("merchant_id", "sort_order", "id") WHERE ("is_archived" = false);



CREATE INDEX "merchant_ledger_id_idx" ON "public"."merchant" USING "btree" ("ledger_id");



CREATE INDEX "transaction_item_account_id_idx" ON "public"."transaction_item" USING "btree" ("ledger_id", "account_id", "created_at" DESC, "id" DESC);



CREATE INDEX "transaction_item_category_id_idx" ON "public"."transaction_item" USING "btree" ("ledger_id", "category_id") WHERE ("category_id" IS NOT NULL);



CREATE INDEX "transaction_item_ledger_record_id_idx" ON "public"."transaction_item" USING "btree" ("ledger_id", "transaction_record_id");



CREATE INDEX "transaction_item_record_id_idx" ON "public"."transaction_item" USING "btree" ("transaction_record_id", "sort_order", "id");



CREATE INDEX "transaction_record_active_expense_income_idx" ON "public"."transaction_record" USING "btree" ("ledger_id", "transaction_at" DESC, "id" DESC) WHERE (("status" = 'active'::"text") AND ("type" = ANY (ARRAY['expense'::"text", 'income'::"text"])));



CREATE INDEX "transaction_record_active_idx" ON "public"."transaction_record" USING "btree" ("ledger_id", "transaction_at" DESC, "id" DESC) WHERE ("status" = 'active'::"text");



CREATE INDEX "transaction_record_ledger_transaction_at_idx" ON "public"."transaction_record" USING "btree" ("ledger_id", "transaction_at" DESC, "id" DESC);



CREATE INDEX "transaction_record_merchant_id_idx" ON "public"."transaction_record" USING "btree" ("merchant_id") WHERE ("merchant_id" IS NOT NULL);



CREATE INDEX "transaction_record_tag_tag_idx" ON "public"."transaction_record_tag" USING "btree" ("ledger_id", "tag_id");



CREATE INDEX "transaction_tag_active_idx" ON "public"."transaction_tag" USING "btree" ("ledger_id", "id") WHERE ("is_archived" = false);



CREATE UNIQUE INDEX "transaction_tag_active_name_unique" ON "public"."transaction_tag" USING "btree" ("ledger_id", "lower"("name")) WHERE ("is_archived" = false);



CREATE OR REPLACE TRIGGER "account_holder_require_management_permission" BEFORE INSERT OR DELETE OR UPDATE ON "public"."account_holder" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_ledger_management_permission"('ledger_id');



CREATE OR REPLACE TRIGGER "account_holder_set_updated_at" BEFORE UPDATE ON "public"."account_holder" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "account_holder_validate_active_member" BEFORE INSERT OR UPDATE ON "public"."account_holder" FOR EACH ROW EXECUTE FUNCTION "public"."validate_account_holder_active_member"();



CREATE OR REPLACE TRIGGER "account_prevent_direct_balance_update" BEFORE UPDATE ON "public"."account" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_direct_account_balance_update"();



CREATE OR REPLACE TRIGGER "account_require_management_permission" BEFORE INSERT OR DELETE OR UPDATE ON "public"."account" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_ledger_management_permission"('ledger_id');



CREATE OR REPLACE TRIGGER "account_set_initial_current_balance" BEFORE INSERT ON "public"."account" FOR EACH ROW EXECUTE FUNCTION "public"."set_account_initial_current_balance"();



CREATE OR REPLACE TRIGGER "account_set_updated_at" BEFORE UPDATE ON "public"."account" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "app_user_set_updated_at" BEFORE UPDATE ON "public"."app_user" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "app_user_validate_current_ledger" BEFORE INSERT OR UPDATE OF "current_ledger_id" ON "public"."app_user" FOR EACH ROW EXECUTE FUNCTION "public"."validate_app_user_current_ledger"();



CREATE OR REPLACE TRIGGER "budget_require_management_permission" BEFORE INSERT OR DELETE OR UPDATE ON "public"."budget" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_ledger_management_permission"('ledger_id');



CREATE OR REPLACE TRIGGER "budget_set_updated_at" BEFORE UPDATE ON "public"."budget" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "budget_validate_category" BEFORE INSERT OR UPDATE ON "public"."budget" FOR EACH ROW EXECUTE FUNCTION "public"."validate_budget_category"();



CREATE OR REPLACE TRIGGER "category_prevent_used_type_change" BEFORE UPDATE OF "type" ON "public"."category" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_used_category_type_change"();



CREATE OR REPLACE TRIGGER "category_require_management_permission" BEFORE INSERT OR DELETE OR UPDATE ON "public"."category" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_ledger_management_permission"('ledger_id');



CREATE OR REPLACE TRIGGER "category_set_updated_at" BEFORE UPDATE ON "public"."category" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "category_validate_parent" BEFORE INSERT OR UPDATE ON "public"."category" FOR EACH ROW EXECUTE FUNCTION "public"."validate_category_parent"();



CREATE OR REPLACE TRIGGER "ledger_member_assign_default_display_color" AFTER INSERT OR UPDATE OF "status" ON "public"."ledger_member" FOR EACH ROW EXECUTE FUNCTION "public"."assign_ledger_member_default_display_color"();



CREATE OR REPLACE TRIGGER "ledger_member_display_setting_cleanup_on_member_leave" AFTER UPDATE OF "status" ON "public"."ledger_member" FOR EACH ROW EXECUTE FUNCTION "public"."cleanup_ledger_member_display_setting_on_member_leave"();



CREATE OR REPLACE TRIGGER "ledger_member_display_setting_prevent_identity_change" BEFORE UPDATE ON "public"."ledger_member_display_setting" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_ledger_member_display_setting_identity_change"();



CREATE OR REPLACE TRIGGER "ledger_member_display_setting_set_audit_user" BEFORE INSERT OR UPDATE ON "public"."ledger_member_display_setting" FOR EACH ROW EXECUTE FUNCTION "public"."set_ledger_member_display_setting_audit_user"();



CREATE OR REPLACE TRIGGER "ledger_member_display_setting_set_updated_at" BEFORE UPDATE ON "public"."ledger_member_display_setting" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "ledger_member_display_setting_validate_member" BEFORE INSERT OR UPDATE ON "public"."ledger_member_display_setting" FOR EACH ROW EXECUTE FUNCTION "public"."validate_ledger_member_display_setting_member"();



CREATE OR REPLACE TRIGGER "ledger_member_prevent_identity_change" BEFORE UPDATE ON "public"."ledger_member" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_ledger_member_identity_change"();



CREATE OR REPLACE TRIGGER "ledger_member_require_management_permission" BEFORE INSERT OR DELETE OR UPDATE ON "public"."ledger_member" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_ledger_member_management_permission"();



CREATE OR REPLACE TRIGGER "ledger_member_set_updated_at" BEFORE UPDATE ON "public"."ledger_member" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "ledger_require_management_permission" BEFORE DELETE OR UPDATE ON "public"."ledger" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_ledger_management_permission"('id');



CREATE OR REPLACE TRIGGER "ledger_set_updated_at" BEFORE UPDATE ON "public"."ledger" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "merchant_alias_prevent_identity_change" BEFORE UPDATE ON "public"."merchant_alias" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_merchant_alias_identity_change"();



CREATE OR REPLACE TRIGGER "merchant_alias_require_management_permission" BEFORE INSERT OR DELETE OR UPDATE ON "public"."merchant_alias" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_merchant_alias_management_permission"();



CREATE OR REPLACE TRIGGER "merchant_alias_set_updated_at" BEFORE UPDATE ON "public"."merchant_alias" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "merchant_require_management_permission" BEFORE INSERT OR DELETE OR UPDATE ON "public"."merchant" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_ledger_management_permission"('ledger_id');



CREATE OR REPLACE TRIGGER "merchant_set_updated_at" BEFORE UPDATE ON "public"."merchant" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "transaction_item_require_write_permission" BEFORE INSERT OR DELETE OR UPDATE ON "public"."transaction_item" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_transaction_child_permission"();



CREATE OR REPLACE TRIGGER "transaction_item_set_updated_at" BEFORE UPDATE ON "public"."transaction_item" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "transaction_item_validate_category_shape" BEFORE INSERT OR UPDATE OF "ledger_id", "transaction_record_id", "category_id" ON "public"."transaction_item" FOR EACH ROW EXECUTE FUNCTION "public"."validate_transaction_item_category_shape"();



CREATE OR REPLACE TRIGGER "transaction_record_normalize_type_for_compat" BEFORE INSERT OR UPDATE OF "type" ON "public"."transaction_record" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_transaction_record_type_for_compat"();



CREATE OR REPLACE TRIGGER "transaction_record_require_write_permission" BEFORE INSERT OR DELETE OR UPDATE ON "public"."transaction_record" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_transaction_record_permission"();



CREATE OR REPLACE TRIGGER "transaction_record_set_updated_at" BEFORE UPDATE ON "public"."transaction_record" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "transaction_record_tag_require_write_permission" BEFORE INSERT OR DELETE OR UPDATE ON "public"."transaction_record_tag" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_transaction_child_permission"();



CREATE OR REPLACE TRIGGER "transaction_record_validate" BEFORE INSERT OR UPDATE ON "public"."transaction_record" FOR EACH ROW EXECUTE FUNCTION "public"."validate_transaction_record"();



CREATE OR REPLACE TRIGGER "transaction_tag_require_management_permission" BEFORE INSERT OR DELETE OR UPDATE ON "public"."transaction_tag" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_ledger_management_permission"('ledger_id');



CREATE OR REPLACE TRIGGER "transaction_tag_set_updated_at" BEFORE UPDATE ON "public"."transaction_tag" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."account_holder"
    ADD CONSTRAINT "account_holder_account_same_ledger_fk" FOREIGN KEY ("account_id", "ledger_id") REFERENCES "public"."account"("id", "ledger_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."account_holder"
    ADD CONSTRAINT "account_holder_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."account_holder"
    ADD CONSTRAINT "account_holder_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."account_holder"
    ADD CONSTRAINT "account_holder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_ledger_id_fkey" FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."app_user"
    ADD CONSTRAINT "app_user_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."app_user"
    ADD CONSTRAINT "app_user_current_ledger_id_fkey" FOREIGN KEY ("current_ledger_id") REFERENCES "public"."ledger"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."app_user"
    ADD CONSTRAINT "app_user_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."app_user"
    ADD CONSTRAINT "app_user_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."budget"
    ADD CONSTRAINT "budget_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."budget"
    ADD CONSTRAINT "budget_category_same_ledger_fk" FOREIGN KEY ("category_id", "ledger_id") REFERENCES "public"."category"("id", "ledger_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."budget"
    ADD CONSTRAINT "budget_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."budget"
    ADD CONSTRAINT "budget_ledger_id_fkey" FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."budget"
    ADD CONSTRAINT "budget_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_ledger_id_fkey" FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_parent_same_ledger_fk" FOREIGN KEY ("parent_id", "ledger_id") REFERENCES "public"."category"("id", "ledger_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger_invite"
    ADD CONSTRAINT "ledger_invite_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger_invite"
    ADD CONSTRAINT "ledger_invite_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger_invite"
    ADD CONSTRAINT "ledger_invite_inviter_user_id_fkey" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger_invite"
    ADD CONSTRAINT "ledger_invite_ledger_id_fkey" FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ledger_invite"
    ADD CONSTRAINT "ledger_invite_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger_member"
    ADD CONSTRAINT "ledger_member_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger_member_display_setting"
    ADD CONSTRAINT "ledger_member_display_setting_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger_member_display_setting"
    ADD CONSTRAINT "ledger_member_display_setting_ledger_id_fkey" FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ledger_member_display_setting"
    ADD CONSTRAINT "ledger_member_display_setting_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger_member_display_setting"
    ADD CONSTRAINT "ledger_member_display_setting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ledger_member"
    ADD CONSTRAINT "ledger_member_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger_member"
    ADD CONSTRAINT "ledger_member_ledger_id_fkey" FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ledger_member"
    ADD CONSTRAINT "ledger_member_removed_by_fkey" FOREIGN KEY ("removed_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger_member"
    ADD CONSTRAINT "ledger_member_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger_member"
    ADD CONSTRAINT "ledger_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."ledger"
    ADD CONSTRAINT "ledger_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."merchant_alias"
    ADD CONSTRAINT "merchant_alias_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."merchant_alias"
    ADD CONSTRAINT "merchant_alias_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."merchant_alias"
    ADD CONSTRAINT "merchant_alias_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."merchant_alias"
    ADD CONSTRAINT "merchant_alias_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."merchant"
    ADD CONSTRAINT "merchant_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."merchant"
    ADD CONSTRAINT "merchant_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."merchant"
    ADD CONSTRAINT "merchant_ledger_id_fkey" FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."merchant"
    ADD CONSTRAINT "merchant_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."transaction_item"
    ADD CONSTRAINT "transaction_item_account_same_ledger_fk" FOREIGN KEY ("account_id", "ledger_id") REFERENCES "public"."account"("id", "ledger_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_item"
    ADD CONSTRAINT "transaction_item_category_same_ledger_fk" FOREIGN KEY ("category_id", "ledger_id") REFERENCES "public"."category"("id", "ledger_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_item"
    ADD CONSTRAINT "transaction_item_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."transaction_item"
    ADD CONSTRAINT "transaction_item_record_same_ledger_fk" FOREIGN KEY ("transaction_record_id", "ledger_id") REFERENCES "public"."transaction_record"("id", "ledger_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_item"
    ADD CONSTRAINT "transaction_item_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."transaction_record"
    ADD CONSTRAINT "transaction_record_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."transaction_record"
    ADD CONSTRAINT "transaction_record_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."transaction_record"
    ADD CONSTRAINT "transaction_record_ledger_id_fkey" FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_record"
    ADD CONSTRAINT "transaction_record_merchant_same_ledger_fk" FOREIGN KEY ("merchant_id", "ledger_id") REFERENCES "public"."merchant"("id", "ledger_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_record_tag"
    ADD CONSTRAINT "transaction_record_tag_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."transaction_record_tag"
    ADD CONSTRAINT "transaction_record_tag_record_same_ledger_fk" FOREIGN KEY ("transaction_record_id", "ledger_id") REFERENCES "public"."transaction_record"("id", "ledger_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_record_tag"
    ADD CONSTRAINT "transaction_record_tag_tag_same_ledger_fk" FOREIGN KEY ("tag_id", "ledger_id") REFERENCES "public"."transaction_tag"("id", "ledger_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_record"
    ADD CONSTRAINT "transaction_record_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."transaction_tag"
    ADD CONSTRAINT "transaction_tag_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."transaction_tag"
    ADD CONSTRAINT "transaction_tag_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_user"("id");



ALTER TABLE ONLY "public"."transaction_tag"
    ADD CONSTRAINT "transaction_tag_ledger_id_fkey" FOREIGN KEY ("ledger_id") REFERENCES "public"."ledger"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transaction_tag"
    ADD CONSTRAINT "transaction_tag_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_user"("id");



ALTER TABLE "public"."account" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."account_holder" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "account_holder_delete_admin" ON "public"."account_holder" FOR DELETE TO "authenticated" USING ("public"."current_user_can_manage_ledger"("ledger_id"));



CREATE POLICY "account_holder_insert_admin" ON "public"."account_holder" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_can_manage_ledger"("ledger_id"));



CREATE POLICY "account_holder_select_active_ledger_member" ON "public"."account_holder" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."ledger_member" "lm"
     JOIN "public"."app_user" "au" ON (("au"."id" = "lm"."user_id")))
  WHERE (("lm"."ledger_id" = "account_holder"."ledger_id") AND ("lm"."user_id" = "auth"."uid"()) AND ("lm"."status" = 'active'::"text") AND ("au"."status" = 'active'::"text")))));



CREATE POLICY "account_holder_update_admin" ON "public"."account_holder" FOR UPDATE TO "authenticated" USING ("public"."current_user_can_manage_ledger"("ledger_id")) WITH CHECK ("public"."current_user_can_manage_ledger"("ledger_id"));



CREATE POLICY "account_insert_admin" ON "public"."account" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_can_manage_ledger"("ledger_id"));



CREATE POLICY "account_select_active_member" ON "public"."account" FOR SELECT TO "authenticated" USING ("public"."current_user_is_active_ledger_member"("ledger_id"));



CREATE POLICY "account_update_admin" ON "public"."account" FOR UPDATE TO "authenticated" USING ("public"."current_user_can_manage_ledger"("ledger_id")) WITH CHECK ("public"."current_user_can_manage_ledger"("ledger_id"));



ALTER TABLE "public"."app_user" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_user_select_self_or_same_ledger_member" ON "public"."app_user" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR ("public"."current_app_user_is_active"() AND (EXISTS ( SELECT 1
   FROM ("public"."ledger_member" "lm_self"
     JOIN "public"."ledger_member" "lm_target" ON (("lm_target"."ledger_id" = "lm_self"."ledger_id")))
  WHERE (("lm_self"."user_id" = "auth"."uid"()) AND ("lm_self"."status" = 'active'::"text") AND ("lm_target"."user_id" = "app_user"."id") AND ("lm_target"."status" = 'active'::"text")))))));



CREATE POLICY "app_user_update_self" ON "public"."app_user" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) AND "public"."current_app_user_is_active"())) WITH CHECK ((("id" = "auth"."uid"()) AND ("status" = 'active'::"text")));



ALTER TABLE "public"."auth_otp_attempt" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "budget_insert_admin" ON "public"."budget" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_can_manage_ledger"("ledger_id"));



CREATE POLICY "budget_select_active_member" ON "public"."budget" FOR SELECT TO "authenticated" USING ("public"."current_user_is_active_ledger_member"("ledger_id"));



CREATE POLICY "budget_update_admin" ON "public"."budget" FOR UPDATE TO "authenticated" USING ("public"."current_user_can_manage_ledger"("ledger_id")) WITH CHECK ("public"."current_user_can_manage_ledger"("ledger_id"));



ALTER TABLE "public"."category" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "category_insert_admin" ON "public"."category" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_can_manage_ledger"("ledger_id"));



CREATE POLICY "category_select_active_member" ON "public"."category" FOR SELECT TO "authenticated" USING ("public"."current_user_is_active_ledger_member"("ledger_id"));



CREATE POLICY "category_update_admin" ON "public"."category" FOR UPDATE TO "authenticated" USING ("public"."current_user_can_manage_ledger"("ledger_id")) WITH CHECK ("public"."current_user_can_manage_ledger"("ledger_id"));



ALTER TABLE "public"."ledger" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ledger_insert_self_owner" ON "public"."ledger" FOR INSERT TO "authenticated" WITH CHECK ((("owner_user_id" = "auth"."uid"()) AND "public"."current_app_user_is_active"()));



ALTER TABLE "public"."ledger_invite" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ledger_member" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ledger_member_accept_own_invitation" ON "public"."ledger_member" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND ("status" = 'invited'::"text") AND "public"."current_app_user_is_active"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND ("status" = 'active'::"text") AND ("joined_at" IS NOT NULL) AND ("removed_at" IS NULL) AND ("removed_by" IS NULL) AND "public"."current_app_user_is_active"()));



ALTER TABLE "public"."ledger_member_display_setting" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ledger_member_display_setting_insert_owner_admin" ON "public"."ledger_member_display_setting" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_can_manage_member_display_setting"("ledger_id"));



CREATE POLICY "ledger_member_display_setting_select_active_member" ON "public"."ledger_member_display_setting" FOR SELECT TO "authenticated" USING ("public"."current_user_is_active_ledger_member"("ledger_id"));



CREATE POLICY "ledger_member_display_setting_update_owner_admin" ON "public"."ledger_member_display_setting" FOR UPDATE TO "authenticated" USING ("public"."current_user_can_manage_member_display_setting"("ledger_id")) WITH CHECK ("public"."current_user_can_manage_member_display_setting"("ledger_id"));



CREATE POLICY "ledger_member_insert_admin" ON "public"."ledger_member" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_user_can_manage_ledger"("ledger_id") AND ("role" = ANY (ARRAY['admin'::"text", 'member'::"text", 'viewer'::"text"])) AND ("status" = 'invited'::"text") AND ("invited_by" = "auth"."uid"())));



CREATE POLICY "ledger_member_select_same_ledger_or_self" ON "public"."ledger_member" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."current_user_is_active_ledger_member"("ledger_id")));



CREATE POLICY "ledger_select_active_member" ON "public"."ledger" FOR SELECT TO "authenticated" USING ("public"."current_user_is_active_ledger_member"("id"));



CREATE POLICY "ledger_update_admin" ON "public"."ledger" FOR UPDATE TO "authenticated" USING ("public"."current_user_can_manage_ledger"("id")) WITH CHECK ("public"."current_user_can_manage_ledger"("id"));



ALTER TABLE "public"."merchant" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."merchant_alias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "merchant_alias_insert_admin" ON "public"."merchant_alias" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."merchant" "m"
  WHERE (("m"."id" = "merchant_alias"."merchant_id") AND ("m"."is_archived" = false) AND "public"."current_user_can_manage_ledger"("m"."ledger_id")))));



CREATE POLICY "merchant_alias_select_active_member" ON "public"."merchant_alias" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."merchant" "m"
  WHERE (("m"."id" = "merchant_alias"."merchant_id") AND "public"."current_user_is_active_ledger_member"("m"."ledger_id")))));



CREATE POLICY "merchant_alias_update_admin" ON "public"."merchant_alias" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."merchant" "m"
  WHERE (("m"."id" = "merchant_alias"."merchant_id") AND "public"."current_user_can_manage_ledger"("m"."ledger_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."merchant" "m"
  WHERE (("m"."id" = "merchant_alias"."merchant_id") AND ("m"."is_archived" = false) AND "public"."current_user_can_manage_ledger"("m"."ledger_id")))));



CREATE POLICY "merchant_insert_admin" ON "public"."merchant" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_can_manage_ledger"("ledger_id"));



CREATE POLICY "merchant_select_active_member" ON "public"."merchant" FOR SELECT TO "authenticated" USING ("public"."current_user_is_active_ledger_member"("ledger_id"));



CREATE POLICY "merchant_update_admin" ON "public"."merchant" FOR UPDATE TO "authenticated" USING ("public"."current_user_can_manage_ledger"("ledger_id")) WITH CHECK ("public"."current_user_can_manage_ledger"("ledger_id"));



ALTER TABLE "public"."transaction_item" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transaction_item_insert_authorized" ON "public"."transaction_item" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_user_can_mutate_transaction"("ledger_id", "transaction_record_id") AND (EXISTS ( SELECT 1
   FROM "public"."account" "a"
  WHERE (("a"."id" = "transaction_item"."account_id") AND ("a"."ledger_id" = "transaction_item"."ledger_id") AND ("a"."is_archived" = false)))) AND (("category_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."category" "c"
  WHERE (("c"."id" = "transaction_item"."category_id") AND ("c"."ledger_id" = "transaction_item"."ledger_id") AND ("c"."is_archived" = false)))))));



CREATE POLICY "transaction_item_select_active_record" ON "public"."transaction_item" FOR SELECT TO "authenticated" USING (("public"."current_user_is_active_ledger_member"("ledger_id") AND (EXISTS ( SELECT 1
   FROM "public"."transaction_record" "tr"
  WHERE (("tr"."id" = "transaction_item"."transaction_record_id") AND ("tr"."ledger_id" = "transaction_item"."ledger_id") AND ("tr"."status" = 'active'::"text"))))));



CREATE POLICY "transaction_item_update_authorized" ON "public"."transaction_item" FOR UPDATE TO "authenticated" USING ("public"."current_user_can_mutate_transaction"("ledger_id", "transaction_record_id")) WITH CHECK (("public"."current_user_can_mutate_transaction"("ledger_id", "transaction_record_id") AND (EXISTS ( SELECT 1
   FROM "public"."account" "a"
  WHERE (("a"."id" = "transaction_item"."account_id") AND ("a"."ledger_id" = "transaction_item"."ledger_id") AND ("a"."is_archived" = false)))) AND (("category_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."category" "c"
  WHERE (("c"."id" = "transaction_item"."category_id") AND ("c"."ledger_id" = "transaction_item"."ledger_id") AND ("c"."is_archived" = false)))))));



ALTER TABLE "public"."transaction_record" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transaction_record_insert_writer" ON "public"."transaction_record" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_user_can_write_ledger"("ledger_id") AND ("status" = 'active'::"text") AND ("created_by" = "auth"."uid"()) AND (("merchant_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."merchant" "m"
  WHERE (("m"."id" = "transaction_record"."merchant_id") AND ("m"."ledger_id" = "transaction_record"."ledger_id") AND ("m"."is_archived" = false)))))));



CREATE POLICY "transaction_record_select_active_member" ON "public"."transaction_record" FOR SELECT TO "authenticated" USING ((("status" = 'active'::"text") AND "public"."current_user_is_active_ledger_member"("ledger_id")));



ALTER TABLE "public"."transaction_record_tag" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transaction_record_tag_delete_authorized" ON "public"."transaction_record_tag" FOR DELETE TO "authenticated" USING ("public"."current_user_can_mutate_transaction"("ledger_id", "transaction_record_id"));



CREATE POLICY "transaction_record_tag_insert_authorized" ON "public"."transaction_record_tag" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_user_can_mutate_transaction"("ledger_id", "transaction_record_id") AND (EXISTS ( SELECT 1
   FROM "public"."transaction_tag" "tt"
  WHERE (("tt"."id" = "transaction_record_tag"."tag_id") AND ("tt"."ledger_id" = "transaction_record_tag"."ledger_id") AND ("tt"."is_archived" = false))))));



CREATE POLICY "transaction_record_tag_select_active_record" ON "public"."transaction_record_tag" FOR SELECT TO "authenticated" USING (("public"."current_user_is_active_ledger_member"("ledger_id") AND (EXISTS ( SELECT 1
   FROM "public"."transaction_record" "tr"
  WHERE (("tr"."id" = "transaction_record_tag"."transaction_record_id") AND ("tr"."ledger_id" = "transaction_record_tag"."ledger_id") AND ("tr"."status" = 'active'::"text"))))));



CREATE POLICY "transaction_record_update_authorized" ON "public"."transaction_record" FOR UPDATE TO "authenticated" USING ("public"."current_user_can_mutate_transaction"("ledger_id", "id")) WITH CHECK (("public"."current_user_can_mutate_transaction"("ledger_id", "id") AND ((NOT ("created_by" IS DISTINCT FROM "auth"."uid"())) OR "public"."current_user_can_manage_ledger"("ledger_id"))));



ALTER TABLE "public"."transaction_tag" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transaction_tag_insert_admin" ON "public"."transaction_tag" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_user_can_manage_ledger"("ledger_id") AND ("is_archived" = false) AND ("archived_at" IS NULL) AND ("archived_by" IS NULL)));



CREATE POLICY "transaction_tag_select_active_member" ON "public"."transaction_tag" FOR SELECT TO "authenticated" USING ((("is_archived" = false) AND "public"."current_user_is_active_ledger_member"("ledger_id")));



CREATE POLICY "transaction_tag_select_assigned_archived" ON "public"."transaction_tag" FOR SELECT TO "authenticated" USING (("public"."current_user_is_active_ledger_member"("ledger_id") AND (EXISTS ( SELECT 1
   FROM ("public"."transaction_record_tag" "trt"
     JOIN "public"."transaction_record" "tr" ON ((("tr"."id" = "trt"."transaction_record_id") AND ("tr"."ledger_id" = "trt"."ledger_id"))))
  WHERE (("trt"."tag_id" = "transaction_tag"."id") AND ("trt"."ledger_id" = "transaction_tag"."ledger_id") AND ("tr"."status" = 'active'::"text"))))));



CREATE POLICY "transaction_tag_update_admin" ON "public"."transaction_tag" FOR UPDATE TO "authenticated" USING ("public"."current_user_can_manage_ledger"("ledger_id")) WITH CHECK ("public"."current_user_can_manage_ledger"("ledger_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."ledger_member" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."ledger_member" TO "service_role";



REVOKE ALL ON FUNCTION "public"."accept_ledger_invitation"("p_ledger_member_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_ledger_invitation"("p_ledger_member_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."accept_ledger_invite"("p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_ledger_invite"("p_token" "text") TO "authenticated";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."account" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."account" TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_account_balance_delta"("p_ledger_id" "uuid", "p_account_id" "uuid", "p_delta" numeric, "p_updated_by" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_account_balance_delta"("p_ledger_id" "uuid", "p_account_id" "uuid", "p_delta" numeric, "p_updated_by" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."assign_ledger_member_default_display_color"() FROM PUBLIC;



GRANT ALL ON FUNCTION "public"."convert_transaction_type"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_target_type" "text", "p_transaction_at" timestamp with time zone, "p_note" "text", "p_account_id" "uuid", "p_merchant_id" "uuid", "p_items" "jsonb", "p_tag_names" "jsonb", "p_from_account_id" "uuid", "p_to_account_id" "uuid", "p_transfer_amount" numeric) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_account_with_holders"("p_ledger_id" "uuid", "p_name" "text", "p_type" "text", "p_currency" "text", "p_initial_balance" numeric, "p_holder_user_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_account_with_holders"("p_ledger_id" "uuid", "p_name" "text", "p_type" "text", "p_currency" "text", "p_initial_balance" numeric, "p_holder_user_ids" "uuid"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_ledger_invite_v2"("p_ledger_id" "uuid", "p_role" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_ledger_invite_v2"("p_ledger_id" "uuid", "p_role" "text") TO "authenticated";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."ledger" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."ledger" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_ledger_with_owner"("p_name" "text", "p_base_currency" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_ledger_with_owner"("p_name" "text", "p_base_currency" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."create_ledger_with_owner_settings"("p_name" "text", "p_base_currency" "text", "p_display_name" "text", "p_display_color" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_ledger_with_owner_settings"("p_name" "text", "p_base_currency" "text", "p_display_name" "text", "p_display_color" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."create_transaction"("p_ledger_id" "uuid", "p_type" "text", "p_transaction_at" timestamp with time zone, "p_items" "jsonb", "p_account_id" "uuid", "p_merchant_id" "uuid", "p_note" "text", "p_tag_names" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."create_transfer_transaction"("p_ledger_id" "uuid", "p_transaction_at" timestamp with time zone, "p_amount" numeric, "p_from_account_id" "uuid", "p_to_account_id" "uuid", "p_note" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."current_app_user_is_active"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_app_user_is_active"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."current_user_can_manage_ledger"("p_ledger_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_can_manage_ledger"("p_ledger_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."current_user_can_manage_member_display_setting"("p_ledger_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_can_manage_member_display_setting"("p_ledger_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."current_user_can_mutate_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_can_mutate_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."current_user_can_write_ledger"("p_ledger_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_can_write_ledger"("p_ledger_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."current_user_has_ledger_role"("p_ledger_id" "uuid", "p_roles" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_has_ledger_role"("p_ledger_id" "uuid", "p_roles" "text"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."current_user_is_active_ledger_member"("p_ledger_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_is_active_ledger_member"("p_ledger_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."enforce_ledger_management_permission"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."enforce_ledger_member_management_permission"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."enforce_merchant_alias_management_permission"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."enforce_transaction_child_permission"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."enforce_transaction_record_permission"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."get_ledger_invite_preview"("p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_ledger_invite_preview"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ledger_invite_preview"("p_token" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_next_ledger_member_display_color"("p_ledger_id" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."initialize_ledger_default_data"("p_ledger_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."list_pending_ledger_invites"("p_ledger_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_pending_ledger_invites"("p_ledger_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."load_transaction_group_summaries"("p_ledger_id" "uuid", "p_group_by" "text", "p_date_start" timestamp with time zone, "p_date_end" timestamp with time zone, "p_record_type" "text", "p_merchant_id" "uuid", "p_account_id" "uuid", "p_parent_category_id" "uuid", "p_category_id" "uuid", "p_tag_id" "uuid", "p_member_id" "uuid", "p_offset" integer, "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."load_transaction_group_summaries"("p_ledger_id" "uuid", "p_group_by" "text", "p_date_start" timestamp with time zone, "p_date_end" timestamp with time zone, "p_record_type" "text", "p_merchant_id" "uuid", "p_account_id" "uuid", "p_parent_category_id" "uuid", "p_category_id" "uuid", "p_tag_id" "uuid", "p_member_id" "uuid", "p_offset" integer, "p_limit" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."normalize_transaction_record_type_for_compat"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."prevent_used_category_type_change"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."replace_ledger_invite"("p_ledger_id" "uuid", "p_invite_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."replace_ledger_invite"("p_ledger_id" "uuid", "p_invite_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."revoke_ledger_invite"("p_ledger_id" "uuid", "p_invite_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."revoke_ledger_invite"("p_ledger_id" "uuid", "p_invite_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."sync_transaction_record_tags"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_tag_names" "jsonb", "p_user_id" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."update_account_with_holders"("p_ledger_id" "uuid", "p_account_id" "uuid", "p_name" "text", "p_type" "text", "p_currency" "text", "p_holder_user_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_account_with_holders"("p_ledger_id" "uuid", "p_account_id" "uuid", "p_name" "text", "p_type" "text", "p_currency" "text", "p_holder_user_ids" "uuid"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."update_ledger_member_settings"("p_ledger_id" "uuid", "p_member_user_id" "uuid", "p_display_name" "text", "p_display_color" "text", "p_role" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_ledger_member_settings"("p_ledger_id" "uuid", "p_member_user_id" "uuid", "p_display_name" "text", "p_display_color" "text", "p_role" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."update_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_type" "text", "p_transaction_at" timestamp with time zone, "p_items" "jsonb", "p_account_id" "uuid", "p_merchant_id" "uuid", "p_note" "text", "p_tag_names" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."update_transfer_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid", "p_transaction_at" timestamp with time zone, "p_amount" numeric, "p_from_account_id" "uuid", "p_to_account_id" "uuid", "p_note" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."validate_transaction_item_category_shape"() FROM PUBLIC;



GRANT ALL ON FUNCTION "public"."void_transaction"("p_ledger_id" "uuid", "p_transaction_record_id" "uuid") TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."account_holder" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."account_holder" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."account_holder" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."app_user" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."app_user" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."auth_otp_attempt" TO "service_role";



GRANT ALL ON SEQUENCE "public"."auth_otp_attempt_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."budget" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."budget" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."category" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."category" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."ledger_invite" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."ledger_member_display_setting" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."ledger_member_display_setting" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."merchant" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."merchant" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."merchant_alias" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."merchant_alias" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."merchant_alias" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."transaction_item" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."transaction_item" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."transaction_record" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."transaction_record" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."transaction_record_tag" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."transaction_record_tag" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."transaction_record_tag" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."transaction_tag" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."transaction_tag" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."transaction_tag" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";

-- 应用维护的非 public 对象：auth.users trigger
CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_auth_user"();
