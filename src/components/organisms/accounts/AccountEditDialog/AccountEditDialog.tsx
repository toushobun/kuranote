import { useState } from "react";

import { UnsavedChangesDialog } from "molecules/ui/UnsavedChangesDialog";
import type { ServerAction } from "types/actions";
import type { AccountHolderOption, AccountRow } from "types/accounts";

import {
  AccountEditForm,
  getAccountEditFormId,
} from "../AccountEditForm/AccountEditForm";
import {
  AccountDialogIllustrationSlot,
  AccountFormDialogShell,
} from "../AccountFormDialogShell/AccountFormDialogShell";

type AccountEditDialogProps = {
  account: AccountRow | null;
  archiveAccountAction: ServerAction;
  holderOptions: AccountHolderOption[];
  onClose: () => void;
  open: boolean;
  updateAccountAction: ServerAction;
};

export function AccountEditDialog({
  account,
  archiveAccountAction,
  holderOptions,
  onClose,
  open,
  updateAccountAction,
}: AccountEditDialogProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  function closeWithoutPrompt() {
    setHasUnsavedChanges(false);
    setIsExitDialogOpen(false);
    onClose();
  }

  function requestClose() {
    if (hasUnsavedChanges) {
      setIsExitDialogOpen(true);
      return;
    }

    closeWithoutPrompt();
  }

  function saveAndClose() {
    if (!account) return;

    const form = document.getElementById(getAccountEditFormId(account.id));
    if (!(form instanceof HTMLFormElement)) return;

    setIsExitDialogOpen(false);
    form.requestSubmit();
  }

  return (
    <>
      <AccountFormDialogShell
        illustrationSlot={<AccountDialogIllustrationSlot />}
        onClose={requestClose}
        open={open}
      >
        {account ? (
          <AccountEditForm
            account={account}
            archiveAccountAction={archiveAccountAction}
            holderOptions={holderOptions}
            onCancel={requestClose}
            onDirty={() => setHasUnsavedChanges(true)}
            onSubmit={() => setHasUnsavedChanges(false)}
            updateAccountAction={updateAccountAction}
          />
        ) : null}
      </AccountFormDialogShell>
      <UnsavedChangesDialog
        onCancel={() => setIsExitDialogOpen(false)}
        onDiscard={closeWithoutPrompt}
        onSave={saveAndClose}
        open={isExitDialogOpen}
      />
    </>
  );
}
