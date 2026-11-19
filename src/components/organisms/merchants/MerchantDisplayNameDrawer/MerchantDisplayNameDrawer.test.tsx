import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import { MerchantDisplayNameDrawer } from "./MerchantDisplayNameDrawer";

afterEach(cleanup);

function renderDrawer(aliases = [{ id: "alias-1", alias: "来福" }]) {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(
    <ConfirmDialogTestProviders>
      <MerchantDisplayNameDrawer
        aliases={aliases}
        merchantName="LIFE超市"
        open
        sessionId={0}
        onClose={onClose}
        onConfirm={onConfirm}
        preferredAliasId={null}
      />
    </ConfirmDialogTestProviders>,
  );
  return { onConfirm, onClose };
}

describe("MerchantDisplayNameDrawer", () => {
  it("正式名与别名单选，无别名时提示空状态", () => {
    renderDrawer([]);
    expect(
      screen.getByRole("button", { name: "LIFE超市是当前展示名" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("还没有别名。")).toBeInTheDocument();
  });

  it("新增别名只改变草稿，回车也能添加", () => {
    const { onConfirm } = renderDrawer();
    const input = screen.getByRole("textbox", { name: "输入新的别名" });
    const add = screen.getByRole("button", { name: "添加" });
    expect(add).toBeDisabled();
    fireEvent.change(input, { target: { value: "  ライフ  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(
      screen.getByRole("button", { name: "将ライフ设为展示名" }),
    ).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "将ライフ设为展示名" }));
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    expect(onConfirm).toHaveBeenCalledWith(
      [
        { id: "alias-1", alias: "来福" },
        { id: expect.stringMatching(/^new:/), alias: "ライフ" },
      ],
      expect.stringMatching(/^new:/),
    );
  });

  it("输入空白、与正式名及已有别名不区分大小写重复时显示红字", () => {
    renderDrawer([{ id: "alias-1", alias: "LIFE" }]);
    const input = screen.getByRole("textbox", { name: "输入新的别名" });
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("alert")).toHaveTextContent("请输入非空的别名");
    fireEvent.change(input, { target: { value: "life" } });
    fireEvent.click(screen.getByRole("button", { name: "添加" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "别名与正式名或已有别名重复",
    );
    fireEvent.change(input, { target: { value: "life超市" } });
    fireEvent.click(screen.getByRole("button", { name: "添加" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "别名与正式名或已有别名重复",
    );
  });

  it("抽屉用 open 控制退出，重新打开时草稿从页面值重新初始化", async () => {
    const alias = [{ id: "alias-1", alias: "来福" }];
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const view = (open: boolean, sessionId: number) => (
      <ConfirmDialogTestProviders>
        <MerchantDisplayNameDrawer
          aliases={alias}
          merchantName="LIFE超市"
          onClose={onClose}
          onConfirm={onConfirm}
          open={open}
          sessionId={sessionId}
          preferredAliasId={null}
        />
      </ConfirmDialogTestProviders>
    );
    const { rerender } = render(view(true, 1));
    fireEvent.change(screen.getByRole("textbox", { name: "输入新的别名" }), {
      target: { value: "这次不保存" },
    });
    fireEvent.click(screen.getByRole("button", { name: "添加" }));
    rerender(view(false, 1));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "关闭显示名抽屉" }),
      ).toBeNull(),
    );
    rerender(view(true, 2));
    expect(
      screen.queryByRole("button", { name: "将这次不保存设为展示名" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "将来福设为展示名" }),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("关闭只触发关闭事件，不调用确认保存", () => {
    const { onClose, onConfirm } = renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: "关闭显示名抽屉" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
