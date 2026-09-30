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

export type DisplayNameActionState = BaseActionState & {
  errorKey?: string;
  successKey?: string;
};

export type DisplayNameAction = (
  previousState: DisplayNameActionState,
  formData: FormData,
) => Promise<DisplayNameActionState>;

export type AvatarActionState = BaseActionState & {
  errorKey?: string;
  successKey?: string;
};

export type AvatarAction = (
  previousState: AvatarActionState,
  formData: FormData,
) => Promise<AvatarActionState>;
