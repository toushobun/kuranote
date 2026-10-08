import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, vi, type Mock } from "vitest";

import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import {
  createLedgerSetupConfirmProgressFixture,
  createLedgerSetupProgressFixture,
  ledgerSetupDefaultRootCategoryNamesFixture,
} from "test/mocks/ledgerSetup";
import type {
  LedgerInviteStateAction,
  LedgerPlaceholderMemberStateAction,
  LedgerSetupAbandonAction,
  LedgerSetupBasicInfoStateAction,
  LedgerSetupCompleteAction,
  LedgerSetupDraftSaveAction,
  LedgerSetupInviteMembers,
  LedgerSetupInviteMembersLoadAction,
  LedgerSetupProgress,
  LedgerSetupWizardViewLoadAction,
} from "types/ledgers";

import { LedgerSetupWizard } from "./LedgerSetupWizard";

export const ledgerSetupWizardTestDefaults = {
  baseCurrency: "JPY",
  displayColor: "amber" as const,
  displayName: "DENG SONGWEN",
  ledgerName: "家庭账本",
};

/** 模拟保存草稿成功：返回保存了该草稿与步骤后的进度。 */
export function createSaveDraftMock(
  progress: LedgerSetupProgress = createLedgerSetupProgressFixture(),
) {
  return vi.fn<LedgerSetupDraftSaveAction>(async ({ draft, step }) => ({
    progress: { ...progress, setup: { ...progress.setup, draft, step } },
  }));
}

/** 模拟读取第 6 步数据成功：返回指定的待邀请成员与待接受邀请（默认都为空）。 */
export function createLoadInviteMembersMock(
  members: LedgerSetupInviteMembers = {
    pendingInvites: [],
    placeholderMembers: [],
  },
) {
  return vi.fn<LedgerSetupInviteMembersLoadAction>(async () => ({ members }));
}

/** 向导全部 Server Action 的 mock：默认全部立即成功，可按需覆盖。 */
export function createLedgerSetupWizardActionMocks({
  progress = null,
  ...overrides
}: Partial<ReturnType<typeof createDefaultActionMocks>> & {
  progress?: LedgerSetupProgress | null;
} = {}) {
  const defaults = createDefaultActionMocks(progress);
  // 显式传入 undefined 时沿用默认 mock。
  return {
    abandonSetup: overrides.abandonSetup ?? defaults.abandonSetup,
    completeSetup: overrides.completeSetup ?? defaults.completeSetup,
    createInvite: overrides.createInvite ?? defaults.createInvite,
    loadInviteMembers:
      overrides.loadInviteMembers ?? defaults.loadInviteMembers,
    placeholderMemberActions:
      overrides.placeholderMemberActions ?? defaults.placeholderMemberActions,
    saveDraft: overrides.saveDraft ?? defaults.saveDraft,
    submitBasicInfo: overrides.submitBasicInfo ?? defaults.submitBasicInfo,
  };
}

function createDefaultActionMocks(progress: LedgerSetupProgress | null) {
  return {
    abandonSetup: vi.fn<LedgerSetupAbandonAction>(async () => ({})),
    completeSetup: vi.fn<LedgerSetupCompleteAction>(async () => ({
      completed: true,
    })),
    createInvite: vi.fn<LedgerInviteStateAction>(async () => ({})),
    loadInviteMembers: createLoadInviteMembersMock(),
    placeholderMemberActions: {
      delete: vi.fn<LedgerPlaceholderMemberStateAction>(async () => ({})),
      rename: vi.fn<LedgerPlaceholderMemberStateAction>(async () => ({})),
    },
    saveDraft: createSaveDraftMock(progress ?? undefined),
    submitBasicInfo: vi.fn<LedgerSetupBasicInfoStateAction>(async () => ({})),
  };
}

/**
 * 打开向导的入口（LedgerSetupWizardLauncher）使用的 Action mock：
 * 打开时读取向导数据立即成功并返回指定进度，向导内各 Action 同 createLedgerSetupWizardActionMocks。
 */
