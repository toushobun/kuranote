import {
  act,
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

import { MerchantNameOptions } from "./MerchantNameOptions";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("MerchantNameOptions", () => {
  it("列表页名称切换后恢复滚动位置，连续切换重新记录位置", async () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    let complete: () => void = () => {};
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    render(
      <MerchantNameOptions
        merchant={createMerchantRow({ aliases: [createMerchantAliasRow()] })}
        setPreferredAliasAction={action}
      />,
    );
    for (const top of [513, 900]) {
      scrollTo.mockClear();
      vi.stubGlobal("scrollX", 0);
      vi.stubGlobal("scrollY", top);
      const option = screen.getByRole("button", { name: "将来福设为展示名" });
      fireEvent.click(option);
      await waitFor(() => expect(option).toBeDisabled());
      vi.stubGlobal("scrollY", 0);
      await act(async () => complete());
      expect(option).toBeEnabled();
      expect(scrollTo).toHaveBeenCalledExactlyOnceWith({
        left: 0,
        top,
        behavior: "instant",
      });
    }
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("正式名加粗，当前显示名用星标表示", () => {
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
    expect(formalName).toHaveAttribute("aria-pressed", "false");
    expect(preferredAlias).toHaveAttribute("aria-pressed", "true");
    expect(
      within(preferredAlias).getByTestId("StarRoundedIcon"),
    ).toBeInTheDocument();
  });

  it("无写权限时只展示名称并禁用切换", () => {
    render(<MerchantNameOptions merchant={createMerchantRow()} />);
    expect(
      screen.getByRole("button", { name: "LIFE超市是当前展示名" }),
    ).toBeDisabled();
  });
});
