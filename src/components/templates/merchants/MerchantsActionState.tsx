"use client";

import { useActionState, useState, type ComponentProps } from "react";

import { FailureFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import type { MerchantActionState, MerchantStateAction } from "types/merchants";

import { MerchantsTemplate } from "./Merchants";

const initialMerchantActionState: MerchantActionState = {};

type MerchantsActionStateTemplateProps = Omit<
  ComponentProps<typeof MerchantsTemplate>,
  | "archiveMerchantAction"
  | "archiveMerchantAliasAction"
  | "createMerchantAction"
  | "createMerchantAliasAction"
  | "updateMerchantAction"
> & {
  archiveMerchantAction: MerchantStateAction;
  archiveMerchantAliasAction: MerchantStateAction;
  createMerchantAction: MerchantStateAction;
  createMerchantAliasAction: MerchantStateAction;
  updateMerchantAction: MerchantStateAction;
};

export function MerchantsActionStateTemplate({
  archiveMerchantAction,
  archiveMerchantAliasAction,
  createMerchantAction,
  createMerchantAliasAction,
  updateMerchantAction,
  ...templateProps
}: MerchantsActionStateTemplateProps) {
  const [createState, createAction] = useActionState(
    createMerchantAction,
    initialMerchantActionState,
  );
  const [updateState, updateAction] = useActionState(
    updateMerchantAction,
    initialMerchantActionState,
  );
  const [archiveState, archiveAction] = useActionState(
    archiveMerchantAction,
    initialMerchantActionState,
  );
  const [createAliasState, createAliasAction] = useActionState(
    createMerchantAliasAction,
    initialMerchantActionState,
  );
  const [archiveAliasState, archiveAliasAction] = useActionState(
    archiveMerchantAliasAction,
    initialMerchantActionState,
  );

  return (
    <>
      <MerchantsTemplate
        {...templateProps}
        archiveMerchantAction={archiveAction}
        archiveMerchantAliasAction={archiveAliasAction}
        createMerchantAction={createAction}
        createMerchantAliasAction={createAliasAction}
        updateMerchantAction={updateAction}
      />
      <MerchantFailureFeedback state={createState} title="商家新增失败" />
      <MerchantFailureFeedback state={updateState} title="商家更新失败" />
      <MerchantFailureFeedback state={archiveState} title="商家归档失败" />
      <MerchantFailureFeedback
        state={createAliasState}
        title="商家别名新增失败"
      />
      <MerchantFailureFeedback
        state={archiveAliasState}
        title="商家别名归档失败"
      />
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
