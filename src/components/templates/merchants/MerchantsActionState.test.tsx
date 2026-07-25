import {
  act,
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
  return vi.fn(async () => ({ error, errorKey }));
}

function deferredAction() {
  const requests: Array<{
    formData: FormData;
    resolve: (state: MerchantActionState) => void;
  }> = [];
  const action = vi.fn<MerchantStateAction>(
    (_previousState, formData) =>
      new Promise((resolve) => requests.push({ formData, resolve })),
  );

  return {
    action,
    async resolve(state: MerchantActionState, requestIndex = 0) {
      await act(async () => {
        requests[requestIndex].resolve(state);
        await Promise.resolve();
      });
    },
  };
}

type RenderTemplateOptions = {
  archiveMerchantAction?: MerchantStateAction;
  archiveMerchantAliasAction?: MerchantStateAction;
  createMerchantAction?: MerchantStateAction;
  createMerchantAliasAction?: MerchantStateAction;
  keyword?: string;
  merchants?: (typeof merchant)[];
  updateMerchantAction?: MerchantStateAction;
};

function templateElement({
  archiveMerchantAction = successAction,
  archiveMerchantAliasAction = successAction,
  createMerchantAction = successAction,
  createMerchantAliasAction = successAction,
  keyword = "",
  merchants = [merchant],
  updateMerchantAction = successAction,
}: RenderTemplateOptions = {}) {
  return (
    <MerchantsActionStateTemplate
      archiveMerchantAction={archiveMerchantAction}
      archiveMerchantAliasAction={archiveMerchantAliasAction}
      canManageMerchants
      createMerchantAction={createMerchantAction}
      createMerchantAliasAction={createMerchantAliasAction}
      keyword={keyword}
      ledgerName="家庭账本"
      merchants={merchants}
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

function createFormInputs() {
  return {
    name: screen.getAllByRole("textbox", { name: "商家名称" })[0],
    note: screen.getAllByRole("textbox", { name: "备注" })[0],
    website: screen.getAllByRole("textbox", { name: "商家网址" })[0],
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
  it("无关重渲染不会提前清空 pending 的新增表单，失败后仍保留输入", async () => {
    const create = deferredAction();
    const rendered = renderTemplate({ createMerchantAction: create.action });
    const inputs = createFormInputs();

    fireEvent.change(inputs.name, { target: { value: "新商家" } });
    fireEvent.change(inputs.website, {
      target: { value: "https://merchant.example" },
    });
    fireEvent.change(inputs.note, { target: { value: "用户输入的备注" } });
    fireEvent.click(screen.getByRole("button", { name: "新增商家" }));

    await waitFor(() => expect(create.action).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "新增商家" })).toBeDisabled();
    rendered.rerenderTemplate({ keyword: "无关搜索条件" });
    expect(inputs.name).toHaveValue("新商家");
    expect(inputs.website).toHaveValue("https://merchant.example");
    expect(inputs.note).toHaveValue("用户输入的备注");

    await create.resolve({
      error: "商家新增失败。请确认商家名称是否重复，或稍后重试。",
      errorKey: "create-error-1",
    });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("商家新增失败");
    expect(inputs.name).toHaveValue("新商家");
    expect(inputs.website).toHaveValue("https://merchant.example");
    expect(inputs.note).toHaveValue("用户输入的备注");
    expect(window.location.search).toBe("?q=LIFE");
  });

  it("新增商家请求成功后清空对应表单", async () => {
    const create = deferredAction();
    renderTemplate({ createMerchantAction: create.action });
    const inputs = createFormInputs();
    fireEvent.change(inputs.name, { target: { value: "  新商家  " } });
    fireEvent.change(inputs.website, {
      target: { value: "https://merchant.example" },
    });
    fireEvent.change(inputs.note, { target: { value: "用户输入的备注" } });

    fireEvent.click(screen.getByRole("button", { name: "新增商家" }));
    await waitFor(() => expect(create.action).toHaveBeenCalledOnce());
    await create.resolve({});

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

  it("编辑商家失败时保留当前草稿", async () => {
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

  it("新增别名失败时保留对应商家的别名草稿", async () => {
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

  it("不同商家的别名 Action State 独立，成功只清空对应草稿", async () => {
    const createAlias = deferredAction();
    renderTemplate({
      createMerchantAliasAction: createAlias.action,
      merchants: [merchant, secondMerchant],
    });
    const aliasInputs = screen.getAllByRole("textbox", { name: "新增别名" });
    const aliasButtons = screen.getAllByRole("button", { name: "新增别名" });
    fireEvent.change(aliasInputs[0], { target: { value: "生活超市" } });
    fireEvent.change(aliasInputs[1], { target: { value: "网购" } });

    fireEvent.click(aliasButtons[0]);
    await waitFor(() => expect(createAlias.action).toHaveBeenCalledOnce());
    expect(aliasButtons[0]).toBeDisabled();
    expect(aliasButtons[1]).toBeEnabled();
    expect(
      screen.getAllByRole("button", { name: "保存修改" })[0],
    ).toBeEnabled();
    await createAlias.resolve({});

    await waitFor(() =>
      expect(
        screen.getAllByRole("textbox", { name: "新增别名" })[0],
      ).toHaveValue(""),
    );
    expect(screen.getAllByRole("textbox", { name: "新增别名" })[1]).toHaveValue(
      "网购",
    );
  });

  it("编辑成功后同步本次导航返回的标准化商家数据", async () => {
    const update = deferredAction();
    const rendered = renderTemplate({
      merchants: [merchant, secondMerchant],
      updateMerchantAction: update.action,
    });
    const nameInput = screen.getAllByRole("textbox", { name: "商家名称" })[1];
    const websiteInput = screen.getAllByRole("textbox", {
      name: "商家网址",
    })[1];
    const noteInput = screen.getAllByRole("textbox", { name: "备注" })[1];
    fireEvent.change(nameInput, { target: { value: "  LIFE 标准化  " } });
    fireEvent.change(websiteInput, {
      target: { value: "https://draft.example" },
    });
    fireEvent.change(noteInput, { target: { value: "草稿备注" } });

    fireEvent.click(screen.getAllByRole("button", { name: "保存修改" })[0]);
    await waitFor(() => expect(update.action).toHaveBeenCalledOnce());
    expect(
      screen.getAllByRole("button", { name: "保存修改" })[0],
    ).toBeDisabled();
    expect(
      screen.getAllByRole("button", { name: "保存修改" })[1],
    ).toBeEnabled();
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
    });
    expect(nameInput).toHaveValue("  LIFE 标准化  ");
    await update.resolve({});

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

  it("新增与别名请求重叠时分别完成且不会覆盖对方状态", async () => {
    const create = deferredAction();
    const createAlias = deferredAction();
    const rendered = renderTemplate({
      createMerchantAction: create.action,
      createMerchantAliasAction: createAlias.action,
      merchants: [merchant, secondMerchant],
    });
    const createNameInput = createFormInputs().name;
    const aliasInputs = screen.getAllByRole("textbox", { name: "新增别名" });
    fireEvent.change(createNameInput, { target: { value: "并发新增商家" } });
    fireEvent.change(aliasInputs[1], { target: { value: "并发别名" } });

    fireEvent.click(screen.getByRole("button", { name: "新增商家" }));
    fireEvent.click(screen.getAllByRole("button", { name: "新增别名" })[1]);
    await waitFor(() => {
      expect(create.action).toHaveBeenCalledOnce();
      expect(createAlias.action).toHaveBeenCalledOnce();
    });
    rendered.rerenderTemplate({ keyword: "pending 时的无关更新" });
    expect(createNameInput).toHaveValue("并发新增商家");
    expect(aliasInputs[1]).toHaveValue("并发别名");

    await createAlias.resolve({});
    expect(createNameInput).toHaveValue("并发新增商家");
    expect(aliasInputs[1]).toHaveValue("并发别名");

    await create.resolve({});
    await waitFor(() =>
      expect(
        screen.getAllByRole("textbox", { name: "新增别名" })[1],
      ).toHaveValue(""),
    );
    await waitFor(() =>
      expect(
        screen.getAllByRole("textbox", { name: "商家名称" })[0],
      ).toHaveValue(""),
    );
  });

  it("同一表单 pending 时阻止重复提交，结束后允许再次提交", async () => {
    const create = deferredAction();
    renderTemplate({ createMerchantAction: create.action });
    const nameInput = createFormInputs().name;
    const submitButton = screen.getByRole("button", { name: "新增商家" });
    fireEvent.change(nameInput, { target: { value: "重复提交测试" } });

    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    await waitFor(() => expect(create.action).toHaveBeenCalledOnce());
    expect(submitButton).toBeDisabled();

    await create.resolve({
      error: "商家新增失败。",
      errorKey: "create-error-1",
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "新增商家" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "新增商家" }));
    await waitFor(() => expect(create.action).toHaveBeenCalledTimes(2));
    await create.resolve(
      {
        error: "商家新增失败。",
        errorKey: "create-error-2",
      },
      1,
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
