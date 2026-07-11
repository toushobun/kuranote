import type { CurrentLedger } from "lib/ledger/current-ledger";
import type {
  AccountOptionDbRow,
  AppUserSummaryDbRow,
  CategorySummaryDbRow,
  MerchantSummaryDbRow,
  TransactionItemDbRow,
  TransactionRecordDbRow,
} from "server/db-types";
import type { ThemeColorKey } from "theme/themeColorTokens";

export const transactionPageSize = 20;
export const activeTransactionRecordTypes = ["normal", "transfer"] as const;

export type RawTagAssignment = {
  tag_id: string;
  transaction_record_id: string;
};

export type TransactionGroupLoaderContext = {
  accountColorById: Map<string, ThemeColorKey>;
  accounts: AccountOptionDbRow[];
  categories: CategorySummaryDbRow[];
  currentLedger: CurrentLedger;
  currentUserId?: string;
  items: TransactionItemDbRow[];
  merchants: MerchantSummaryDbRow[];
  records: TransactionRecordDbRow[];
  recorders: AppUserSummaryDbRow[];
  showRecorder?: boolean;
  tagAssignments: RawTagAssignment[];
  tagById: Map<string, string>;
};
