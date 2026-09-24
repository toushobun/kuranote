import type { ServerAction } from "types/actions";
import type {
  AccountHolderOption,
  AccountPlaceholderHolderOption,
} from "types/accounts";

import { AccountForm } from "../AccountForm/AccountForm";
import {
  AccountDialogIllustrationSlot,
  AccountFormDialogShell,
} from "../AccountFormDialogShell/AccountFormDialogShell";

type AccountCreateDialogProps = {
  createAccountAction: ServerAction;
  defaultCurrency: string;
  holderOptions: AccountHolderOption[];
  onClose: () => void;
  open: boolean;
  placeholderHolderOptions?: AccountPlaceholderHolderOption[];
};

export function AccountCreateDialog({
  createAccountAction,
  defaultCurrency,
  holderOptions,
  onClose,
  open,
  placeholderHolderOptions = [],
}: AccountCreateDialogProps) {
  return (
    <AccountFormDialogShell
      illustrationSlot={<AccountDialogIllustrationSlot />}
      onClose={onClose}
      open={open}
    >
      <AccountForm
        createAccountAction={createAccountAction}
        defaultCurrency={defaultCurrency}
        holderOptions={holderOptions}
        onCancel={onClose}
        placeholderHolderOptions={placeholderHolderOptions}
      />
    </AccountFormDialogShell>
  );
}
