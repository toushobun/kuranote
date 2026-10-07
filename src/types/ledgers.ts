import type {
  CurrentLedgerRole,
  LedgerCreateDefaults,
  LedgerPlaceholderMemberSummary,
  LedgerSetup,
  LedgerSetupDraft,
  LedgerSetupTemplate,
} from "internal/ledger";
import type { LedgerCurrency } from "internal/ledger";
import {
  isLedgerInviteRole,
  ledgerInviteRoles,
  type LedgerInviteRole,
} from "internal/ledger";
import type { ThemeColorKey } from "theme/themeColorTokens";
import type { ActionState } from "types/actions";

export const ledgerCurrencyOptions = [
  { label: "CNY 人民币", value: "CNY" },
  { label: "JPY 日元", value: "JPY" },
  { label: "USD 美元", value: "USD" },
  { label: "EUR 欧元", value: "EUR" },
  { label: "GBP 英镑", value: "GBP" },
  { label: "KRW 韩元", value: "KRW" },
  { label: "THB 泰铢", value: "THB" },
] as const satisfies readonly {
  label: string;
  value: LedgerCurrency;
}[];

export const ledgerMemberColorOptions = [
  "amber",
  "sakura",
  "lime",
  "jade",
  "sky",
  "lavender",
] as const satisfies readonly ThemeColorKey[];

export const ledgerRoleLabels: Record<CurrentLedgerRole, string> = {
  admin: "管理员",
  member: "成员",
  owner: "所有者",
  viewer: "只读",
};

export const ledgerRoleOptions = [
  { label: ledgerRoleLabels.owner, value: "owner" },
  { label: ledgerRoleLabels.admin, value: "admin" },
  { label: ledgerRoleLabels.member, value: "member" },
  { label: ledgerRoleLabels.viewer, value: "viewer" },
] as const satisfies readonly {
  label: string;
  value: CurrentLedgerRole;
}[];

export type LedgerSettingsMember = {
  avatarUrl: string | null;
  displayColor: ThemeColorKey;
  displayName: string;
  email: string | null;
  role: CurrentLedgerRole;
  userId: string;
};

export type PendingLedgerInvite = {
  createdAt: string;
  id: string;
  /**
   * 绑定的待邀请成员 ID，合并展示只以此为准，不看显示名。#809 起新邀请必定绑定；
   * RPC 返回列仍可空，展示时找不到占位的邀请直接忽略。
   */
  placeholderId: string | null;
  role: LedgerInviteRole;
  token: string | null;
};

export type { LedgerPlaceholderMemberSummary };

export { isLedgerInviteRole, ledgerInviteRoles, type LedgerInviteRole };

export const ledgerInviteRoleLabels: Record<LedgerInviteRole, string> = {
  admin: "管理员（Admin）",
  member: "用户（Member）",
  viewer: "只读（Viewer）",
};

export type CurrentLedgerActionState = ActionState;

export type CurrentLedgerStateAction = (
  previousState: CurrentLedgerActionState,
  formData: FormData,
) => Promise<CurrentLedgerActionState>;

/** 创建账本向导的进度：创建中账本与其默认货币对应的预设模板（无模板时为 null）。 */
export type LedgerSetupProgress = {
  setup: LedgerSetup;
  template: LedgerSetupTemplate | null;
};

/** 打开创建账本向导所需的数据。尚未创建账本时 progress 为 null。 */
export type LedgerSetupWizardView = LedgerCreateDefaults & {
  /** 完成创建时将自动创建的大分类名称（按排序），确认一览展示用。 */
  defaultRootCategoryNames: string[];
  progress: LedgerSetupProgress | null;
};

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

/** 打开向导时读取向导数据的结果。 */
export type LedgerSetupWizardViewActionState = ActionState & {
  view?: LedgerSetupWizardView;
};

export type LedgerSetupWizardViewLoadAction =
  () => Promise<LedgerSetupWizardViewActionState>;

/** 打开向导的入口（首页 / 账本管理页）使用的 Server Action：打开时读取向导数据，再交给向导各步骤。 */
export type LedgerSetupWizardLauncherActions = {
  loadWizard: LedgerSetupWizardViewLoadAction;
  wizard: LedgerSetupWizardActions;
};

/** 首页「继续创建」卡片与账本管理页「创建中」条目显示的创建中账本摘要。 */
export type LedgerSetupInProgressSummary = Pick<LedgerSetup, "name" | "step">;

export type LedgerSetupBasicInfoActionState = ActionState & {
  /** 提交成功，或已存在创建中账本时，重新读取的最新进度。 */
  progress?: LedgerSetupProgress;
  /** 已存在其他创建中账本，progress 为该账本：向导恢复到该账本而不是进入下一步。 */
  restored?: boolean;
};

export type LedgerSetupBasicInfoStateAction = (
  previousState: LedgerSetupBasicInfoActionState,
  formData: FormData,
) => Promise<LedgerSetupBasicInfoActionState>;

