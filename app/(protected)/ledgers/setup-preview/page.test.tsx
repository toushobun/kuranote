// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadLedgerSetupWizard: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

vi.mock("internal/ledger/adapter/next/loadLedgerSetupWizard", () => ({
  loadLedgerSetupWizard: mocks.loadLedgerSetupWizard,
}));

vi.mock("internal/ledger/adapter/next/actions/ledgerSetup", () => ({
  submitLedgerSetupBasicInfo: vi.fn(),
}));

vi.mock("templates/ledgers/LedgerSetupPreview", () => ({
  LedgerSetupPreviewTemplate: () => null,
}));

import LedgerSetupPreviewRoute from "./page";

const view = {
  defaults: {
    baseCurrency: "JPY",
    displayColor: "amber",
    displayName: "淞文",
    ledgerName: "家庭账本",
  },
  progress: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadLedgerSetupWizard.mockResolvedValue(view);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("LedgerSetupPreviewRoute", () => {
  it.each([
    ["Vercel Production", { NODE_ENV: "production", VERCEL_ENV: "production" }],
    ["本地生产构建", { NODE_ENV: "production", VERCEL_ENV: "" }],
  ])("%s 中返回 notFound() 且不读取数据", async (_label, env) => {
    vi.stubEnv("NODE_ENV", env.NODE_ENV);
    vi.stubEnv("VERCEL_ENV", env.VERCEL_ENV);

    await expect(LedgerSetupPreviewRoute()).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404",
    );
    expect(mocks.loadLedgerSetupWizard).not.toHaveBeenCalled();
  });

  it.each([
    ["Vercel Preview", { NODE_ENV: "production", VERCEL_ENV: "preview" }],
    ["本地开发", { NODE_ENV: "development", VERCEL_ENV: "" }],
  ])("%s 中读取向导数据并显示预览页", async (_label, env) => {
    vi.stubEnv("NODE_ENV", env.NODE_ENV);
    vi.stubEnv("VERCEL_ENV", env.VERCEL_ENV);

    const element = await LedgerSetupPreviewRoute();

    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(mocks.loadLedgerSetupWizard).toHaveBeenCalledTimes(1);
    expect(element.props).toMatchObject(view);
  });
});
