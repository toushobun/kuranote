import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { TransactionEntryMethodSwitch } from "./TransactionEntryMethodSwitch";

describe("TransactionEntryMethodSwitch", () => {
  beforeEach(() => router.replace.mockClear());

  it.each([
    ["从商家记账", "/transactions/new"],
    ["标准记账 过渡", "/transactions/new?method=standard"],
  ])("选择%s时替换为对应方式的地址", (name, href) => {
    render(<TransactionEntryMethodSwitch currentMethod="transfer" />);
    fireEvent.click(screen.getByRole("button", { name: "切换方式" }));
    fireEvent.click(screen.getByRole("button", { name }));
    expect(router.replace).toHaveBeenCalledWith(href);
  });

  it("再选当前方式时不跳转", () => {
    render(<TransactionEntryMethodSwitch currentMethod="transfer" />);
    fireEvent.click(screen.getByRole("button", { name: "切换方式" }));
    fireEvent.click(screen.getByRole("button", { name: "账户周转" }));
    expect(router.replace).not.toHaveBeenCalled();
  });
});
