"use client";

import { useMemo, useRef, useState } from "react";

import { ledgerSetupWriteErrorMessages } from "internal/ledger";
import { createErrorState } from "internal/shared/adapter/next/actionState";
import type { LedgerSetupWizardStepProps } from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardStepTypes";
import type { ActionState } from "types/actions";
import {
  ledgerCurrencyOptions,
  type LedgerSetupCompleteActionState,
  type LedgerSetupProgress,
} from "types/ledgers";

/** 商家卡片中按商家标签汇总的已选数量。 */
export type LedgerSetupConfirmMerchantTag = {
  count: number;
  icon: string;
  key: string;
  name: string;
};

function getCurrencyLabel(currency: string) {
  return (
    ledgerCurrencyOptions.find(({ value }) => value === currency)?.label ??
    currency
  );
}

/**
 * 根据进度生成确认一览各卡片的内容。草稿已按账本当前默认货币与模板校正，
 * 这里只做展示用的汇总：跳过或数量为 0 时视为「已跳过」。
 */
export function buildLedgerSetupConfirmSummary({
  setup,
  template,
}: LedgerSetupProgress) {
  const { accounts, features, merchants } = setup.draft;
  const accountNames = accounts.skipped
    ? []
    : accounts.items.map(({ name }) => name);

  const selectedKeys = new Set(merchants.skipped ? [] : merchants.selectedKeys);
  const selectedMerchants = (template?.merchants ?? []).filter(({ key }) =>
    selectedKeys.has(key),
  );
  const merchantTags: LedgerSetupConfirmMerchantTag[] = [
    ...(template?.merchantTags ?? []),
  ]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ icon, key, name }) => ({
      count: selectedMerchants.filter(({ tagKeys }) => tagKeys.includes(key))
        .length,
      icon,
      key,
      name,
    }))
    .filter(({ count }) => count > 0);

  return {
    accounts: { names: accountNames, skipped: accountNames.length === 0 },
    basicInfo: {
      currencyLabel: getCurrencyLabel(setup.baseCurrency),
      displayColor: setup.displayColor,
      displayName: setup.displayName,
      ledgerName: setup.name,
    },
    merchants: {
      // 多标签商家只算一次。
      count: selectedMerchants.length,
      skipped: selectedMerchants.length === 0,
      tags: merchantTags,
    },
    specialStatusEnabled: features.specialStatusEnabled,
  };
}

type UseLedgerSetupConfirmStepOptions = Pick<
  LedgerSetupWizardStepProps,
  | "actions"
  | "onBusyChange"
  | "onNext"
  | "onProgressRefresh"
  | "onSetupUnavailable"
> & {
  progress: LedgerSetupProgress;
};

export function useLedgerSetupConfirmStep({
  actions,
  onBusyChange,
  onNext,
  onProgressRefresh,
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
      onNext();
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
