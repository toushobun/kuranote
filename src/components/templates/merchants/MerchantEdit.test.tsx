import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";
import type { MerchantStateAction } from "types/merchants";

import { MerchantEditTemplate } from "./MerchantEdit";

const action = vi.fn(async () => ({}));

type RenderTemplateActions = {
  archiveMerchantAliasAction?: MerchantStateAction;
  createMerchantAliasAction?: MerchantStateAction;
  setPreferredMerchantAliasAction?: MerchantStateAction;
};

function renderTemplate({
  archiveMerchantAliasAction = action,
  createMerchantAliasAction = action,
  setPreferredMerchantAliasAction = action,
}: RenderTemplateActions = {}) {
  const merchant = createMerchantRow({
    aliases: [createMerchantAliasRow({ is_preferred: true })],
  });

  render(
    <UserThemeProvider storageScope="merchant-edit-test">
      <ConfirmDialogProvider>
        <MerchantEditTemplate
          archiveMerchantAction={action}
          archiveMerchantAliasAction={archiveMerchantAliasAction}
          createMerchantAliasAction={createMerchantAliasAction}
          fetchIconAction={action}
          ledgerId="ledger-1"
          ledgerName="家庭账本"
          merchant={merchant}
          setPreferredMerchantAliasAction={setPreferredMerchantAliasAction}
          tags={[]}
          updateMerchantAction={action}
        />
      </ConfirmDialogProvider>
    </UserThemeProvider>,
  );
}

describe("MerchantEditTemplate", () => {
  it("只显示一套可编辑的商家基础信息", () => {
    renderTemplate();

    expect(screen.getAllByLabelText(/商家名称/)).toHaveLength(1);
    expect(screen.queryByText(/商家名称　/)).not.toBeInTheDocument();
  });

  it("未保存的名称不会提前成为正式名候选", () => {
    renderTemplate();

    fireEvent.change(screen.getByLabelText(/商家名称/), {
      target: { value: "尚未保存的新名称" },
    });

    expect(
      screen.getByRole("button", { name: "将LIFE超市设为展示名" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "将尚未保存的新名称设为展示名" }),
    ).not.toBeInTheDocument();
  });

  it("归档商家前要求二次确认", () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => {});
    renderTemplate();

    fireEvent.click(screen.getByRole("button", { name: "归档商家" }));

    expect(
      screen.getByRole("heading", { name: "归档商家？" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/既有记录仍会保留/)).toBeInTheDocument();
    expect(requestSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "归档商家" }));

    expect(requestSubmit).toHaveBeenCalledOnce();
    requestSubmit.mockRestore();
  });

  it("点击整行切换后显示成功提示", async () => {
    const select = vi.fn<MerchantStateAction>(async () => ({
      success: "显示名切换成功",
    }));
    renderTemplate({ setPreferredMerchantAliasAction: select });

    fireEvent.click(
      screen.getByRole("button", { name: "将LIFE超市设为展示名" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("显示名切换成功"),
    );
    expect(select).toHaveBeenCalledOnce();
  });

  it("新增别名成功后显示添加成功", async () => {
    const createAlias = vi.fn<MerchantStateAction>(async () => ({
      success: "添加成功",
    }));
    renderTemplate({ createMerchantAliasAction: createAlias });

    fireEvent.change(screen.getByRole("textbox", { name: "别名" }), {
      target: { value: "LIFE" },
    });
    fireEvent.click(screen.getByRole("button", { name: "添加别名" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("添加成功"),
    );
    expect(createAlias).toHaveBeenCalledOnce();
    const formData = createAlias.mock.calls[0][1] as FormData;
    expect(formData.get("merchantId")).toBe(
      "00000000-0000-4000-8000-000000001001",
    );
    expect(formData.get("alias")).toBe("LIFE");
  });

  it("确认删除别名后提交并显示删除成功", async () => {
    const archiveAlias = vi.fn<MerchantStateAction>(async () => ({
      success: "删除成功",
    }));
    renderTemplate({ archiveMerchantAliasAction: archiveAlias });

    fireEvent.click(screen.getByRole("button", { name: "移除别名来福" }));

    expect(
      screen.getByRole("heading", { name: "删除别名？" }),
    ).toBeInTheDocument();
    expect(archiveAlias).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("删除成功"),
    );
    expect(archiveAlias).toHaveBeenCalledOnce();
    const formData = archiveAlias.mock.calls[0][1] as FormData;
    expect(formData.get("aliasId")).toBe("alias-1");
  });

  it("连续别名操作时只显示最后一次成功提示", async () => {
    const archiveAlias = vi.fn<MerchantStateAction>(async () => ({
      success: "删除成功",
    }));
    const select = vi.fn<MerchantStateAction>(async () => ({
      success: "显示名切换成功",
    }));
    renderTemplate({
      archiveMerchantAliasAction: archiveAlias,
      setPreferredMerchantAliasAction: select,
    });

    fireEvent.click(screen.getByRole("button", { name: "移除别名来福" }));
    fireEvent.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("删除成功"),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "将LIFE超市设为展示名" }),
    );

    await waitFor(() => {
      const statuses = screen.getAllByRole("status");
      expect(statuses).toHaveLength(1);
      expect(statuses[0]).toHaveTextContent("显示名切换成功");
      expect(screen.queryByText("删除成功")).not.toBeInTheDocument();
    });
  });

  it("新增别名失败时继续显示 inline error", async () => {
    const createAlias = vi.fn<MerchantStateAction>(async () => ({
      error: "别名已存在",
      errorKey: "create-alias-failure",
    }));
    renderTemplate({ createMerchantAliasAction: createAlias });

    fireEvent.change(screen.getByRole("textbox", { name: "别名" }), {
      target: { value: "来福" },
    });
    fireEvent.click(screen.getByRole("button", { name: "添加别名" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("商家别名新增失败");
      expect(screen.getByRole("alert")).toHaveTextContent("别名已存在");
    });
    expect(screen.queryByRole("status")).toBeNull();
  });
});
