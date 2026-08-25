alter table public.app_user
add column transaction_color_scheme text not null
default 'expense_green_income_red';

alter table public.app_user
add constraint app_user_transaction_color_scheme_check
check (
    transaction_color_scheme in (
        'expense_red_income_green',
        'expense_green_income_red'
    )
);
