// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

import {
  loadLedgerSetupWizard,
  readLedgerSetupProgress,
} from "./loadLedgerSetupWizard";

const mocks = vi.hoisted(() => ({
  createDependencies: vi.fn(),
  getCreateDefaults: vi.fn(),
  getCurrentLedgerContext: vi.fn(),
  getCurrentUserSetup: vi.fn(),
  getTemplate: vi.fn(),
}));

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  getCurrentLedgerContext: mocks.getCurrentLedgerContext,
}));

vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies: mocks.createDependencies,
}));

vi.mock("internal/container", () => ({
  createRequestContainer: () => ({
    ledger: {
      service: { getCreateDefaults: mocks.getCreateDefaults },
      setupService: {
        getCurrentUserSetup: mocks.getCurrentUserSetup,
        getTemplate: mocks.getTemplate,
      },
    },
  }),
}));

const defaults = {
  baseCurrency: "JPY",
  displayColor: "amber" as const,
  displayName: "淞文",
  ledgerName: "家庭账本",
};

const progress = createLedgerSetupProgressFixture();
const template = { currency: "JPY", version: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createDependencies.mockResolvedValue({});
  mocks.getCurrentLedgerContext.mockResolvedValue({
    currentLedger: { baseCurrency: "USD" },
    email: "user@example.com",
    userId: "user-1",
  });
  mocks.getCreateDefaults.mockResolvedValue({ defaults });
  mocks.getCurrentUserSetup.mockResolvedValue(progress.setup);
  mocks.getTemplate.mockReturnValue(template);
});

describe("readLedgerSetupProgress", () => {
  it("返回创建中账本与其默认货币对应的模板", async () => {
    await expect(
      readLedgerSetupProgress({
        getCurrentUserSetup: mocks.getCurrentUserSetup,
        getTemplate: mocks.getTemplate,
      }),
    ).resolves.toEqual({ setup: progress.setup, template });
    expect(mocks.getTemplate).toHaveBeenCalledWith("JPY");
  });

  it("没有创建中账本时返回 null 且不读取模板", async () => {
    mocks.getCurrentUserSetup.mockResolvedValue(null);

    await expect(
      readLedgerSetupProgress({
        getCurrentUserSetup: mocks.getCurrentUserSetup,
        getTemplate: mocks.getTemplate,
      }),
    ).resolves.toBeNull();
    expect(mocks.getTemplate).not.toHaveBeenCalled();
  });
});

describe("loadLedgerSetupWizard", () => {
  it("返回第 1 步默认值与创建中账本进度", async () => {
    await expect(loadLedgerSetupWizard()).resolves.toEqual({
      defaults,
      progress: { setup: progress.setup, template },
    });
    expect(mocks.getCreateDefaults).toHaveBeenCalledWith({
      email: "user@example.com",
      inheritedCurrency: "USD",
      userId: "user-1",
    });
  });

  it("读取失败时不吞掉异常", async () => {
    mocks.getCurrentUserSetup.mockRejectedValue(new Error("load failed"));

    await expect(loadLedgerSetupWizard()).rejects.toThrow("load failed");
  });
});
