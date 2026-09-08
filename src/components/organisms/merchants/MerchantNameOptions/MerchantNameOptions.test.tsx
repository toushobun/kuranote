import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";

import { MerchantNameOptions } from "./MerchantNameOptions";

afterEach(cleanup);

describe("MerchantNameOptions", () => {
  it("正式名身份与当前显示名状态保持独立", () => {
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

    expect(within(formalName).getByText("正式名")).toBeInTheDocument();
    expect(formalName).toHaveAttribute("aria-pressed", "false");
    expect(within(formalName).queryByTestId("StarRoundedIcon")).toBeNull();
    expect(preferredAlias).toHaveAttribute("aria-pressed", "true");
    expect(
      within(preferredAlias).getByTestId("StarRoundedIcon"),
    ).toBeInTheDocument();
  });

  it("正式名被选中时同时显示身份标签和当前显示名标记", () => {
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

    expect(within(formalName).getByText("正式名")).toBeInTheDocument();
    expect(within(formalName).getByText("当前展示名")).toBeInTheDocument();
    expect(within(formalName).getByTestId("StarRoundedIcon")).toBeInTheDocument();
  });

  it("行模式点击名称切换显示名且删除按钮保持独立", () => {
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
      <MerchantNameOptions
        archiveAliasAction={archiveAlias}
        merchant={merchant}
        setPreferredAliasAction={setPreferred}
        variant="rows"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "将来福设为展示名" }));

    expect(setPreferred).toHaveBeenCalledOnce();
    const preferredData = setPreferred.mock.calls[0][0] as FormData;
    expect(preferredData.get("merchantId")).toBe(merchant.id);
    expect(preferredData.get("aliasId")).toBe("alias-1");

    fireEvent.click(screen.getByRole("button", { name: "移除别名来福" }));

    expect(archiveAlias).toHaveBeenCalledOnce();
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
