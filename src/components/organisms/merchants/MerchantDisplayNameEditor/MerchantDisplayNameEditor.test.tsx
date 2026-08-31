import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";

import { MerchantDisplayNameEditor } from "./MerchantDisplayNameEditor";

afterEach(cleanup);

describe("MerchantDisplayNameEditor", () => {
  it("正式名固定展示且首选别名可切回正式名", () => {
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

    expect(screen.getByText("正式名")).toBeInTheDocument();
    expect(screen.getByText("正式商家名")).toBeInTheDocument();
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
});
