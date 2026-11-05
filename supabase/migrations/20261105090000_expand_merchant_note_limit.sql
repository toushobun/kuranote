-- 临时放宽：商家备注上限由 1000 字符扩大到 100000 字符。
alter table public.merchant
drop constraint merchant_note_check;

alter table public.merchant
add constraint merchant_note_check
    check (note is null or length(note) <= 100000);
