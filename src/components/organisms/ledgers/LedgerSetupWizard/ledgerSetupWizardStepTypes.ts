import type { ComponentType } from "react";

import type {
  LedgerSetupProgress,
  LedgerSetupWizardActions,
} from "types/ledgers";

// 入口页（服务端）组装 Action 时也需要该类型，定义放在 types/ledgers。
export type { LedgerSetupWizardActions };

/**
 * 完成页显示的统计。完成写入成功时由骨架按确认一览的数据保存，
 * 之后不再读取已过期的草稿；待邀请成员数在第 6 步「完成」时补充。
 */
export type LedgerSetupCompletion = {
  accountCount: number;
  ledgerName: string;
  merchantCount: number;
};

/** 骨架传给每个步骤组件的 props。步骤自行渲染内容与底部操作栏。 */
export type LedgerSetupWizardStepProps = {
  actions: LedgerSetupWizardActions;
  /** 完成创建时将自动创建的大分类名称（按排序），确认一览展示用。 */
  defaultRootCategoryNames: readonly string[];
  validationError?: string | null;
  onBusyChange: (busy: boolean) => void;
  /** 跳到指定步骤（确认一览的「修改」）。只允许跳到账本完成前可编辑的步骤，其他值忽略。 */
  onGoToStep: (step: number) => void;
  /** 第 6 步「完成」：以最新读取的待邀请成员数进入完成页。 */
  onFinish: (placeholderMemberCount: number) => void;
  /** 进入下一步。 */
  onNext: () => void;
  /** 返回上一步。第 1 步不会调用。 */
  onPrevious: () => void;
  /** 编辑本地草稿，由向导骨架统一管理。 */
  onProgressChange: (progress: LedgerSetupProgress) => void;
  /** 第 5 步由骨架提交完整草稿。 */
  onComplete: () => Promise<boolean>;
  /** 含全部本地草稿的进度；首次提交时才生成账本 ID。 */
  progress: LedgerSetupProgress;
};

export type LedgerSetupWizardStepDefinition = {
  Component: ComponentType<LedgerSetupWizardStepProps>;
  key: string;
  label: string;
};
