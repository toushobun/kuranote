import { ledgerSetupEntryMessages } from "config/ledgerSetupMessages";

import { ledgerSetupWizardSteps } from "./ledgerSetupWizardSteps";

const stepCount = ledgerSetupWizardSteps.length;

/**
 * 创建中账本的进度摘要，首页「继续创建」卡片与账本管理页「创建中」条目共用。
 * 步骤名取自向导步骤注册表；进度按已完成步数（N − 1）/ 总步数计算。
 */
export function getLedgerSetupProgressSummary(step: number) {
  const current = Math.min(Math.max(Math.trunc(step), 1), stepCount);
  const { label } = ledgerSetupWizardSteps[current - 1];

  return {
    /** 「进行到第 N 步 · 步骤名」 */
    description: ledgerSetupEntryMessages.progress(current, label),
    /** 0～1 */
    ratio: (current - 1) / stepCount,
    /** 「第 N / 6 步」 */
    stepCountText: ledgerSetupEntryMessages.stepCount(current, stepCount),
  };
}
