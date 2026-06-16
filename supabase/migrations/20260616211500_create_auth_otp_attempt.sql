create table public.auth_otp_attempt (
    id bigserial primary key,
    purpose text not null,
    attempt_type text not null,
    email_hash text not null,
    ip_hash text not null,
    result text not null,
    created_at timestamptz not null default now(),

    constraint auth_otp_attempt_purpose_check
        check (purpose in ('signup')),

    constraint auth_otp_attempt_attempt_type_check
        check (attempt_type in ('send', 'verify_failure')),

    constraint auth_otp_attempt_result_check
        check (result in ('success', 'blocked', 'failed')),

    constraint auth_otp_attempt_email_hash_check
        check (length(email_hash) = 64),

    constraint auth_otp_attempt_ip_hash_check
        check (length(ip_hash) = 64)
);

alter table public.auth_otp_attempt enable row level security;

create index auth_otp_attempt_purpose_email_send_success_created_at_idx
on public.auth_otp_attempt (purpose, email_hash, created_at desc)
where attempt_type = 'send' and result = 'success';

create index auth_otp_attempt_purpose_ip_send_success_created_at_idx
on public.auth_otp_attempt (purpose, ip_hash, created_at desc)
where attempt_type = 'send' and result = 'success';

create index auth_otp_attempt_purpose_email_verify_failure_created_at_idx
on public.auth_otp_attempt (purpose, email_hash, created_at desc)
where attempt_type = 'verify_failure';

revoke all on table public.auth_otp_attempt from public;
revoke all on table public.auth_otp_attempt from anon;
revoke all on table public.auth_otp_attempt from authenticated;
grant select, insert on table public.auth_otp_attempt to service_role;

revoke all on sequence public.auth_otp_attempt_id_seq from public;
revoke all on sequence public.auth_otp_attempt_id_seq from anon;
revoke all on sequence public.auth_otp_attempt_id_seq from authenticated;
grant usage, select on sequence public.auth_otp_attempt_id_seq to service_role;
