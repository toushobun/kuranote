import type { ComponentType } from "react";

import type { LedgerBasicInfoValues } from "organisms/ledgers/LedgerBasicInfoFields/LedgerBasicInfoFields";
import type {
  LedgerSetupBasicInfoStateAction,
  LedgerSetupDraftSaveAction,
  LedgerSetupProgress,
} from "types/ledgers";

/** 向导各步骤调用的 Server Action。后续步骤在此追加（例如完成写入）。 */
export type LedgerSetupWizardActions = {
  /** 第 2 步以后保存草稿与 setup_step。 */
  saveDraft: LedgerSetupDraftSaveAction;
  submitBasicInfo: LedgerSetupBasicInfoStateAction;
};

/** 骨架传给每个步骤组件的 props。步骤自行渲染内容与底部操作栏。 */
export type LedgerSetupWizardStepProps = {
  actions: LedgerSetupWizardActions;
  /** 尚未创建账本时第 1 步使用的默认值。 */
  defaults: LedgerBasicInfoValues;
  isLastStep: boolean;
  /** 保存中通知骨架锁定「×」与关闭，避免保存过程中关闭向导。 */
  onBusyChange: (busy: boolean) => void;
  /** 进入下一步。 */
  onNext: () => void;
  /** 返回上一步。第 1 步不会调用。 */
  onPrevious: () => void;
  /** 保存成功后用服务端重新读取的进度更新向导。 */
  onProgressChange: (progress: LedgerSetupProgress) => void;
  /**
   * 预设内容已更新（草稿未保存）：用重新读取的进度替换向导状态，
   * 重新渲染当前步骤，并提示用户重新确认。
   */
  onProgressRefresh: (progress: LedgerSetupProgress) => void;
  /** 恢复到另一个创建中账本：替换进度并跳到该账本上次的步骤。 */
  onRestore: (progress: LedgerSetupProgress) => void;
  /** 当前创建中账本进度；第 1 步尚未提交时为 null。 */
  progress: LedgerSetupProgress | null;
  /** 当前步骤（从 1 开始），与 ledger.setup_step 对应。 */
  step: number;
  /** 当前步骤的标签。 */
  stepLabel: string;
};

export type LedgerSetupWizardStepDefinition = {
  Component: ComponentType<LedgerSetupWizardStepProps>;
  key: string;
  label: string;
};
