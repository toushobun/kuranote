import type { TransactionColorScheme } from "internal/user";
import type { BaseActionState } from "types/auth";

export type TransactionColorSchemeActionState = BaseActionState & {
  errorKey?: string;
  transactionColorScheme?: TransactionColorScheme;
};

export type TransactionColorSchemeAction = (
  previousState: TransactionColorSchemeActionState,
  formData: FormData,
) => Promise<TransactionColorSchemeActionState>;
