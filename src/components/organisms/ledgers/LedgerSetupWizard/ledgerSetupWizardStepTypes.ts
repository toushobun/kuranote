import type { ComponentType } from "react";

import type { LedgerBasicInfoValues } from "organisms/ledgers/LedgerBasicInfoFields/LedgerBasicInfoFields";
import type {
  LedgerInviteStateAction,
  LedgerPlaceholderMemberActions,
  LedgerSetupBasicInfoStateAction,
  LedgerSetupCompleteAction,
  LedgerSetupDraftSaveAction,
  LedgerSetupInviteMembersLoadAction,
  LedgerSetupProgress,
} from "types/ledgers";

/** 向导各步骤调用的 Server Action。后续步骤在此追加。 */
export type LedgerSetupWizardActions = {
  /** 第 5 步完成创建：写入默认数据并切换为当前账本。 */
  completeSetup: LedgerSetupCompleteAction;
  /** 第 6 步邀请成员（与账本设置页相同的邀请写入，成功后不跳转页面）。 */
  createInvite: LedgerInviteStateAction;
  /** 第 6 步读取新账本的待邀请成员与待接受邀请。 */
  loadInviteMembers: LedgerSetupInviteMembersLoadAction;
  /** 第 6 步待邀请成员的改名 / 删除（与账本设置页相同）。 */
  placeholderMemberActions: LedgerPlaceholderMemberActions;
  /** 第 2 步以后保存草稿与 setup_step。 */
  saveDraft: LedgerSetupDraftSaveAction;
  submitBasicInfo: LedgerSetupBasicInfoStateAction;
};

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
  /** 尚未创建账本时第 1 步使用的默认值。 */
  defaults: LedgerBasicInfoValues;
  /** 保存中通知骨架锁定「×」与关闭，避免保存过程中关闭向导。 */
  onBusyChange: (busy: boolean) => void;
  /** 跳到指定步骤（确认一览的「修改」）。只允许跳到账本完成前可编辑的步骤，其他值忽略。 */
  onGoToStep: (step: number) => void;
  /** 第 6 步「完成」：以最新读取的待邀请成员数进入完成页。 */
  onFinish: (placeholderMemberCount: number) => void;
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
  /** 第 5 步完成写入成功：骨架保存完成页统计并进入第 6 步。 */
  onSetupCompleted: () => void;
  /** 创建中账本已在其他页面完成或不存在：进度已无法继续，关闭向导时不再提示稍后继续。 */
  onSetupUnavailable: () => void;
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
