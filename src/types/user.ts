import type { TransactionColorScheme } from "internal/user";
import type { ActionState } from "types/actions";

export type TransactionColorSchemeActionState = ActionState & {
  transactionColorScheme?: TransactionColorScheme;
};

export type TransactionColorSchemeAction = (
  previousState: TransactionColorSchemeActionState,
  formData: FormData,
) => Promise<TransactionColorSchemeActionState>;

export type DisplayNameActionState = ActionState;

export type DisplayNameAction = (
  previousState: DisplayNameActionState,
  formData: FormData,
) => Promise<DisplayNameActionState>;

export type AvatarActionState = ActionState;

export type AvatarAction = (
  previousState: AvatarActionState,
  formData: FormData,
) => Promise<AvatarActionState>;
