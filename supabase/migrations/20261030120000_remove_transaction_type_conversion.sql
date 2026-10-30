begin;

drop function public.convert_transaction_type_with_special_status(
    uuid, uuid, text, timestamptz, text,
    jsonb, uuid, jsonb, uuid, uuid, numeric
);

drop function public.convert_transaction_type(
    uuid, uuid, text, timestamptz, text,
    jsonb, uuid, jsonb, uuid, uuid, numeric
);

drop function public.convert_transaction_type_locked_impl(
    uuid, uuid, text, timestamptz, text,
    jsonb, uuid, jsonb, uuid, uuid, numeric
);

commit;
