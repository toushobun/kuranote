import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import type { MerchantActionState, MerchantStateAction } from "types/merchants";

import { MerchantsActionStateTemplate } from "./MerchantsActionState";

const merchant = createMerchantRow({
  aliases: [createMerchantAliasRow()],
});
const secondMerchant = createMerchantRow({
  aliases: [],
  id: "00000000-0000-4000-8000-000000001101",
  name: "Amazon",
});
const successAction: MerchantStateAction = async () => ({});

function errorAction(error: string, errorKey: string): MerchantStateAction {
  return vi.fn(
    async (
      _previousState: MerchantActionState,
      _formData: FormData,
    ): Promise<MerchantActionState> => {
      void _previousState;
      void _formData;
      return { error, errorKey };
    },
  );
}

type RenderTemplateOptions = {
  archiveMerchantAction?: MerchantStateAction;
  archiveMerchantAliasAction?: MerchantStateAction;
  createMerchantAction?: MerchantStateAction;
  createMerchantAliasAction?: MerchantStateAction;
  merchants?: (typeof merchant)[];
  renderKey?: string;
  updateMerchantAction?: MerchantStateAction;
};

function templateElement({
  archiveMerchantAction = successAction,
  archiveMerchantAliasAction = successAction,
  createMerchantAction = successAction,
  createMerchantAliasAction = successAction,
  merchants = [merchant],
  renderKey = "render-1",
  updateMerchantAction = successAction,
}: RenderTemplateOptions = {}) {
  return (
    <MerchantsActionStateTemplate
      archiveMerchantAction={archiveMerchantAction}
      archiveMerchantAliasAction={archiveMerchantAliasAction}
      canManageMerchants
      createMerchantAction={createMerchantAction}
      createMerchantAliasAction={createMerchantAliasAction}
      keyword=""
      ledgerName="家庭账本"
      merchants={merchants}
      renderKey={renderKey}
      updateMerchantAction={updateMerchantAction}
    />
  );
}

function renderTemplate(options: RenderTemplateOptions = {}) {
  let currentOptions = options;
  const rendered = render(templateElement(currentOptions));

  return {
    ...rendered,
    rerenderTemplate(nextOptions: RenderTemplateOptions) {
      currentOptions = { ...currentOptions, ...nextOptions };
      rendered.rerender(templateElement(currentOptions));
    },
  };
}

