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
  ledgerSetupDefaultRootCategoryNamesFixture,
} from "test/mocks/ledgerSetup";
import type {
  LedgerInviteStateAction,
  LedgerPlaceholderMemberStateAction,
  LedgerSetupAbandonAction,
  LedgerSetupInviteMembers,
  LedgerSetupInviteMembersLoadAction,
  LedgerSetupPersistAction,
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

export const savedTimestamp = "2026-11-07T01:00:00.000Z";

export function createPersistMock() {
  return vi.fn<LedgerSetupPersistAction>(async ({ complete }) => ({
    completed: complete,
    updatedAt: savedTimestamp,
  }));
}

export function createLoadInviteMembersMock(
  members: LedgerSetupInviteMembers = {
    pendingInvites: [],
    placeholderMembers: [],
  },
) {
  return vi.fn<LedgerSetupInviteMembersLoadAction>(async () => ({ members }));
}

function createDefaultActionMocks() {
  return {
    abandonSetup: vi.fn<LedgerSetupAbandonAction>(async () => ({})),
    persistSetup: createPersistMock(),
    createInvite: vi.fn<LedgerInviteStateAction>(async () => ({})),
    loadInviteMembers: createLoadInviteMembersMock(),
    placeholderMemberActions: {
      delete: vi.fn<LedgerPlaceholderMemberStateAction>(async () => ({})),
      rename: vi.fn<LedgerPlaceholderMemberStateAction>(async () => ({})),
    },
  };
}

export function createLedgerSetupWizardActionMocks({
  progress: _progress,
  ...overrides
}: Partial<ReturnType<typeof createDefaultActionMocks>> & {
  progress?: LedgerSetupProgress | null;
} = {}) {
  return { ...createDefaultActionMocks(), ...overrides };
}

export function createLedgerSetupWizardLauncherActionMocks(
  progress: LedgerSetupProgress | null = null,
) {
  return {
    loadWizard: vi.fn<LedgerSetupWizardViewLoadAction>(async () => ({
      view: {
        defaultRootCategoryNames: [...ledgerSetupDefaultRootCategoryNamesFixture],
        defaults: ledgerSetupWizardTestDefaults,
        progress,
      },
    })),
    wizard: createLedgerSetupWizardActionMocks({ progress }),
  };
}

export function getPersistedInput(action: Mock<LedgerSetupPersistAction>) {
  return action.mock.calls[0][0];
}

type RenderOptions = Parameters<typeof createLedgerSetupWizardActionMocks>[0];

export function renderLedgerSetupWizard(options: RenderOptions = {}) {
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

export function getCurrentStepItem() {
  return within(screen.getByRole("list", { name: "创建进度" }))
    .getAllByRole("listitem")
    .find((item) => item.getAttribute("aria-current") === "step");
}

export function clickNext() {
  fireEvent.click(screen.getByRole("button", { name: /^下一步/ }));
}

export function clickPrevious() {
  fireEvent.click(screen.getByRole("button", { name: "上一步" }));
}

export async function goPreviousTo(stepLabel: string) {
  clickPrevious();
  await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent(stepLabel));
}

export function clickCloseWizard() {
  fireEvent.click(screen.getByRole("button", { name: "关闭创建账本向导" }));
}

export function clickCompleteSetup() {
  fireEvent.click(screen.getByRole("button", { name: "完成创建" }));
}

export async function completeSetupAndWait() {
  clickCompleteSetup();
  await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("邀请"));
}

export async function renderLedgerSetupWizardAtInviteStep(
  options: RenderOptions = {},
) {
  const result = renderLedgerSetupWizard({
    progress: createLedgerSetupConfirmProgressFixture(),
    ...options,
  });
  await completeSetupAndWait();
  return result;
}

export async function waitForInviteEntry() {
  return screen.findByRole("button", { name: /^邀请成员/ });
}

export async function finishInviteAndWait() {
  fireEvent.click(screen.getByRole("button", { name: "完成" }));
  await screen.findByRole("heading", { name: "一切就绪！" });
}
