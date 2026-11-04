"use client";

import { useState } from "react";

import { LedgersTemplate } from "templates/ledgers/Ledgers";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

import { Probe } from "../probe";

const progress = createLedgerSetupProgressFixture({ step: 2 });
const unused = async () => ({});

export default function Page() {
  const [draft, setDraft] = useState<typeof progress | null>(progress);
  return (
    <Probe>
      <div id="ledger-setup-page">
        <LedgersTemplate
          currentLedgerId=""
          errorMessage={null}
          ledgers={[]}
          setupInProgress={draft?.setup}
          setupWizardActions={{
            loadWizard: async () => ({
              view: {
                defaultRootCategoryNames: [],
                defaults: {
                  baseCurrency: progress.setup.baseCurrency,
                  displayColor: progress.setup.displayColor,
                  displayName: progress.setup.displayName,
                  ledgerName: "",
                },
                progress: draft,
              },
            }),
            wizard: {
              abandonSetup: async () => {
                setDraft(null);
                return {};
              },
              completeSetup: unused,
              createInvite: unused,
              loadInviteMembers: unused,
              placeholderMemberActions: { rename: unused, delete: unused },
              saveDraft: unused,
              submitBasicInfo: unused,
            },
          }}
          updateCurrentLedgerAction={async () => {}}
        />
      </div>
    </Probe>
  );
}
