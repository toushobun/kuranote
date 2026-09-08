import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";

import { MerchantNameOptions } from "./MerchantNameOptions";

afterEach(cleanup);

describe("MerchantNameOptions", () => {
  it("正式名通过加粗与当前显示名状态保持独立", () => {
    render(
      <MerchantNameOptions
        merchant={createMerchantRow({
          aliases: [
            createMerchantAliasRow({ is_preferred: true }),
            createMerchantAliasRow({ alias: "LIFE", id: "alias-2" }),
          ],
          display_name: "来福",
        })}
        setPreferredAliasAction={async () => {}}
      />,
    );

    const formalName = screen.getByRole("button", {
      name: "将LIFE超市设为展示名",
    });
    const preferredAlias = screen.getByRole("button", {
      name: "来福是当前展示名",
    });

    expect(
      getComputedStyle(within(formalName).getByText("LIFE超市")).fontWeight,
    ).toBe("700");
    expect(within(formalName).queryByText("正式名")).not.toBeInTheDocument();
    expect(formalName).toHaveAttribute("aria-pressed", "false");
    expect(within(formalName).queryByTestId("StarRoundedIcon")).toBeNull();
    expect(preferredAlias).toHaveAttribute("aria-pressed", "true");
    expect(
      within(preferredAlias).getByTestId("StarRoundedIcon"),
    ).toBeInTheDocument();
  });

  it("行模式下正式名被选中时保持加粗并显示当前显示名标记", () => {
    render(
      <MerchantNameOptions
        merchant={createMerchantRow({
          aliases: [createMerchantAliasRow({ is_preferred: false })],
        })}
        setPreferredAliasAction={async () => {}}
        variant="rows"
      />,
    );

    const formalName = screen.getByRole("button", {
      name: "LIFE超市是当前展示名",
    });

    expect(
      getComputedStyle(within(formalName).getByText("LIFE超市")).fontWeight,
    ).toBe("700");
    expect(within(formalName).queryByText("正式名")).not.toBeInTheDocument();
    expect(within(formalName).getByText("当前展示名")).toBeInTheDocument();
    expect(
      within(formalName).getByTestId("StarRoundedIcon"),
    ).toBeInTheDocument();
  });

  it("行模式点击名称切换显示名且删除别名需要确认", async () => {
    const setPreferred = vi.fn<(formData: FormData) => Promise<void>>(
      async () => {},
    );
    const archiveAlias = vi.fn<(formData: FormData) => Promise<void>>(
      async () => {},
    );
    const merchant = createMerchantRow({
      aliases: [createMerchantAliasRow()],
    });

    render(
      <ConfirmDialogProvider>
        <MerchantNameOptions
          archiveAliasAction={archiveAlias}
          merchant={merchant}
          setPreferredAliasAction={setPreferred}
          variant="rows"
        />
      </ConfirmDialogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "将来福设为展示名" }));

    expect(setPreferred).toHaveBeenCalledOnce();
    const preferredData = setPreferred.mock.calls[0][0] as FormData;
    expect(preferredData.get("merchantId")).toBe(merchant.id);
    expect(preferredData.get("aliasId")).toBe("alias-1");

    fireEvent.click(screen.getByRole("button", { name: "移除别名来福" }));

    expect(
      screen.getByRole("heading", { name: "删除别名？" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/确认删除别名“来福”/)).toBeInTheDocument();
    expect(archiveAlias).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(archiveAlias).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "移除别名来福" }));
    fireEvent.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(() => expect(archiveAlias).toHaveBeenCalledOnce());
    expect(setPreferred).toHaveBeenCalledOnce();
    const archiveData = archiveAlias.mock.calls[0][0] as FormData;
    expect(archiveData.get("aliasId")).toBe("alias-1");
  });

  it("没有切换 Action 时保留展示但禁用交互", () => {
    render(<MerchantNameOptions merchant={createMerchantRow()} />);

    expect(
      screen.getByRole("button", { name: "LIFE超市是当前展示名" }),
    ).toBeDisabled();
  });
});
