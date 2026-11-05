"use client";

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
} from "react";

import {
  getLedgerSetupRegionFromTimeZone,
  type LedgerSetupRegion,
} from "internal/ledger";
import type { LedgerBasicInfoValues } from "organisms/ledgers/LedgerBasicInfoFields/LedgerBasicInfoFields";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { useLedgerSetupStepDirty } from "organisms/ledgers/LedgerSetupWizard/useLedgerSetupStepDirty";
import type {
  LedgerSetupBasicInfoActionState,
  LedgerSetupProgress,
} from "types/ledgers";

const initialActionState: LedgerSetupBasicInfoActionState = {};

function getInitialValues(
  progress: LedgerSetupProgress | null,
  defaults: LedgerBasicInfoValues,
): LedgerBasicInfoValues {
  if (!progress) return defaults;

  const { setup } = progress;
  return {
    baseCurrency: setup.baseCurrency,
    displayColor: setup.displayColor,
    displayName: setup.displayName,
    ledgerName: setup.name,
  };
}

type UseLedgerSetupBasicInfoStepOptions = Pick<
  LedgerSetupWizardStepProps,
  | "actions"
  | "defaults"
  | "onBusyChange"
  | "onDirtyChange"
  | "onNext"
  | "onProgressChange"
  | "onRestore"
  | "progress"
>;

export function useLedgerSetupBasicInfoStep({
  actions,
  defaults,
  onBusyChange,
  onDirtyChange,
  onNext,
  onProgressChange,
  onRestore,
  progress,
}: UseLedgerSetupBasicInfoStepOptions) {
  const setup = progress?.setup ?? null;
  const [values, setValues] = useState(() =>
    getInitialValues(progress, defaults),
  );
  const [livingRegion, setLivingRegion] = useState<LedgerSetupRegion | null>(
    () =>
      progress
        ? progress.setup.livingRegion
        : getLedgerSetupRegionFromTimeZone(
            Intl.DateTimeFormat().resolvedOptions().timeZone,
          ),
  );
  useLedgerSetupStepDirty({ values, livingRegion }, onDirtyChange);
  const [actionState, formAction, isPending] = useActionState(
    async (
      previousState: LedgerSetupBasicInfoActionState,
      formData: FormData,
    ) => {
      let nextState: LedgerSetupBasicInfoActionState;
      onBusyChange(true);
      try {
        nextState = await actions.submitBasicInfo(previousState, formData);
      } finally {
        onBusyChange(false);
      }

      if (nextState.progress) {
        if (nextState.restored) {
          // 已存在其他创建中账本：恢复到该账本，而不是显示失败。
          onRestore(nextState.progress);
        } else {
          onProgressChange(nextState.progress);
          onNext();
        }
      }

      return nextState;
    },
    initialActionState,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const formData = new FormData(event.currentTarget);

    startTransition(() => formAction(formData));
  }

  return {
    actionState,
    handleSubmit,
    isPending,
    ledgerId: setup?.id ?? "",
    setValues,
    values,
    livingRegion,
    setLivingRegion,
  };
}
