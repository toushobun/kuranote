import type { ComponentType } from "react";

import type { LedgerBasicInfoValues } from "organisms/ledgers/LedgerBasicInfoFields/LedgerBasicInfoFields";
import type {
  LedgerSetupBasicInfoStateAction,
  LedgerSetupProgress,
} from "types/ledgers";

/** 向导各步骤调用的 Server Action。后续步骤在此追加（例如保存草稿、完成写入）。 */
export type LedgerSetupWizardActions = {
  submitBasicInfo: LedgerSetupBasicInfoStateAction;
};

/** 骨架传给每个步骤组件的 props。步骤自行渲染内容与底部操作栏。 */
export type LedgerSetupWizardStepProps = {
  actions: LedgerSetupWizardActions;
  /** 尚未创建账本时第 1 步使用的默认值。 */
  defaults: LedgerBasicInfoValues;
  isLastStep: boolean;
  /** 进入下一步。 */
  onNext: () => void;
  /** 返回上一步。第 1 步不会调用。 */
  onPrevious: () => void;
  /** 保存成功后用服务端重新读取的进度更新向导。 */
  onProgressChange: (progress: LedgerSetupProgress) => void;
  /** 恢复到另一个创建中账本：替换进度并跳到该账本上次的步骤。 */
  onRestore: (progress: LedgerSetupProgress) => void;
  /** 当前创建中账本进度；第 1 步尚未提交时为 null。 */
  progress: LedgerSetupProgress | null;
  /** 当前步骤的标签。 */
  stepLabel: string;
};

export type LedgerSetupWizardStepDefinition = {
  Component: ComponentType<LedgerSetupWizardStepProps>;
  key: string;
  label: string;
};
