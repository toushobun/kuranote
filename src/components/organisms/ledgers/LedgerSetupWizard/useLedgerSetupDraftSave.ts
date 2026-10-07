"use client";

import { useState } from "react";

import {
  ledgerSetupWriteErrorMessages,
  type LedgerSetupDraft,
} from "internal/ledger";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import type { ActionState } from "types/actions";
import type {
  LedgerSetupDraftActionState,
  LedgerSetupProgress,
} from "types/ledgers";

import type { LedgerSetupWizardStepProps } from "./ledgerSetupWizardStepTypes";

type UseLedgerSetupDraftSaveOptions = Pick<
  LedgerSetupWizardStepProps,
  | "actions"
  | "onBusyChange"
  | "onNext"
  | "onPrevious"
  | "onProgressChange"
  | "onProgressRefresh"
  | "step"
> & {
  progress: LedgerSetupProgress;
};

type SaveDirection = "next" | "previous";

/**
 * 保存时记录的 setup_step：「下一步 / 跳过此步」为下一步；
 * 「上一步」不倒退，取已保存步骤与当前步骤中较大的值。
 */
function getSetupStepToSave(
  direction: SaveDirection,
  step: number,
  savedStep: number,
) {
  return direction === "next" ? step + 1 : Math.max(savedStep, step);
}

/**
 * 向导第 2 步以后共用的「保存草稿后前进 / 后退」逻辑。
 * 返回上一步时同样保存当前步骤的修改，再次前进时修改不会丢失。
 */
export function useLedgerSetupDraftSave({
  actions,
  onBusyChange,
  onNext,
  onPrevious,
  onProgressChange,
  onProgressRefresh,
  progress,
  step,
}: UseLedgerSetupDraftSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  // 失败弹框（ActionFailureFeedback）使用的状态。
  const [failureState, setFailureState] = useState<ActionState>({});
  const [accountNameDuplicateError, setAccountNameDuplicateError] = useState<
    string | null
  >(null);

  async function save(direction: SaveDirection, draft: LedgerSetupDraft) {
    if (isSaving) return;

    setIsSaving(true);
    onBusyChange(true);
    setAccountNameDuplicateError(null);

    let state: LedgerSetupDraftActionState;
    try {
      state = await actions.saveDraft({
        draft,
        ledgerId: progress.setup.id,
        step: getSetupStepToSave(direction, step, progress.setup.step),
      });
    } catch {
      // 网络断开等导致 Server Action 本身调用失败：显示通用的保存失败提示，不切换步骤。
      state = createErrorState(ledgerSetupWriteErrorMessages.draftSaveFailed);
    } finally {
      setIsSaving(false);
      onBusyChange(false);
    }

    if (state.progress) {
      if (state.outdated) {
        onProgressRefresh(state.progress);
        return;
      }

      onProgressChange(state.progress);
      if (direction === "next") {
        onNext();
      } else {
        onPrevious();
      }
      return;
    }

    if (state.accountNameDuplicate && state.error) {
      setAccountNameDuplicateError(state.error);
      return;
    }

    setFailureState(state);
  }

  return {
    /** 服务端判定同类型账户重名时的文案，由账户步骤在对应账户处显示。 */
    accountNameDuplicateError,
    failureState,
    isSaving,
    saveAndGoNext(draft: LedgerSetupDraft) {
      return save("next", draft);
    },
    saveAndGoPrevious(draft: LedgerSetupDraft) {
      return save("previous", draft);
    },
  };
}
