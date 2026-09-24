// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createLedgerPlaceholderMember,
  deleteLedgerPlaceholderMember,
  renameLedgerPlaceholderMember,
} from "internal/ledger/adapter/next/actions/ledgerPlaceholderMember";
import { getLedgerPlaceholderMemberErrorMessage } from "internal/ledger/errors/ledgerPlaceholderMember";
import { ConflictError } from "internal/shared/errors/appError";

const ledgerId = "00000000-0000-4000-8000-000000000032";
const placeholderId = "00000000-0000-4000-8000-000000000051";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  createDependencies: vi.fn(),
  delete: vi.fn(),
  rename: vi.fn(),
  requireCurrentUserAndLedger: vi.fn(),
  revalidateLedgerMutation: vi.fn(),
}));

vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger: mocks.requireCurrentUserAndLedger,
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
      placeholderMemberService: {
        create: mocks.create,
        delete: mocks.delete,
        rename: mocks.rename,
      },
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createDependencies.mockResolvedValue({});
  mocks.requireCurrentUserAndLedger.mockResolvedValue({
    currentLedger: { id: ledgerId },
    userId: "user-id",
  });
});

function form(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

const cases = [
  {
    action: createLedgerPlaceholderMember,
    operation: "create",
    service: mocks.create,
    values: { displayName: "奶奶", ledgerId },
  },
  {
    action: renameLedgerPlaceholderMember,
    operation: "rename",
    service: mocks.rename,
    values: { displayName: "外婆", ledgerId, placeholderId },
  },
  {
    action: deleteLedgerPlaceholderMember,
    operation: "delete",
    service: mocks.delete,
    values: { ledgerId, placeholderId },
  },
] as const;

describe.each(cases)("ledgerPlaceholderMember $operation", (testCase) => {
  it("成功后调用 Service、失效相关页面并返回成功状态", async () => {
    testCase.service.mockResolvedValueOnce(undefined);

    const state = await testCase.action({}, form(testCase.values));

    expect(testCase.service).toHaveBeenCalledWith({
      ...testCase.values,
      userId: "user-id",
    });
    expect(state).toEqual({
      operation: testCase.operation,
      successKey: expect.any(String),
    });
    expect(mocks.revalidateLedgerMutation).toHaveBeenCalledWith([
      `/ledgers/${ledgerId}/settings`,
      "/settings/data/import",
    ]);
  });

  it("解析失败时返回安全文案与 errorKey，不调用 Service", async () => {
    const state = await testCase.action({}, form({ ledgerId: "bad" }));

    expect(state).toEqual({
      error: getLedgerPlaceholderMemberErrorMessage("ledger_not_found"),
      errorKey: expect.any(String),
      operation: testCase.operation,
    });
    expect(testCase.service).not.toHaveBeenCalled();
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("Service 抛出 AppError 时透传安全文案", async () => {
    const message = getLedgerPlaceholderMemberErrorMessage(
      "placeholder_name_conflict",
    )!;
    testCase.service.mockRejectedValueOnce(
      new ConflictError("placeholder_name_conflict", message),
    );

    const state = await testCase.action({}, form(testCase.values));

    expect(state).toEqual({
      error: message,
      errorKey: expect.any(String),
      operation: testCase.operation,
    });
    expect(mocks.revalidateLedgerMutation).not.toHaveBeenCalled();
  });

  it("未知异常返回兜底文案，不泄露原始 message", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    testCase.service.mockRejectedValueOnce(new Error("raw db failure"));

    const state = await testCase.action({}, form(testCase.values));

    expect(state.error).toBe(
      getLedgerPlaceholderMemberErrorMessage(
        `placeholder_${testCase.operation}_failed`,
      ),
    );
    expect(state.error).not.toContain("raw");
    consoleError.mockRestore();
  });
});

it("删除被账户引用的占位时提示先更换持有人", async () => {
  const message = getLedgerPlaceholderMemberErrorMessage("placeholder_in_use")!;
  mocks.delete.mockRejectedValueOnce(
    new ConflictError("placeholder_in_use", message),
  );

  const state = await deleteLedgerPlaceholderMember(
    {},
    form({ ledgerId, placeholderId }),
  );

  expect(state.error).toContain("持有人改为其他人或无持有人");
});
