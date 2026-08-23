import { vi } from "vitest";

const transactionActionModuleMocks = vi.hoisted(() => ({
  createRequestContainer: vi.fn(),
  createServerRequestDependencies: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  requireCurrentUserAndLedger: vi.fn(),
  revalidateTransactionMutation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: transactionActionModuleMocks.redirect,
}));
vi.mock("internal/container", () => ({
  createRequestContainer: transactionActionModuleMocks.createRequestContainer,
}));
vi.mock("internal/ledger/adapter/next/currentLedger", () => ({
  requireCurrentUserAndLedger:
    transactionActionModuleMocks.requireCurrentUserAndLedger,
}));
vi.mock("internal/shared/context/createServerRequestDependencies", () => ({
  createServerRequestDependencies:
    transactionActionModuleMocks.createServerRequestDependencies,
}));
vi.mock("internal/transaction/adapter/next/revalidate", () => ({
  revalidateTransactionMutation:
    transactionActionModuleMocks.revalidateTransactionMutation,
}));

// Vitest 不允许直接导出 vi.hoisted() 变量，通过 getter 保留同一份模块 mock。
export function getTransactionActionModuleMocks() {
  return transactionActionModuleMocks;
}
