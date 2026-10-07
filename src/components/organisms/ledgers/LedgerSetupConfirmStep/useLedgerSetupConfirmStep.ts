"use client";

import { useMemo, useRef, useState } from "react";

import { ledgerSetupWriteErrorMessages } from "internal/ledger";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import type { ActionState } from "types/actions";
import type {
  LedgerSetupCompleteActionState,
  LedgerSetupProgress,
} from "types/ledgers";
import { buildLedgerSetupConfirmSummary } from "utils/ledgerSetupSummary";

type UseLedgerSetupConfirmStepOptions = Pick<
  LedgerSetupWizardStepProps,
  | "actions"
  | "onBusyChange"
  | "onProgressRefresh"
  | "onSetupCompleted"
  | "onSetupUnavailable"
> & {
  progress: LedgerSetupProgress;
};

export function useLedgerSetupConfirmStep({
  actions,
  onBusyChange,
  onProgressRefresh,
  onSetupCompleted,
  onSetupUnavailable,
  progress,
}: UseLedgerSetupConfirmStepOptions) {
  const summary = useMemo(
    () => buildLedgerSetupConfirmSummary(progress),
    [progress],
  );
  const [isCompleting, setIsCompleting] = useState(false);
  // 创建中账本已在其他页面完成或不存在：无法继续，只能关闭向导。
  const [isUnavailable, setIsUnavailable] = useState(false);
  // 失败弹框（ActionFailureFeedback）使用的状态。
  const [failureState, setFailureState] = useState<ActionState>({});
  // state 更新前的连续点击也只提交一次。
  const completingRef = useRef(false);

  async function complete() {
    if (completingRef.current || isUnavailable) return;

    completingRef.current = true;
    setIsCompleting(true);
    onBusyChange(true);

    let state: LedgerSetupCompleteActionState;
    try {
      state = await actions.completeSetup({ ledgerId: progress.setup.id });
    } catch {
      // 网络断开等导致 Server Action 本身调用失败：显示通用的完成失败提示，停留在确认一览。
      state = createErrorState(ledgerSetupWriteErrorMessages.completeFailed);
    } finally {
      completingRef.current = false;
      setIsCompleting(false);
      onBusyChange(false);
    }

    if (state.completed) {
      onSetupCompleted();
      return;
    }

    if (state.outdated && state.progress) {
      onProgressRefresh(state.progress);
      return;
    }

    if (state.notFound) {
      setIsUnavailable(true);
      onSetupUnavailable();
    }

    setFailureState(state);
  }

  return {
    failureState,
    isCompleting,
    // 提交中或已无法继续时锁定「上一步」与各卡片的「修改」。
    isLocked: isCompleting || isUnavailable,
    isUnavailable,
    summary,
    complete() {
      void complete();
    },
  };
}
