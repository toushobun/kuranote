import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserThemeProvider } from "theme/UserThemeProvider";
import {
  emptyLedgerDeletionImpact,
  ledgerDeletionFixture,
} from "test/ledgerDeletion";
import type { ActionState } from "types/actions";
import { LedgerDeletion } from "./LedgerDeletion";
import type { DeleteLedgerAction } from "./useLedgerDeletion";

function setup(
  action: DeleteLedgerAction = vi.fn(async () => ({})),
  impact = ledgerDeletionFixture.impact,
  isCurrent = true,
) {
  render(
    <UserThemeProvider>
      <LedgerDeletion
        {...ledgerDeletionFixture}
        ledger={{ ...ledgerDeletionFixture.ledger, isCurrent }}
        impact={impact}
        action={action}
      />
    </UserThemeProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "删除" }));
  return action;
}
async function secondStep(name?: string) {
  fireEvent.click(await screen.findByRole("button", { name: "继续删除" }));
  const input = await screen.findByRole("textbox", { name: "账本名" });
  if (name !== undefined) fireEvent.change(input, { target: { value: name } });
  return screen.getByRole("dialog", { name: "请输入账本名确认删除" });
}
describe("LedgerDeletion", () => {
  it("展示数量与占位成员并支持取消", async () => {
    const action = setup();
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("将永久删除 1,284 条明细、6 个账户、32 个商家"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/妈妈、宝宝/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "取消" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(action).not.toHaveBeenCalled();
  });
  it("零数量和无其他成员时隐藏对应条目", async () => {
    setup(undefined, emptyLedgerDeletionImpact);
    const dialog = within(await screen.findByRole("dialog"));
    expect(
      dialog.queryByText(/条明细|个账户|个商家|位成员/),
    ).not.toBeInTheDocument();
    expect(dialog.getByText("未接受的邀请链接将失效")).toBeInTheDocument();
  });
  it("非当前账本明确引导先切换再导出", async () => {
    setup(undefined, undefined, false);
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText(/请先切换到此账本/)).toBeInTheDocument();
    expect(dialog.getByRole("link", { name: "去导出" })).toHaveAttribute(
      "href",
      "/ledgers",
    );
  });
  it.each(["", "我们家 ", " 我们家", "我们"])(
    "名称不完全一致时禁用删除：%s",
    async (name) => {
      setup();
      await secondStep(name);
      expect(screen.getByRole("button", { name: "永久删除" })).toBeDisabled();
      expect(screen.queryByTitle("账本名已匹配")).not.toBeInTheDocument();
    },
  );
  it("完全匹配后显示对勾并允许返回", async () => {
    setup();
    await secondStep("我们家");
    expect(screen.getByRole("button", { name: "永久删除" })).toBeEnabled();
    expect(screen.getByTitle("账本名已匹配")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "返回" }));
    expect(
      await screen.findByRole("button", { name: "继续删除" }),
    ).toBeInTheDocument();
  });
  it("提交中不可通过返回、Escape 或遮罩关闭，失败后显示反馈", async () => {
    let resolve!: (state: ActionState) => void;
    const action = vi.fn(
      () =>
        new Promise<ActionState>((done) => {
          resolve = done;
        }),
    );
    setup(action);
    const dialog = await secondStep("我们家");
    fireEvent.click(screen.getByRole("button", { name: "永久删除" }));
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "正在删除…" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("正在删除账本");
    expect(
      screen.queryByRole("button", { name: "返回" }),
    ).not.toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    const backdrop = document.querySelector(".MuiBackdrop-root");
    if (backdrop) fireEvent.click(backdrop);
    expect(dialog).toBeInTheDocument();
    await act(async () =>
      resolve({ error: "删除失败测试", errorKey: "error-1" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("删除失败测试");
    expect(screen.getByRole("button", { name: "永久删除" })).toBeEnabled();
  });
});
