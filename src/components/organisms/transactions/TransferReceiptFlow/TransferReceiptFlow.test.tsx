import { setupGuardHistoryMock } from "test/mockGuardHistory";
setupGuardHistoryMock();
vi.mock("next/navigation", () => import("test/mocks/navigation"));
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { flowFixture } from "test/mocks/transactionStepFlow";
import { ReceiptCreationTestProviders } from "test/receiptCreation";

import { TransferReceiptFlow } from "./TransferReceiptFlow";

function setup() {
  const props = {
    accounts: flowFixture.accounts,
    action: vi.fn(async () => ({})),
    onClose: vi.fn(),
    onMethodChange: vi.fn(),
  };
  render(<TransferReceiptFlow {...props} />, {
    wrapper: ReceiptCreationTestProviders,
  });
  return props;
}

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}

async function chooseSourceAccount() {
  click(/^更换转出账户：/);
  fireEvent.click(screen.getByRole("radio", { name: "现金 JPY" }));
  await screen.findByRole("button", { name: "更换转出账户：现金" });
}

describe("TransferReceiptFlow", () => {
  it("与从商家记账同一外框：标题、关闭与切换方式", () => {
    setup();
    expect(screen.getByRole("heading", { name: "账户周转" })).toBeVisible();
    expect(screen.getByRole("button", { name: "关闭记账" })).toBeVisible();
    expect(screen.getByRole("button", { name: "切换方式" })).toBeVisible();
  });

  it("没动过时切换方式不确认", async () => {
    const props = setup();
    click("切换方式");
    click("从商家记账");
    await waitFor(() =>
      expect(props.onMethodChange).toHaveBeenCalledWith("merchant"),
    );
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
  });

  it("没动过时关闭不确认", async () => {
    const props = setup();
    click("关闭记账");
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
  });

  it("动过小票后切换方式要确认，放弃后才切换", async () => {
    const props = setup();
    await chooseSourceAccount();
    click("切换方式");
    click("从商家记账");
    await screen.findByRole("dialog", { name: "尚未保存" });
    expect(props.onMethodChange).not.toHaveBeenCalled();
    click("放弃修改");
    await waitFor(() =>
      expect(props.onMethodChange).toHaveBeenCalledWith("merchant"),
    );
  });

  it("动过小票后关闭要确认", async () => {
    const props = setup();
    await chooseSourceAccount();
    click("关闭记账");
    expect(
      await screen.findByRole("dialog", { name: "尚未保存" }),
    ).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
