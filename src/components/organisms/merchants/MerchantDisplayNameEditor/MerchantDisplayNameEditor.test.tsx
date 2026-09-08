import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { MerchantDisplayNameEditor } from "./MerchantDisplayNameEditor";

afterEach(cleanup);

describe("MerchantDisplayNameEditor", () => {
  it("正式名固定展示且加粗，首选别名可切回正式名", () => {
    const setPreferredAliasAction = vi.fn(async () => {});
    render(
      <MerchantDisplayNameEditor
        archiveAliasAction={vi.fn(async () => {})}
        createAliasAction={vi.fn(async () => {})}
        merchant={createMerchantRow({
          aliases: [createMerchantAliasRow({ is_preferred: true })],
          display_name: "来福",
          name: "正式商家名",
        })}
        setPreferredAliasAction={setPreferredAliasAction}
      />,
    );

    expect(getComputedStyle(screen.getByText("正式商家名")).fontWeight).toBe(
      "700",
    );
    expect(screen.queryByText("正式名")).not.toBeInTheDocument();
    expect(screen.getByText("当前展示名")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "移除别名正式商家名" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "将正式商家名设为展示名" }),
    );
    expect(setPreferredAliasAction).toHaveBeenCalledOnce();
  });

  it("每条别名同时提供展示名选择与移除操作", () => {
    render(
      <MerchantDisplayNameEditor
        archiveAliasAction={vi.fn(async () => {})}
        createAliasAction={vi.fn(async () => {})}
        merchant={createMerchantRow({
          aliases: [createMerchantAliasRow()],
          name: "正式商家名",
        })}
        setPreferredAliasAction={vi.fn(async () => {})}
      />,
    );

    expect(
      screen.getByRole("button", { name: "将来福设为展示名" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "移除别名来福" }),
    ).toBeInTheDocument();
  });

  it("仅在选中的名称行显示当前展示名标签", () => {
    render(
      <MerchantDisplayNameEditor
        archiveAliasAction={vi.fn(async () => {})}
        createAliasAction={vi.fn(async () => {})}
        merchant={createMerchantRow({
          aliases: [
            createMerchantAliasRow({ is_preferred: true }),
            createMerchantAliasRow({ alias: "LIFE", id: "alias-2" }),
          ],
          name: "正式商家名",
        })}
        setPreferredAliasAction={vi.fn(async () => {})}
      />,
    );

    expect(screen.getAllByText("当前展示名")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "来福是当前展示名" }),
    ).toBeInTheDocument();
  });

  it("没有首选别名时正式名保持加粗并显示当前展示名", () => {
    render(
      <MerchantDisplayNameEditor
        archiveAliasAction={vi.fn(async () => {})}
        createAliasAction={vi.fn(async () => {})}
        merchant={createMerchantRow({ aliases: [], name: "正式商家名" })}
        setPreferredAliasAction={vi.fn(async () => {})}
      />,
    );

    expect(getComputedStyle(screen.getByText("正式商家名")).fontWeight).toBe(
      "700",
    );
    expect(screen.queryByText("正式名")).not.toBeInTheDocument();
    expect(screen.getByText("当前展示名")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "正式商家名是当前展示名" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "移除别名正式商家名" }),
    ).not.toBeInTheDocument();
  });
});

it("点击名称文字切换，删除需确认且不触发切换，等待时禁止操作", async () => {
  const select = vi.fn<(formData: FormData) => Promise<void>>(async () => {});
  const archive = vi.fn<(formData: FormData) => Promise<void>>(async () => {});
  const props = {
    merchant: createMerchantRow({ aliases: [createMerchantAliasRow()] }),
    setPreferredAliasAction: select,
    archiveAliasAction: archive,
    createAliasAction: async () => {},
  };
  const renderEditor = (pending = false) => (
    <UserThemeProvider storageScope="merchant-display-name-editor-test">
      <ConfirmDialogProvider>
        <MerchantDisplayNameEditor {...props} pending={pending} />
      </ConfirmDialogProvider>
    </UserThemeProvider>
  );
  const { rerender } = render(renderEditor());

  fireEvent.click(screen.getByText("来福"));
  expect(select).toHaveBeenCalledOnce();
  expect(select.mock.calls[0][0].get("aliasId")).toBe("alias-1");

  fireEvent.click(screen.getByRole("button", { name: "移除别名来福" }));
  expect(
    screen.getByRole("heading", { name: "删除别名？" }),
  ).toBeInTheDocument();
  expect(archive).not.toHaveBeenCalled();
  expect(select).toHaveBeenCalledOnce();

  fireEvent.click(screen.getByRole("button", { name: "删除" }));
  await waitFor(() => expect(archive).toHaveBeenCalledOnce());
  expect(select).toHaveBeenCalledOnce();
  expect(screen.queryByTestId("StarBorderRoundedIcon")).toBeNull();

  rerender(renderEditor(true));
  expect(
    screen.getByRole("button", { name: "将来福设为展示名" }),
  ).toBeDisabled();
  expect(screen.getByRole("button", { name: "移除别名来福" })).toBeDisabled();
});