/** 保存向导草稿的输入。服务端重新校验账本 ID、步骤与草稿内容。 */
export type SaveLedgerSetupDraftInput = {
  draft: LedgerSetupDraft;
  ledgerId: string;
  /** 保存后记录的 ledger.setup_step（恢复向导时回到该步骤）。 */
  step: number;
};

export type LedgerSetupDraftActionState = ActionState & {
  /** 同一类型下有同名账户：由步骤在对应账户处提示，不显示失败弹框。 */
  accountNameDuplicate?: boolean;
  /**
   * 预设模板已更新或默认货币已变更，草稿未保存：progress 为重新读取的进度，
   * 向导用它替换状态并提示用户重新确认。
   */
  outdated?: boolean;
  /** 保存成功，或 outdated 时，重新读取的最新进度。 */
  progress?: LedgerSetupProgress;
};

export type LedgerSetupDraftSaveAction = (
  input: SaveLedgerSetupDraftInput,
) => Promise<LedgerSetupDraftActionState>;

/** 完成创建的输入。服务端重新校验账本 ID，完成内容只取自数据库中的草稿。 */
export type CompleteLedgerSetupInput = {
  ledgerId: string;
};

export type LedgerSetupCompleteActionState = ActionState & {
  /** 完成写入成功：账本已完成并切换为当前账本。 */
  completed?: boolean;
  /** 创建中账本已在其他页面完成或不存在：向导无法继续，只能关闭。 */
  notFound?: boolean;
  /** 预设模板已更新或默认货币已变更，未写入：progress 为重新读取的进度。 */
  outdated?: boolean;
  progress?: LedgerSetupProgress;
};

export type LedgerSetupCompleteAction = (
  input: CompleteLedgerSetupInput,
) => Promise<LedgerSetupCompleteActionState>;

/** 读取向导第 6 步「邀请成员」数据的输入。服务端重新校验账本 ID 与权限。 */
export type LoadLedgerSetupInviteMembersInput = {
  ledgerId: string;
};

/** 向导第 6 步展示的待邀请成员与待接受邀请（与账本设置页读取的数据相同）。 */
export type LedgerSetupInviteMembers = {
  pendingInvites: PendingLedgerInvite[];
  placeholderMembers: LedgerPlaceholderMemberSummary[];
};

export type LedgerSetupInviteMembersActionState = ActionState & {
  members?: LedgerSetupInviteMembers;
};

export type LedgerSetupInviteMembersLoadAction = (
  input: LoadLedgerSetupInviteMembersInput,
) => Promise<LedgerSetupInviteMembersActionState>;

export type LedgerInviteActionOperation = "create" | "invite" | "revoke";

/** 生成成功的邀请链接：只用于页面反馈（在哪一行展示新链接），绑定事实以列表为准。 */
export type CreatedLedgerInvite = {
  placeholderId: string;
  /** 与 fragment 相同，由页面按 isLedgerInviteRole 校验后使用。 */
  role: string;
  token: string;
};

export type LedgerInviteActionState = ActionState & {
  /**
   * 不跳转页面的邀请 Action（创建账本向导）生成链接成功时返回；
   * 账本设置页的 Action 成功后跳转并通过 fragment 传递，不使用此字段。
   */
  createdInvite?: CreatedLedgerInvite;
  operation?: LedgerInviteActionOperation;
};

export type LedgerInviteStateAction = (
  previousState: LedgerInviteActionState,
  formData: FormData,
) => Promise<LedgerInviteActionState>;

export type LedgerPlaceholderMemberActionOperation = "delete" | "rename";

export type LedgerPlaceholderMemberActionState = ActionState & {
  operation?: LedgerPlaceholderMemberActionOperation;
};

export type LedgerPlaceholderMemberStateAction = (
  previousState: LedgerPlaceholderMemberActionState,
  formData: FormData,
) => Promise<LedgerPlaceholderMemberActionState>;

export type LedgerPlaceholderMemberActions = Record<
  LedgerPlaceholderMemberActionOperation,
  LedgerPlaceholderMemberStateAction
>;

export type LedgerSettingsActionState = ActionState;

export type LedgerSettingsStateAction = (
  previousState: LedgerSettingsActionState,
  formData: FormData,
) => Promise<LedgerSettingsActionState>;

export type LedgerSettingsView = {
  canEditLedger: boolean;
  currentUser: {
    displayColor: ThemeColorKey;
    displayName: string;
    userId: string;
  };
  ledger: {
    baseCurrency: string;
    currentUserRole: CurrentLedgerRole;
    id: string;
    isCurrent: boolean;
    name: string;
    transactionItemSpecialStatusEnabled?: boolean;
  };
  members: LedgerSettingsMember[];
  pendingInvites: PendingLedgerInvite[];
  placeholderMembers: LedgerPlaceholderMemberSummary[];
};
