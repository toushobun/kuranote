import type { CurrentLedger } from "internal/ledger";
import type {
  AccountOptionDbRow,
  AppUserSummaryDbRow,
  CategorySummaryDbRow,
  MerchantSummaryDbRow,
  TransactionItemDbRow,
  TransactionPaymentDbRow,
  TransactionRecordDbRow,
} from "internal/db-types";
import type { ThemeColorKey } from "theme/themeColorTokens";

export const transactionPageSize = 20;
export const activeTransactionRecordTypes = [
  "normal",
  "transfer",
  "balance_adjustment",
] as const;

export type TransactionGroupLoaderContext = {
  accountColorById: Map<string, ThemeColorKey>;
  accounts: AccountOptionDbRow[];
  categories: CategorySummaryDbRow[];
  currentLedger: CurrentLedger;
  /** 账户的持有人 ID（成员 user_id 或占位 ID）；无持有人的账户不在其中。 */
  holderIdsByAccountId: Map<string, string[]>;
  items: TransactionItemDbRow[];
  merchants: MerchantSummaryDbRow[];
  payments: TransactionPaymentDbRow[];
  records: TransactionRecordDbRow[];
  recorders: AppUserSummaryDbRow[];
  showRecorder?: boolean;
};
