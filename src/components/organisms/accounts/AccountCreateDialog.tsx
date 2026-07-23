import type { ServerAction } from "types/actions";
import type { AccountHolderOption } from "types/accounts";

import { AccountForm } from "./AccountForm/AccountForm";
import {
  AccountDialogIllustrationSlot,
  AccountFormDialogShell,
} from "./AccountFormDialogShell/AccountFormDialogShell";

type AccountCreateDialogProps = {
  createAccountAction: ServerAction;
  defaultCurrency: string;
  holderOptions: AccountHolderOption[];
  onClose: () => void;
  open: boolean;
};

export function AccountCreateDialog({
  createAccountAction,
  defaultCurrency,
  holderOptions,
  onClose,
  open,
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
      />
    </AccountFormDialogShell>
  );
}
