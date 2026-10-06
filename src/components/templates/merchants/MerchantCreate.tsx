"use client";

import { routePaths } from "config/paths";
import { merchantPageMessages, merchantText } from "config/merchantText";
import { SectionCard } from "molecules/ui/SectionCard";
import { MerchantFailureFeedback } from "organisms/merchants/MerchantFailureFeedback/MerchantFailureFeedback";
import { MerchantForm } from "organisms/merchants/MerchantForm/MerchantForm";
import { SettingsPageLayout } from "templates/layout/SettingsPageLayout";
import type {
  MerchantIconStateAction,
  MerchantStateAction,
  MerchantTag,
} from "types/merchants";

import { useMerchantsActionState } from "./useMerchantsActionState";

type MerchantCreateTemplateProps = {
  createMerchantAction: MerchantStateAction;
  fetchIconAction: MerchantIconStateAction;
  ledgerId: string;
  ledgerName: string;
  tags: MerchantTag[];
};

export function MerchantCreateTemplate({
  createMerchantAction,
  fetchIconAction,
  ledgerId,
  ledgerName,
  tags,
}: MerchantCreateTemplateProps) {
  const create = useMerchantsActionState(createMerchantAction, {
    operation: "create",
  });

  return (
    <SettingsPageLayout
      back={{
        href: routePaths.merchants,
        label: merchantPageMessages.backToMerchants,
      }}
      subtitle={merchantPageMessages.createSubtitle(ledgerName)}
      title={merchantText.create}
    >
      <SectionCard sx={{ p: { xs: 2, sm: 3 } }}>
        <MerchantForm
          action={create.action}
          fetchIconAction={fetchIconAction}
          ledgerId={ledgerId}
          pending={create.pending}
          tags={tags}
        />
      </SectionCard>
      <MerchantFailureFeedback
        state={create.state}
        title={merchantText.createErrorTitle}
      />
    </SettingsPageLayout>
  );
}
