"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";

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
  renderKey: string;
  updateMerchantAction: MerchantStateAction;
};

type PendingFormReset =
  | { operation: "create" }
  | { merchantId: string; operation: "createAlias" | "update" };

type FormResetKeys = {
  create: string;
  createAlias: Readonly<Record<string, string>>;
  update: Readonly<Record<string, string>>;
};

const initialFormResetKeys: FormResetKeys = {
  create: "initial",
  createAlias: {},
  update: {},
};

export function MerchantsActionStateTemplate({
  archiveMerchantAction,
  archiveMerchantAliasAction,
  createMerchantAction,
  createMerchantAliasAction,
  renderKey,
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
  const previousRenderKeyRef = useRef(renderKey);
  const pendingFormResetRef = useRef<PendingFormReset | null>(null);
  const [formResetKeys, setFormResetKeys] = useState(initialFormResetKeys);

  useEffect(() => {
    if (previousRenderKeyRef.current === renderKey) return;
    previousRenderKeyRef.current = renderKey;

    const pendingReset = pendingFormResetRef.current;
    pendingFormResetRef.current = null;
    if (!pendingReset) return;

    setFormResetKeys((current) => {
      if (pendingReset.operation === "create") {
        return { ...current, create: renderKey };
      }

      const resetGroup =
        pendingReset.operation === "createAlias" ? "createAlias" : "update";
      return {
        ...current,
        [resetGroup]: {
          ...current[resetGroup],
          [pendingReset.merchantId]: renderKey,
        },
      };
    });
  }, [renderKey]);

  useEffect(() => {
    const pendingReset = pendingFormResetRef.current;
    if (
      (pendingReset?.operation === "create" && createState.error) ||
      (pendingReset?.operation === "createAlias" && createAliasState.error) ||
      (pendingReset?.operation === "update" && updateState.error)
    ) {
      pendingFormResetRef.current = null;
    }
  }, [createAliasState, createState, updateState]);

  function submitCreateMerchant(formData: FormData) {
    pendingFormResetRef.current = { operation: "create" };
    createAction(formData);
  }

  function submitCreateMerchantAlias(formData: FormData) {
    const merchantId = formData.get("merchantId");
    if (typeof merchantId === "string") {
      pendingFormResetRef.current = {
        merchantId,
        operation: "createAlias",
      };
    }
    createAliasAction(formData);
  }

  function submitUpdateMerchant(formData: FormData) {
    const merchantId = formData.get("merchantId");
    if (typeof merchantId === "string") {
      pendingFormResetRef.current = { merchantId, operation: "update" };
    }
    updateAction(formData);
  }

  return (
    <>
      <MerchantsTemplate
        {...templateProps}
        archiveMerchantAction={archiveAction}
        archiveMerchantAliasAction={archiveAliasAction}
        createMerchantAction={submitCreateMerchant}
        createMerchantAliasAction={submitCreateMerchantAlias}
        createMerchantFormResetKey={formResetKeys.create}
        merchantAliasFormResetKeys={formResetKeys.createAlias}
        merchantEditFormResetKeys={formResetKeys.update}
        updateMerchantAction={submitUpdateMerchant}
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