export function createLedgerSetupWizardLauncherActionMocks(
  progress: LedgerSetupProgress | null = null,
) {
  return {
    loadWizard: vi.fn<LedgerSetupWizardViewLoadAction>(async () => ({
      view: {
        defaultRootCategoryNames: [
          ...ledgerSetupDefaultRootCategoryNamesFixture,
        ],
        defaults: ledgerSetupWizardTestDefaults,
        progress,
      },
    })),
    wizard: createLedgerSetupWizardActionMocks({ progress }),
  };
}

type RenderLedgerSetupWizardOptions = Parameters<
  typeof createLedgerSetupWizardActionMocks
>[0];

/** 第一次保存草稿时的参数。 */
export function getSavedInput(saveDraft: Mock<LedgerSetupDraftSaveAction>) {
  return saveDraft.mock.calls[0][0];
}

/** 创建账本向导测试共用的渲染：提供 ConfirmDialog / 用户主题 Provider，并返回回调 mock。 */
export function renderLedgerSetupWizard(
  options: RenderLedgerSetupWizardOptions = {},
) {
  const onClose = vi.fn();
  const actions = createLedgerSetupWizardActionMocks(options);

  render(
    <ConfirmDialogTestProviders>
      <LedgerSetupWizard
        actions={actions}
        defaultRootCategoryNames={ledgerSetupDefaultRootCategoryNamesFixture}
        defaults={ledgerSetupWizardTestDefaults}
        onClose={onClose}
        open
        progress={options.progress ?? null}
      />
    </ConfirmDialogTestProviders>,
  );

  return { ...actions, onClose };
}

export function getLedgerSetupWizardDialog() {
  return screen.getByRole("dialog", { name: "创建账本" });
}

/** 进度条中当前步骤的标签。 */
export function getCurrentStepItem() {
  return within(screen.getByRole("list", { name: "创建进度" }))
    .getAllByRole("listitem")
    .find((item) => item.getAttribute("aria-current") === "step");
}

/** 点击「下一步」。账户步骤的按钮带已选数量（「下一步 · 已选 N 个」），按前缀匹配。 */
export function clickNext() {
  fireEvent.click(screen.getByRole("button", { name: /^下一步/ }));
}

export function clickPrevious() {
  fireEvent.click(screen.getByRole("button", { name: "上一步" }));
}

/** 点击「上一步」并等待切换到指定步骤（第 2 步以后会先保存草稿）。 */
export async function goPreviousTo(stepLabel: string) {
  clickPrevious();
  await waitFor(() =>
    expect(getCurrentStepItem()).toHaveTextContent(stepLabel),
  );
}

export function clickCloseWizard() {
  fireEvent.click(screen.getByRole("button", { name: "关闭创建账本向导" }));
}

export function clickCompleteSetup() {
  fireEvent.click(screen.getByRole("button", { name: "完成创建" }));
}

/** 在确认一览点击「完成创建」并等待进入邀请步骤。 */
export async function completeSetupAndWait() {
  clickCompleteSetup();
  await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("邀请"));
}

/**
 * 渲染停在确认一览的向导并完成创建，等待进入第 6 步「邀请成员」且列表读取完成。
 * 默认使用确认一览 fixture（账户 2 个、去重商家 5 家）。
 */
export async function renderLedgerSetupWizardAtInviteStep(
  options: RenderLedgerSetupWizardOptions = {},
) {
  const result = renderLedgerSetupWizard({
    progress: createLedgerSetupConfirmProgressFixture(),
    ...options,
  });

  await completeSetupAndWait();
  return result;
}

/** 等待第 6 步的邀请成员列表读取完成（显示「邀请成员」入口）。 */
export async function waitForInviteEntry() {
  return screen.findByRole("button", { name: /^邀请成员/ });
}

/** 在第 6 步点击「完成」并等待进入完成页。 */
export async function finishInviteAndWait() {
  fireEvent.click(screen.getByRole("button", { name: "完成" }));
  await screen.findByRole("heading", { name: "一切就绪！" });
}
