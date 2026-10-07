"use client";

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
} from "react";

import { ledgerSetupBasicInfoMessages } from "config/ledgerSetupMessages";
import type { LedgerBasicInfoValues } from "organisms/ledgers/LedgerBasicInfoFields/LedgerBasicInfoFields";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import { useConfirmDialog } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import type {
  LedgerSetupBasicInfoActionState,
  LedgerSetupProgress,
} from "types/ledgers";

const initialActionState: LedgerSetupBasicInfoActionState = {};
const currencyChangeConfirm =
  ledgerSetupBasicInfoMessages.currencyChangeConfirm;

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
  | "onNext"
  | "onProgressChange"
  | "onRestore"
  | "progress"
>;

export function useLedgerSetupBasicInfoStep({
  actions,
  defaults,
  onNext,
  onProgressChange,
  onRestore,
  progress,
}: UseLedgerSetupBasicInfoStepOptions) {
  const confirm = useConfirmDialog();
  const setup = progress?.setup ?? null;
  const [values, setValues] = useState(() =>
    getInitialValues(progress, defaults),
  );
  const [actionState, formAction, isPending] = useActionState(
    async (
      previousState: LedgerSetupBasicInfoActionState,
      formData: FormData,
    ) => {
      const nextState = await actions.submitBasicInfo(previousState, formData);

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

  // 只有草稿中已保存账户 / 商家选择时，修改默认货币才会清空内容（服务端负责清空）。
  const needsCurrencyChangeConfirm =
    setup !== null &&
    setup.hasTemplateSelections &&
    values.baseCurrency !== setup.baseCurrency;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const formData = new FormData(event.currentTarget);

    if (needsCurrencyChangeConfirm) {
      const confirmed = await confirm({
        confirmLabel: currencyChangeConfirm.confirm,
        description: currencyChangeConfirm.description,
        title: currencyChangeConfirm.title,
      });

      if (!confirmed) return;
    }

    startTransition(() => formAction(formData));
  }

  return {
    actionState,
    handleSubmit,
    isPending,
    ledgerId: setup?.id ?? "",
    setValues,
    values,
  };
}
