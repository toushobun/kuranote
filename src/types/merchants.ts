import type { BaseActionState } from "types/auth";

export type MerchantActionState = BaseActionState & {
  errorKey?: string;
};

export type MerchantStateAction = (
  previousState: MerchantActionState,
  formData: FormData,
) => Promise<MerchantActionState>;

export type MerchantIconActionState = MerchantActionState & {
  iconUrl?: string;
};

export type MerchantIconStateAction = (
  previousState: MerchantIconActionState,
  formData: FormData,
) => Promise<MerchantIconActionState>;

export type MerchantAlias = {
  id: string;
  merchant_id: string;
  alias: string;
  is_preferred: boolean;
  sort_order: number;
  created_at: string;
};

export type MerchantTag = {
  icon: string;
  id: string;
  merchant_count: number;
  name: string;
  sort_order: number;
};

export type Merchant = {
  id: string;
  name: string;
  display_name: string;
  website_url: string | null;
  icon_url: string | null;
  note: string | null;
  sort_order: number;
  created_at: string;
  aliases: MerchantAlias[];
  tags: MerchantTag[];
};

export type MerchantTagActionState = BaseActionState & {
  errorKey?: string;
};

export type MerchantTagStateAction = (
  previousState: MerchantTagActionState,
  formData: FormData,
) => Promise<MerchantTagActionState>;

export type MerchantTagReorderAction = (
  formData: FormData,
) => Promise<MerchantTagActionState>;
