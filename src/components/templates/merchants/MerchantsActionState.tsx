"use client";

import { useState, type ComponentProps } from "react";

import { FailureFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import { MerchantCard } from "organisms/merchants/MerchantCard/MerchantCard";
import { MerchantForm } from "organisms/merchants/MerchantForm/MerchantForm";
import type { ServerAction } from "types/actions";
import type {
  MerchantActionState,
  Merchant,
  MerchantStateAction,
} from "types/merchants";

import { MerchantsTemplate } from "./Merchants";
import { useMerchantsActionState } from "./useMerchantsActionState";

type MerchantsActionStateTemplateProps = Omit<
  ComponentProps<typeof MerchantsTemplate>,
  | "archiveMerchantAction"
  | "archiveMerchantAliasAction"
  | "createMerchantAction"
  | "createMerchantAliasAction"
  | "createMerchantFormResetKey"
  | "createMerchantPending"
  | "renderCreateMerchantForm"
  | "renderMerchantCard"
  | "updateMerchantAction"
> & {
  archiveMerchantAction: MerchantStateAction;
  archiveMerchantAliasAction: MerchantStateAction;
  createMerchantAction: MerchantStateAction;
  createMerchantAliasAction: MerchantStateAction;
  updateMerchantAction: MerchantStateAction;
};

type MerchantCardActionStateProps = {
  archiveAliasAction: ServerAction;
  archiveMerchantAction: ServerAction;
  canManageMerchants: boolean;
  createMerchantAliasAction: MerchantStateAction;
  merchant: Merchant;
  updateMerchantAction: MerchantStateAction;
};

export function MerchantsActionStateTemplate({
  archiveMerchantAction,
  archiveMerchantAliasAction,
  canManageMerchants = true,
  createMerchantAction,
  createMerchantAliasAction,
  updateMerchantAction,
  ...templateProps
}: MerchantsActionStateTemplateProps) {
  const archive = useMerchantsActionState(archiveMerchantAction, {
    operation: "archive",
  });
  const archiveAlias = useMerchantsActionState(archiveMerchantAliasAction, {
    operation: "archiveAlias",
  });

  return (
    <>
      <MerchantsTemplate
        {...templateProps}
        archiveMerchantAction={archive.action}
        archiveMerchantAliasAction={archiveAlias.action}
        canManageMerchants={canManageMerchants}
        renderCreateMerchantForm={() => (
          <CreateMerchantActionState action={createMerchantAction} />
        )}
        renderMerchantCard={(merchant) => (
          <MerchantCardActionState
            archiveAliasAction={archiveAlias.action}
            archiveMerchantAction={archive.action}
            canManageMerchants={canManageMerchants}
            createMerchantAliasAction={createMerchantAliasAction}
            merchant={merchant}
            updateMerchantAction={updateMerchantAction}
          />
        )}
      />
      <MerchantFailureFeedback state={archive.state} title="商家归档失败" />
      <MerchantFailureFeedback
        state={archiveAlias.state}
        title="商家别名归档失败"
      />
    </>
  );
}

function CreateMerchantActionState({
  action,
}: {
  action: MerchantStateAction;
}) {
  const create = useMerchantsActionState(action, {
    operation: "create",
    resetOnSuccess: true,
  });

  return (
    <>
      <MerchantForm
        action={create.action}
        key={create.resetKey}
        pending={create.pending}
      />
      <MerchantFailureFeedback state={create.state} title="商家新增失败" />
    </>
  );
}

function MerchantCardActionState({
  archiveAliasAction,
  archiveMerchantAction,
  canManageMerchants,
  createMerchantAliasAction,
  merchant,
  updateMerchantAction,
}: MerchantCardActionStateProps) {
  const createAlias = useMerchantsActionState(createMerchantAliasAction, {
    merchantId: merchant.id,
    operation: "createAlias",
    resetOnSuccess: true,
  });
  const update = useMerchantsActionState(updateMerchantAction, {
    merchantId: merchant.id,
    operation: "update",
    resetOnSuccess: true,
  });

  return (
    <>
      <MerchantCard
        archiveAliasAction={archiveAliasAction}
        archiveMerchantAction={archiveMerchantAction}
        canManageMerchants={canManageMerchants}
        createAliasAction={createAlias.action}
        createAliasPending={createAlias.pending}
        merchant={merchant}
        merchantAliasFormResetKey={createAlias.resetKey}
        merchantEditFormResetKey={update.resetKey}
        updateMerchantAction={update.action}
        updateMerchantPending={update.pending}
      />
      <MerchantFailureFeedback
        state={createAlias.state}
        title="商家别名新增失败"
      />
      <MerchantFailureFeedback state={update.state} title="商家更新失败" />
    </>
  );
}

function MerchantFailureFeedback({
  state,
  title,
}: {
  state: MerchantActionState;
  title: string;
}) {
  const currentErrorKey = state.errorKey ?? state.error ?? null;
  const [closedErrorKey, setClosedErrorKey] = useState<string | null>(null);
  const open = state.error !== undefined && currentErrorKey !== closedErrorKey;

  return (
    <FailureFeedbackDialog
      aboveModal
      description={state.error ?? null}
      onClose={() => setClosedErrorKey(currentErrorKey)}
      open={open}
      title={title}
    />
  );
}
