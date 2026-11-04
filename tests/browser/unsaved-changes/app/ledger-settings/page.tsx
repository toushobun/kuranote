import { LedgerSettingsActionStateTemplate } from "templates/ledgers/LedgerSettingsActionState";

import { saveLedgerSettings, unusedLedgerInvite } from "../actions";
import { Probe } from "../probe";

export default function Page() {
  const currentUser = {
    userId: "owner",
    displayName: "验证成员",
    displayColor: "amber",
  } as const;

  return (
    <Probe>
      <div id="ledger-settings-page">
        <LedgerSettingsActionStateTemplate
          canEditLedger
          currentUser={currentUser}
          inviteAction={unusedLedgerInvite}
          ledger={{
            baseCurrency: "JPY",
            currentUserRole: "owner",
            id: "test-ledger",
            isCurrent: true,
            name: "验证账本",
          }}
          members={[
            { ...currentUser, avatarUrl: null, email: null, role: "owner" },
          ]}
          pendingInvites={[]}
          placeholderMembers={[]}
          updateLedgerSettingsAction={saveLedgerSettings}
        />
      </div>
    </Probe>
  );
}
