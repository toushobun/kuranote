"use client";

import { useState } from "react";

import { LedgerSetupWizard } from "organisms/ledgers/LedgerSetupWizard/LedgerSetupWizard";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

import { Probe } from "../probe";

const progress = createLedgerSetupProgressFixture({ step: 2 });
const unused = async () => ({});

export default function Page() {
  const [open, setOpen] = useState(false);
  return (
    <Probe>
      <div id="ledger-setup-page">
        <button type="button" onClick={() => setOpen(true)}>
          继续创建
        </button>
        {open && (
          <LedgerSetupWizard
            actions={{
              abandonSetup: unused,
              completeSetup: unused,
              createInvite: unused,
              loadInviteMembers: unused,
              placeholderMemberActions: { rename: unused, delete: unused },
              saveDraft: unused,
              submitBasicInfo: unused,
            }}
            defaultRootCategoryNames={[]}
            defaults={{
              baseCurrency: progress.setup.baseCurrency,
              displayColor: progress.setup.displayColor,
              displayName: progress.setup.displayName,
              ledgerName: progress.setup.name,
            }}
            onClose={() => setOpen(false)}
            open
            progress={progress}
          />
        )}
      </div>
    </Probe>
  );
}
