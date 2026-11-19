import { describeUnsavedFormPage } from "test/unsavedFormPage";
import { backFromGuard, setupGuardHistoryMock } from "test/mockGuardHistory";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

setupGuardHistoryMock();
vi.mock("next/navigation", () => import("test/mocks/navigation"));

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import type { MerchantStateAction } from "types/merchants";

import { MerchantEditTemplate } from "./MerchantEdit";

const action = vi.fn<MerchantStateAction>(async () => ({}));
afterEach(cleanup);

function renderTemplate(updateMerchantAction: MerchantStateAction = action) {
  const merchant = createMerchantRow({
    aliases: [createMerchantAliasRow({ is_preferred: true })],
    display_name: "来福",
    note: "常去的超市",
  });
  render(
    <ConfirmDialogTestProviders>
      <MerchantEditTemplate
        archiveMerchantAction={action}
        fetchIconAction={async () => ({})}
        ledgerId="ledger-1"
        ledgerName="家庭账本"
        merchant={merchant}
        tags={[]}
        updateMerchantAction={updateMerchantAction}
      />
    </ConfirmDialogTestProviders>,
  );
}

function openDrawer() {
  fireEvent.click(screen.getByRole("button", { name: "管理显示名与别名" }));
}

function addAlias(alias: string) {
  const input = screen.getByRole("textbox", { name: "输入新的别名" });
  fireEvent.change(input, { target: { value: alias } });
  fireEvent.click(screen.getByRole("button", { name: "添加" }));
}

function editFormData() {
  return new FormData(
    document.getElementById("merchant-edit-form") as HTMLFormElement,
  );
}

describe("MerchantEditTemplate #1125", () => {
  it("页面只显示一行显示名与一个保存按钮", () => {
    renderTemplate();
    expect(screen.getAllByLabelText(/商家名称/)).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "管理显示名与别名" }),
    ).toHaveTextContent("来福");
    expect(
      screen.getByRole("button", { name: "管理显示名与别名" }),
    ).toHaveTextContent("别名 1 个");
    expect(screen.getAllByRole("button", { name: "保存修改" })).toHaveLength(1);
    expect(screen.getByLabelText("显示名")).toHaveValue("来福");
    expect(screen.queryByRole("textbox", { name: "别名" })).toBeNull();
  });

  it("抽屉的正式名使用当前输入内容，关闭时丢弃别名草稿", () => {
    renderTemplate();
    fireEvent.change(screen.getByLabelText(/商家名称/), {
      target: { value: "新正式名" },
    });
    openDrawer();
    expect(
      screen.getByRole("button", { name: "将新正式名设为展示名" }),
    ).toBeInTheDocument();
    addAlias("ライフ");
    expect(
      screen.getByRole("button", { name: "将ライフ设为展示名" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭显示名抽屉" }));
    expect(
      screen.getByRole("button", { name: "管理显示名与别名" }),
    ).toHaveTextContent("别名 1 个");
    expect(JSON.parse(String(editFormData().get("addedAliases")))).toEqual([]);
  });

  it("抽屉草稿在返回键关闭时丢弃且不触发页面离开", async () => {
    renderTemplate();
    openDrawer();
    addAlias("返回时丢弃");
    await backFromGuard();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "关闭显示名抽屉" }),
      ).toBeNull(),
    );
    expect(
      screen.getByRole("button", { name: "管理显示名与别名" }),
    ).toHaveTextContent("别名 1 个");
    expect(JSON.parse(String(editFormData().get("addedAliases")))).toEqual([]);
    expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull();
  });

  it("确认抽屉结果暂存且一次提交新增、删除与显示名", async () => {
    const save = vi.fn<MerchantStateAction>(async () => ({
      error: "数据库保存失败",
      errorKey: "failed",
    }));
    renderTemplate(save);
    openDrawer();
    fireEvent.click(screen.getByRole("button", { name: "移除别名来福" }));
    expect(
      screen.getByRole("heading", { name: "删除别名「来福」？" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "移除别名来福" })).toBeNull(),
    );
    addAlias("ライフ");
    fireEvent.click(screen.getByRole("button", { name: "将ライフ设为展示名" }));
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    const pendingData = editFormData();
    expect(JSON.parse(String(pendingData.get("addedAliases")))).toEqual([
      "ライフ",
    ]);
    expect(JSON.parse(String(pendingData.get("archivedAliasIds")))).toEqual([
      "alias-1",
    ]);
    expect(pendingData.get("preferredAlias")).toBe("ライフ");
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    const submitted = save.mock.calls[0][1] as FormData;
    expect(JSON.parse(String(submitted.get("addedAliases")))).toEqual([
      "ライフ",
    ]);
    expect(JSON.parse(String(submitted.get("archivedAliasIds")))).toEqual([
      "alias-1",
    ]);
    expect(submitted.get("preferredAlias")).toBe("ライフ");
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("数据库保存失败"),
    );
    expect(
      screen.getByRole("button", { name: "管理显示名与别名" }),
    ).toHaveTextContent("ライフ");
    expect(JSON.parse(String(editFormData().get("addedAliases")))).toEqual([
      "ライフ",
    ]);
  });

  it("取消删除不会移除别名，删除选中别名后回到正式名", async () => {
    renderTemplate();
    openDrawer();
    fireEvent.click(screen.getByRole("button", { name: "移除别名来福" }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(
      screen.getByRole("button", { name: "移除别名来福" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "移除别名来福" }));
    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "LIFE超市是当前展示名" }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    expect(editFormData().get("preferredAlias")).toBe("");
    expect(
      screen.getByRole("button", { name: "管理显示名与别名" }),
    ).toHaveTextContent("LIFE超市");
  });

  it("抽屉确定后离开时仍走统一表单的未保存守卫", async () => {
    renderTemplate();
    openDrawer();
    addAlias("新别名");
    fireEvent.click(screen.getByRole("button", { name: "确定" }));
    await backFromGuard();
    const dialog = screen.getByRole("dialog", { name: "尚未保存" });
    expect(
      within(dialog).getByRole("button", { name: "保存并退出" }),
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "继续编辑" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull(),
    );
    expect(
      screen.getByRole("button", { name: "管理显示名与别名" }),
    ).toHaveTextContent("别名 2 个");
  });

  it("商家归档继续要求二次确认", () => {
    const submit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => {});
    renderTemplate();
    fireEvent.click(screen.getByRole("button", { name: "归档商家" }));
    expect(
      screen.getByRole("heading", { name: "归档商家？" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "归档商家" }));
    expect(submit).toHaveBeenCalledOnce();
    submit.mockRestore();
  });
});

describeUnsavedFormPage({
  render: () => renderTemplate(),
  change: () =>
    fireEvent.change(screen.getByLabelText(/商家名称/), {
      target: { value: "守卫测试" },
    }),
  restore: () =>
    fireEvent.change(screen.getByLabelText(/商家名称/), {
      target: { value: createMerchantRow().name },
    }),
});
