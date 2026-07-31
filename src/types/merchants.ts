import type { BaseActionState } from "types/auth";

export type MerchantActionState = BaseActionState & {
  errorKey?: string;
};

export type MerchantStateAction = (
  previousState: MerchantActionState,
  formData: FormData,
) => Promise<MerchantActionState>;

export type MerchantAlias = {
  id: string;
  merchant_id: string;
  alias: string;
  sort_order: number;
  created_at: string;
};

export type Merchant = {
  id: string;
  name: string;
  website_url: string | null;
  icon_url: string | null;
  note: string | null;
  sort_order: number;
  created_at: string;
  aliases: MerchantAlias[];
};
