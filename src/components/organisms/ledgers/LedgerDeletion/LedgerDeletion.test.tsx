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
  loadLedgerDeletionImpactWith,
} from "test/ledgerDeletion";
import type { ActionState } from "types/actions";
import type { LoadLedgerDeletionImpactAction } from "types/ledgers";
import { LedgerDeletion } from "./LedgerDeletion";
import type { DeleteLedgerAction } from "./useLedgerDeletion";

function setup(
  action: DeleteLedgerAction = vi.fn(async () => ({})),
  loadImpact: LoadLedgerDeletionImpactAction = loadLedgerDeletionImpactWith(),
  isCurrent = true,
) {
  render(
    <UserThemeProvider>
      <LedgerDeletion
        ledger={{ ...ledgerDeletionFixture.ledger, isCurrent }}
        action={action}
        loadImpact={loadImpact}
      />
    </UserThemeProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "删除" }));
  return action;
}
async function secondStep(name?: string) {
  const next = await screen.findByRole("button", { name: "继续删除" });
  await waitFor(() => expect(next).toBeEnabled());
  fireEvent.click(next);
  const input = await screen.findByRole("textbox", { name: "账本名" });
  if (name !== undefined) fireEvent.change(input, { target: { value: name } });
  return screen.getByRole("dialog", { name: "请输入账本名确认删除" });
}
describe("LedgerDeletion", () => {
  it("展示数量与占位成员并支持取消", async () => {
    const action = setup();
    const dialog = await screen.findByRole("dialog");
    expect(
      await within(dialog).findByText(
        "将永久删除 1,284 条明细、6 个账户、32 个商家",
      ),
    ).toBeInTheDocument();
    expect(await within(dialog).findByText(/妈妈、宝宝/)).toBeInTheDocument();
    expect(
      within(dialog).getByText("未接受的邀请链接将失效"),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "取消" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(action).not.toHaveBeenCalled();
  });
  it("零数量和无其他成员时隐藏对应条目", async () => {
    setup(undefined, loadLedgerDeletionImpactWith(emptyLedgerDeletionImpact));
    const dialog = within(await screen.findByRole("dialog"));
    expect(await dialog.findByText("此操作无法撤销")).toBeInTheDocument();
    expect(
      dialog.queryByText(/条明细|个账户|个商家|位成员|位待邀请成员|邀请链接/),
    ).not.toBeInTheDocument();
  });
  it("没有显示名的成员使用界面回退名", async () => {
    setup(
      undefined,
      loadLedgerDeletionImpactWith({
        ...emptyLedgerDeletionImpact,
        memberNames: [null, "宝宝"],
      }),
    );
    expect(
      await screen.findByText(/2 位成员（未命名用户、宝宝）/),
    ).toBeInTheDocument();
  });
  it("待邀请成员单独显示且不计入成员数", async () => {
    setup(
      undefined,
      loadLedgerDeletionImpactWith({
        ...emptyLedgerDeletionImpact,
        memberNames: ["妈妈"],
        placeholderNames: ["宝宝", "爷爷"],
      }),
    );
    const dialog = within(await screen.findByRole("dialog"));
    expect(
      await dialog.findByText(/^1 位成员（妈妈）将被移出/),
    ).toBeInTheDocument();
    expect(
      dialog.getByText("2 位待邀请成员（宝宝、爷爷）将一并删除"),
    ).toBeInTheDocument();
  });
  it("打开弹层时才按账本读取影响，读取中显示加载且不可继续", async () => {
    let resolve!: () => void;
    const loadImpact = vi.fn<LoadLedgerDeletionImpactAction>(
      () =>
        new Promise((done) => {
          resolve = () => done({ impact: ledgerDeletionFixture.impact });
        }),
    );
    setup(undefined, loadImpact);
    expect(loadImpact).toHaveBeenCalledWith(ledgerDeletionFixture.ledger.id);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "正在读取删除影响",
    );
    expect(screen.getByRole("button", { name: "继续删除" })).toBeDisabled();
    await act(async () => resolve());
    expect(screen.getByRole("button", { name: "继续删除" })).toBeEnabled();
  });
  it("读取失败时在弹层内提示且不可继续", async () => {
    setup(undefined, async () => ({ error: "删除影响读取失败测试" }));
    const dialog = within(await screen.findByRole("dialog"));
    expect(await dialog.findByText("删除影响读取失败测试")).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "继续删除" })).toBeDisabled();
  });
  it("请求被拒绝时显示界面兜底文案", async () => {
    setup(undefined, () => Promise.reject(new Error("network")));
    expect(
      await screen.findByText("删除影响读取失败，请稍后重试。"),
    ).toBeInTheDocument();
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
