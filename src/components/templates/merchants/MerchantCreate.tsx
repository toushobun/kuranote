"use client";
import { useCreateAction } from "molecules/ui/useCreateAction/useCreateAction";

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

export type MerchantCreateTemplateProps = {
  onCancel?: () => void;
  onCreated?: (
    entity: NonNullable<
      import("types/merchants").MerchantActionState["createdMerchant"]
    >,
  ) => void;
  createMerchantAction: MerchantStateAction;
  fetchIconAction: MerchantIconStateAction;
  /** 从记一笔搜索不到时带来的关键词，预填到商家名称。 */
  initialName?: string;
  ledgerId: string;
  ledgerName: string;
  returnTo?: string | null;
  tags: MerchantTag[];
};

export function MerchantCreateTemplate(props: MerchantCreateTemplateProps) {
  return (
    <SettingsPageLayout
      back={{
        href: props.returnTo ?? routePaths.merchants,
        label: props.returnTo
          ? merchantPageMessages.back
          : merchantPageMessages.backToMerchants,
      }}
      subtitle={merchantPageMessages.createSubtitle(props.ledgerName)}
      title={merchantText.create}
    >
      <MerchantCreateBody {...props} />
    </SettingsPageLayout>
  );
}

export function MerchantCreateBody({
  createMerchantAction,
  fetchIconAction,
  initialName,
  ledgerId,
  returnTo = null,
  onCancel,
  onCreated,
  tags,
}: MerchantCreateTemplateProps) {
  const [state, formAction, pending] = useCreateAction(
    createMerchantAction,
    {},
    (value: import("types/merchants").MerchantActionState) =>
      value.createdMerchant,
    onCreated,
  );

  return (
    <>
      <SectionCard sx={{ p: { xs: 2, sm: 3 } }}>
        <MerchantForm
          action={formAction}
          fetchIconAction={fetchIconAction}
          initialName={initialName}
          ledgerId={ledgerId}
          pending={pending}
          onCancel={onCancel}
          returnTo={returnTo}
          tags={tags}
        />
      </SectionCard>
      <MerchantFailureFeedback
        state={state}
        title={merchantText.createErrorTitle}
      />
    </>
  );
}
