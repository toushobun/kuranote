import { routerMock } from "test/mocks/navigation";
import { describeUnsavedFormPage } from "test/unsavedFormPage";
import { backFromGuard, setupGuardHistoryMock } from "test/mockGuardHistory";
import { ConfirmDialogTestProviders } from "test/ConfirmDialogTestProviders";
setupGuardHistoryMock();
vi.mock("next/navigation", () => import("test/mocks/navigation"));
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import type { MerchantStateAction } from "types/merchants";

import { MerchantEditTemplate } from "./MerchantEdit";

const action = vi.fn(async () => ({}));

type RenderTemplateActions = {
  updateMerchantAction?: MerchantStateAction;
  archiveMerchantAliasAction?: MerchantStateAction;
  createMerchantAliasAction?: MerchantStateAction;
  setPreferredMerchantAliasAction?: MerchantStateAction;
};

function renderTemplate({
  updateMerchantAction = action,
  archiveMerchantAliasAction = action,
  createMerchantAliasAction = action,
  setPreferredMerchantAliasAction = action,
}: RenderTemplateActions = {}) {
  const merchant = createMerchantRow({
    aliases: [createMerchantAliasRow({ is_preferred: true })],
  });

  render(
    <ConfirmDialogTestProviders>
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
        updateMerchantAction={updateMerchantAction}
      />
    </ConfirmDialogTestProviders>,
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

describe("MerchantEdit 多表单守卫", () => {
  function changeDetails() {
    fireEvent.change(screen.getByLabelText(/商家名称/), {
      target: { value: "修改后的商家" },
    });
  }
  function changeAlias() {
    fireEvent.change(screen.getByRole("textbox", { name: "别名" }), {
      target: { value: "新别名" },
    });
  }
  it("基本资料与别名都修改时不显示保存，只允许继续或放弃", async () => {
    renderTemplate();
    changeDetails();
    changeAlias();
    await backFromGuard();
    const dialog = screen.getByRole("dialog", { name: "尚未保存" });
    expect(within(dialog).queryByRole("button", { name: "保存" })).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "继续编辑" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "尚未保存" })).toBeNull(),
    );
    expect(screen.getByRole("textbox", { name: "别名" })).toHaveValue("新别名");
  });
  it.each(["基本资料", "别名"])(
    "只有%s修改时保存提交对应表单，失败继续保护",
    async (kind) => {
      const update = vi.fn<MerchantStateAction>(async () => ({
        error: "保存失败",
        errorKey: "update-failure",
      }));
      const alias = vi.fn<MerchantStateAction>(async () => ({
        error: "别名失败",
        errorKey: "alias-failure",
      }));
      renderTemplate({
        updateMerchantAction: update,
        createMerchantAliasAction: alias,
      });
      if (kind === "基本资料") changeDetails();
      else changeAlias();
      await backFromGuard();
      fireEvent.click(
        within(screen.getByRole("dialog", { name: "尚未保存" })).getByRole(
          "button",
          { name: "保存" },
        ),
      );
      await waitFor(() =>
        expect(kind === "基本资料" ? update : alias).toHaveBeenCalledOnce(),
      );
      expect(kind === "基本资料" ? alias : update).not.toHaveBeenCalled();
      await backFromGuard();
      expect(screen.getByRole("dialog", { name: "尚未保存" })).toBeVisible();
    },
  );
  it("确认保存基本资料失败后再新增别名成功，不会离开或丢失基本资料草稿", async () => {
    routerMock.push.mockClear();
    const update = vi.fn<MerchantStateAction>(async () => ({
      error: "基本资料保存失败",
      errorKey: "details-failed",
    }));
    const alias = vi.fn<MerchantStateAction>(async () => ({
      success: "别名添加成功",
      successKey: "alias-saved",
    }));
    renderTemplate({
      updateMerchantAction: update,
      createMerchantAliasAction: alias,
    });
    changeDetails();
    await backFromGuard();
    const backCalls = vi.mocked(window.history.back).mock.calls.length;
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "尚未保存" })).getByRole(
        "button",
        { name: "保存" },
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("基本资料保存失败"),
    );
    changeAlias();
    fireEvent.click(screen.getByRole("button", { name: "添加别名" }));
    await waitFor(() => expect(alias).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "别名" })).toHaveValue(""),
    );
    expect(window.history.back).toHaveBeenCalledTimes(backCalls);
    expect(routerMock.push).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/商家名称/)).toHaveValue("修改后的商家");
    await backFromGuard();
    expect(screen.getByRole("dialog", { name: "尚未保存" })).toBeVisible();
  });
  it("保存基本资料成功后只更新该表单基线，别名草稿继续受到保护", async () => {
    const update = vi.fn<MerchantStateAction>(async () => ({
      success: "保存成功",
      successKey: "saved-details",
    }));
    renderTemplate({ updateMerchantAction: update });
    changeDetails();
    changeAlias();
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));
    await waitFor(() => expect(update).toHaveBeenCalledOnce());
    expect(update.mock.calls[0][1].get("presentation")).toBe("dialog");
    await backFromGuard();
    const submit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => {});
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "尚未保存" })).getByRole(
        "button",
        { name: "保存" },
      ),
    );
    expect(submit.mock.instances[0]).toHaveAttribute(
      "id",
      "merchant-alias-form",
    );
    submit.mockRestore();
  });
  it("保存别名成功只清空别名，基本资料修改继续受到保护", async () => {
    const alias = vi.fn<MerchantStateAction>(async () => ({
      success: "添加成功",
      successKey: "saved-alias",
    }));
    renderTemplate({ createMerchantAliasAction: alias });
    changeDetails();
    changeAlias();
    fireEvent.click(screen.getByRole("button", { name: "添加别名" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "别名" })).toHaveValue(""),
    );
    expect(screen.getByLabelText(/商家名称/)).toHaveValue("修改后的商家");
    await backFromGuard();
    const submit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => {});
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "尚未保存" })).getByRole(
        "button",
        { name: "保存" },
      ),
    );
    expect(submit.mock.instances[0]).toHaveAttribute(
      "id",
      "merchant-edit-form",
    );
    submit.mockRestore();
  });
});

describe("MerchantEdit 别名保存后继续离开", () => {
  it.each(["后退", "链接"])(
    "从%s确认保存别名成功后只继续一次原离开意图",
    async (kind) => {
      routerMock.push.mockClear();
      const alias = vi.fn<MerchantStateAction>(async () => ({
        success: "添加成功",
        successKey: "alias-saved",
      }));
      renderTemplate({ createMerchantAliasAction: alias });
      fireEvent.change(screen.getByRole("textbox", { name: "别名" }), {
        target: { value: "别名草稿" },
      });
      if (kind === "后退") await backFromGuard();
      else fireEvent.click(screen.getByRole("link", { name: "返回商家管理" }));
      fireEvent.click(
        within(screen.getByRole("dialog", { name: "尚未保存" })).getByRole(
          "button",
          { name: "保存" },
        ),
      );
      await waitFor(() => expect(alias).toHaveBeenCalledOnce());
      if (kind === "后退") {
        await waitFor(() =>
          expect(window.history.back).toHaveBeenCalledTimes(2),
        );
        expect(routerMock.push).not.toHaveBeenCalled();
      } else {
        await waitFor(() =>
          expect(routerMock.push).toHaveBeenCalledExactlyOnceWith("/merchants"),
        );
        expect(window.history.back).not.toHaveBeenCalled();
      }
    },
  );
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