beforeEach(() => {
  window.history.replaceState(null, "", "/merchants?q=LIFE");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MerchantsActionStateTemplate", () => {
  it("新增商家失败时显示弹框、保留输入且 URL 保持不变", async () => {
    const createMerchantAction = errorAction(
      "商家新增失败。请确认商家名称是否重复，或稍后重试。",
      "create-error-1",
    );
    const rendered = renderTemplate({ createMerchantAction });
    const nameInput = screen.getAllByRole("textbox", {
      name: "商家名称",
    })[0];
    const websiteInput = screen.getAllByRole("textbox", {
      name: "商家网址",
    })[0];
    const noteInput = screen.getAllByRole("textbox", { name: "备注" })[0];

    fireEvent.change(nameInput, { target: { value: "新商家" } });
    fireEvent.change(websiteInput, {
      target: { value: "https://merchant.example" },
    });
    fireEvent.change(noteInput, { target: { value: "用户输入的备注" } });
    fireEvent.click(screen.getByRole("button", { name: "新增商家" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("商家新增失败");
    expect(alert).toHaveTextContent(
      "商家新增失败。请确认商家名称是否重复，或稍后重试。",
    );
    expect(nameInput).toHaveValue("新商家");
    expect(websiteInput).toHaveValue("https://merchant.example");
    expect(noteInput).toHaveValue("用户输入的备注");
    rendered.rerenderTemplate({ renderKey: "render-after-failure" });
    expect(nameInput).toHaveValue("新商家");
    expect(websiteInput).toHaveValue("https://merchant.example");
    expect(noteInput).toHaveValue("用户输入的备注");
    expect(window.location.pathname).toBe("/merchants");
    expect(window.location.search).toBe("?q=LIFE");
  });

  it("成功新增商家后的服务器 render key 会清空新增表单", async () => {
    const createMerchantAction = vi.fn(successAction);
    const rendered = renderTemplate({ createMerchantAction });
    fireEvent.change(screen.getAllByRole("textbox", { name: "商家名称" })[0], {
      target: { value: "  新商家  " },
    });
    fireEvent.change(screen.getAllByRole("textbox", { name: "商家网址" })[0], {
      target: { value: "https://merchant.example" },
    });
    fireEvent.change(screen.getAllByRole("textbox", { name: "备注" })[0], {
      target: { value: "用户输入的备注" },
    });

    fireEvent.click(screen.getByRole("button", { name: "新增商家" }));
    await waitFor(() => expect(createMerchantAction).toHaveBeenCalledOnce());
    rendered.rerenderTemplate({
      merchants: [
        merchant,
        createMerchantRow({
          id: "00000000-0000-4000-8000-000000001102",
          name: "新商家",
        }),
      ],
      renderKey: "render-after-create",
    });

    await waitFor(() =>
      expect(
        screen.getAllByRole("textbox", { name: "商家名称" })[0],
      ).toHaveValue(""),
    );
    expect(screen.getAllByRole("textbox", { name: "商家网址" })[0]).toHaveValue(
      "",
    );
    expect(screen.getAllByRole("textbox", { name: "备注" })[0]).toHaveValue("");
  });

  it("编辑商家失败时保留当前商家的输入", async () => {
    const updateMerchantAction = errorAction(
      "商家更新失败。请确认商家名称是否重复，或稍后重试。",
      "update-error-1",
    );
    renderTemplate({ updateMerchantAction });
    const nameInput = screen.getAllByRole("textbox", {
      name: "商家名称",
    })[1];
    const websiteInput = screen.getAllByRole("textbox", {
      name: "商家网址",
    })[1];

    fireEvent.change(nameInput, { target: { value: "LIFE 修改后" } });
    fireEvent.change(websiteInput, {
      target: { value: "https://updated.example" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "商家更新失败。请确认商家名称是否重复，或稍后重试。",
    );
    expect(nameInput).toHaveValue("LIFE 修改后");
    expect(websiteInput).toHaveValue("https://updated.example");
  });

  it("新增别名失败时保留当前商家的别名输入", async () => {
    const createMerchantAliasAction = errorAction(
      "商家别名新增失败。请确认别名是否重复，或稍后重试。",
      "alias-create-error-1",
    );
    renderTemplate({ createMerchantAliasAction });
    const aliasInput = screen.getByRole("textbox", { name: "新增别名" });

    fireEvent.change(aliasInput, { target: { value: "生活超市" } });
    fireEvent.click(screen.getByRole("button", { name: "新增别名" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "商家别名新增失败。请确认别名是否重复，或稍后重试。",
    );
    expect(aliasInput).toHaveValue("生活超市");
  });

  it("成功新增别名后只清空对应商家的别名草稿", async () => {
    const createMerchantAliasAction = vi.fn(successAction);
    const rendered = renderTemplate({
      createMerchantAliasAction,
      merchants: [merchant, secondMerchant],
    });
    const aliasInputs = screen.getAllByRole("textbox", { name: "新增别名" });
    fireEvent.change(aliasInputs[0], { target: { value: "生活超市" } });
    fireEvent.change(aliasInputs[1], { target: { value: "网购" } });

    fireEvent.click(screen.getAllByRole("button", { name: "新增别名" })[0]);
    await waitFor(() =>
      expect(createMerchantAliasAction).toHaveBeenCalledOnce(),
    );
    rendered.rerenderTemplate({
      merchants: [
        {
          ...merchant,
          aliases: [
            ...merchant.aliases,
            createMerchantAliasRow({
              alias: "生活超市",
              id: "alias-created",
            }),
          ],
        },
        secondMerchant,
      ],
      renderKey: "render-after-alias-create",
    });

    await waitFor(() =>
      expect(
        screen.getAllByRole("textbox", { name: "新增别名" })[0],
      ).toHaveValue(""),
    );
    expect(screen.getAllByRole("textbox", { name: "新增别名" })[1]).toHaveValue(
      "网购",
    );
  });

  it("编辑成功后同步服务器返回的标准化商家数据", async () => {
    const updateMerchantAction = vi.fn(successAction);
    const rendered = renderTemplate({
      merchants: [merchant, secondMerchant],
      updateMerchantAction,
    });
    fireEvent.change(screen.getAllByRole("textbox", { name: "商家名称" })[1], {
      target: { value: "  LIFE 标准化  " },
    });
    fireEvent.change(screen.getAllByRole("textbox", { name: "商家网址" })[1], {
      target: { value: "https://draft.example" },
    });
    fireEvent.change(screen.getAllByRole("textbox", { name: "备注" })[1], {
      target: { value: "草稿备注" },
    });

    fireEvent.click(screen.getAllByRole("button", { name: "保存修改" })[0]);
    await waitFor(() => expect(updateMerchantAction).toHaveBeenCalledOnce());
    rendered.rerenderTemplate({
      merchants: [
        {
          ...merchant,
          name: "LIFE 标准化",
          note: "服务器备注",
          website_url: "https://saved.example",
        },
        secondMerchant,
      ],
      renderKey: "render-after-update",
    });

    await waitFor(() =>
      expect(
        screen.getAllByRole("textbox", { name: "商家名称" })[1],
      ).toHaveValue("LIFE 标准化"),
    );
    expect(screen.getAllByRole("textbox", { name: "商家网址" })[1]).toHaveValue(
      "https://saved.example",
    );
    expect(screen.getAllByRole("textbox", { name: "备注" })[1]).toHaveValue(
      "服务器备注",
    );
  });

  it("归档商家失败时显示对应统一反馈", async () => {
    renderTemplate({
      archiveMerchantAction: errorAction(
        "商家归档失败，请稍后重试。",
        "archive-error-1",
      ),
    });

    fireEvent.click(screen.getByRole("button", { name: "归档商家" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("商家归档失败");
    expect(alert).toHaveTextContent("商家归档失败，请稍后重试。");
  });

  it("归档别名失败时显示对应统一反馈", async () => {
    renderTemplate({
      archiveMerchantAliasAction: errorAction(
        "商家别名归档失败，请稍后重试。",
        "alias-archive-error-1",
      ),
    });

    fireEvent.click(screen.getByRole("button", { name: "移除" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("商家别名归档失败");
    expect(alert).toHaveTextContent("商家别名归档失败，请稍后重试。");
  });

  it("关闭反馈后维持 URL，重新挂载不会显示历史错误", async () => {
    const rendered = renderTemplate({
      createMerchantAction: errorAction("商家新增失败。", "create-error-1"),
    });

    fireEvent.change(screen.getAllByRole("textbox", { name: "商家名称" })[0], {
      target: { value: "新商家" },
    });
    fireEvent.click(screen.getByRole("button", { name: "新增商家" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));

    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    expect(window.location.pathname).toBe("/merchants");
    expect(window.location.search).toBe("?q=LIFE");

    rendered.unmount();
    renderTemplate();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
