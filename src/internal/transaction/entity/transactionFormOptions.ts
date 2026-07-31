import type { MerchantSummary } from "internal/merchant";
import type {
  TransactionAccountOption,
  TransactionCategoryOption,
} from "types/transactions";

export type TransactionFormOptions = {
  accountOptions: TransactionAccountOption[];
  categoryOptions: TransactionCategoryOption[];
  merchantOptions: MerchantSummary[];
};
