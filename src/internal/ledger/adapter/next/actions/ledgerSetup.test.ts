// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
} from "internal/ledger/errors/ledgerSetup";
import { ConflictError } from "internal/shared/errors/appError";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

import {
  abandonLedgerSetup,
  persistLedgerSetup,
  loadLedgerSetupInviteMembers,
} from "./ledgerSetup";

const mocks = vi.hoisted(() => ({
  abandon: vi.fn(),
  persist: vi.fn(),
  createDependencies: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  listPendingInvites: vi.fn(),
  listUnclaimedPlaceholders: vi.fn(),
  revalidateLedgerMutation: vi.fn(),
}));

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));
vi.mock("internal/ledger/adapter/next/revalidateLedger", () => ({
  revalidateLedgerMutation: mocks.revalidateLedgerMutation,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createDependencies,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: () => ({
    ledger: {
      inviteService: { listPending: mocks.listPendingInvites },
      placeholderMemberService: {
        listUnclaimed: mocks.listUnclaimedPlaceholders,
      },
      setupService: {
        abandon: mocks.abandon,
        persist: mocks.persist,
      },
    },
  }),
}));

const progress = createLedgerSetupProgressFixture();
const input = {
  setup: progress.setup,
  expectedUpdatedAt: progress.setup.updatedAt ?? null,
  step: 5,
  complete: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createDependencies.mockResolvedValue({});
  mocks.getCurrentLedgerContext.mockResolvedValue({
    currentLedger: null,
    email: "user@example.com",
    ledgers: [],
    userId: "00000000-0000-4000-8000-000000000031",
  });
  mocks.persist.mockResolvedValue("2026-11-07T03:00:00.000Z");
  mocks.abandon.mockResolvedValue(undefined);
  mocks.listPendingInvites.mockResolvedValue([]);
  mocks.listUnclaimedPlaceholders.mockResolvedValue([]);
});

describe("persistLedgerSetup", () => {
  it("同一接口完整提交基本信息、草稿、步骤和乐观锁版本", async () => {
    await expect(persistLedgerSetup(input)).resolves.toEqual({
      completed: true,
      updatedAt: "2026-11-07T03:00:00.000Z",
    });
    expect(mocks.persist).toHaveBeenCalledWith({
      ledgerId: progress.setup.id,
      expectedUpdatedAt: progress.setup.updatedAt,
      name: progress.setup.name,
      baseCurrency: progress.setup.baseCurrency,
      displayName: progress.setup.displayName,
      displayColor: progress.setup.displayColor,
      livingRegion: progress.setup.livingRegion,
      draft: progress.setup.draft,
      step: 5,
      complete: true,
    });
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledOnce();
  });

  it("保存退出只返回持久化时间，不标完成", async () => {
    const state = await persistLedgerSetup({ ...input, complete: false });
    expect(state.completed).toBe(false);
    expect(state.updatedAt).toBeDefined();
  });

  it("客户端提交非法 ID 时不会访问 Service", async () => {
    const state = await persistLedgerSetup({
      ...input,
      setup: { ...input.setup, id: "bad" },
    });
    expect(state.error).toBeDefined();
    expect(mocks.persist).not.toHaveBeenCalled();
  });

  it("已有另一个创建中账本时显示冲突，不回退到静默恢复", async () => {
    mocks.persist.mockRejectedValue(new ConflictError(
      ledgerSetupErrorCodes.inProgressExists,
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists],
    ));
    const state = await persistLedgerSetup(input);
    expect(state.error).toBe(
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists],
    );
    expect(state.completed).toBeUndefined();
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("并发乐观锁冲突也不能标记完成", async () => {
    mocks.persist.mockRejectedValue(new ConflictError(
      ledgerSetupErrorCodes.conflict,
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.conflict],
    ));
    const state = await persistLedgerSetup(input);
    expect(state.error).toBe(
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.conflict],
    );
    expect(state.completed).toBeUndefined();
  });
});

describe("其他向导入口", () => {
  it("外层放弃创建仍调用 abandon", async () => {
    await expect(abandonLedgerSetup({ ledgerId: progress.setup.id })).resolves.toEqual({});
    expect(mocks.abandon).toHaveBeenCalledExactlyOnceWith(progress.setup.id);
  });

  it("读取邀请成员功能继续使用原有服务", async () => {
    await expect(loadLedgerSetupInviteMembers({ ledgerId: progress.setup.id })).resolves.toEqual({
      members: { pendingInvites: [], placeholderMembers: [] },
    });
  });
});
