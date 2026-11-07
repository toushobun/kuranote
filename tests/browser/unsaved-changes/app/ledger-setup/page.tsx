"use client";

import { useState } from "react";

import {
  createDefaultLedgerSetupDraft,
  getLedgerSetupTemplate,
} from "internal/ledger";
import { LedgersTemplate } from "templates/ledgers/Ledgers";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

import { Probe } from "../probe";

const progress = createLedgerSetupProgressFixture(
  { draft: createDefaultLedgerSetupDraft("jp"), step: 2 },
  getLedgerSetupTemplate("jp"),
);
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
              persistSetup: async ({ complete, setup, step }) => {
                const updatedAt = "2026-11-07T01:00:00Z";
                setDraft({
                  setup: { ...setup, step, updatedAt },
                  template: draft?.template ?? progress.template,
                });
                return { completed: complete, updatedAt };
              },
              createInvite: unused,
              loadInviteMembers: unused,
              placeholderMemberActions: { rename: unused, delete: unused },
            },
          }}
          updateCurrentLedgerAction={async () => {}}
        />
      </div>
    </Probe>
  );
}
