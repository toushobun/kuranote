import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { designTokens, theme } from "theme/theme";

import { TransactionFilterDialog } from "./TransactionFilterDialog";

const filterOptions = {
  accounts: [],
  categories: [
    {
      id: "food",
      name: "餐饮",
      parentId: null,
      parentName: null,
      type: "expense" as const,
    },
    {
      id: "lunch",
      name: "午餐",
      parentId: "food",
      parentName: "餐饮",
      type: "expense" as const,
    },
  ],
  holders: [
    { id: "holder-me", name: "我" },
    { id: "none", name: "未指定持有人" },
  ],
  members: [],
  merchants: [],
};

function renderFilterDialog({
  draftFilters = { recordType: "all" },
  draftGroupBy = "month",
  onChangeFilters = vi.fn(),
  onChangeGroupBy = vi.fn(),
}: Partial<
  Pick<
    ComponentProps<typeof TransactionFilterDialog>,
    "draftFilters" | "draftGroupBy" | "onChangeFilters" | "onChangeGroupBy"
  >
> = {}) {
  render(
    <TransactionFilterDialog
      draftFilters={draftFilters}
      draftGroupBy={draftGroupBy}
      filterOptions={filterOptions}
      isPending={false}
      onApply={vi.fn()}
      onChangeFilters={onChangeFilters}
      onChangeGroupBy={onChangeGroupBy}
      onClose={vi.fn()}
      onReset={vi.fn()}
      open
    />,
  );

  return { onChangeFilters, onChangeGroupBy };
}

describe("TransactionFilterDialog", () => {
  it("在真实 theme 下 Dialog 圆角使用 xl token", () => {
    render(
      <ThemeProvider theme={theme}>
        <TransactionFilterDialog
          draftFilters={{ recordType: "all" }}
          draftGroupBy="month"
          filterOptions={filterOptions}
          isPending={false}
          onApply={vi.fn()}
          onChangeFilters={vi.fn()}
          onChangeGroupBy={vi.fn()}
          onClose={vi.fn()}
          onReset={vi.fn()}
          open
        />
      </ThemeProvider>,
    );

    expect(getComputedStyle(screen.getByRole("dialog")).borderRadius).toBe(
      `${designTokens.radius.xl}px`,
    );
  });

  it("使用同一个分类选择框切换大分类和小分类", () => {
    const { onChangeFilters } = renderFilterDialog({
      draftFilters: { parentCategoryId: "food", recordType: "all" },
    });

    expect(screen.getByRole("combobox", { name: "分类" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "大分类" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "小分类" })).toBeNull();

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "分类" }));
    fireEvent.click(screen.getByRole("option", { name: "餐饮 / 午餐" }));

    expect(onChangeFilters).toHaveBeenCalledWith({
      categoryId: "lunch",
      parentCategoryId: undefined,
      recordType: "all",
    });
  });

  describe("持有人（#909）", () => {
    it("筛选可选择持有人与「未指定持有人」", () => {
      const { onChangeFilters } = renderFilterDialog();

      fireEvent.mouseDown(screen.getByRole("combobox", { name: "持有人" }));
      expect(
        screen.getByRole("option", { name: "未指定持有人" }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("option", { name: "我" }));

      expect(onChangeFilters).toHaveBeenCalledWith({
        holderId: "holder-me",
        recordType: "all",
      });
    });

    it("其他分组可选择「持有人」", () => {
      const { onChangeGroupBy } = renderFilterDialog({
        draftGroupBy: "holder",
      });

      const holderChip = screen.getByRole("button", { name: "持有人" });
      expect(holderChip).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(holderChip);

      expect(onChangeGroupBy).toHaveBeenCalledWith("holder");
    });
  });

  describe("日期筛选", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-06-18T03:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function renderDialog() {
      return renderFilterDialog().onChangeFilters;
    }

    it("不再使用自由文本输入日期", () => {
      renderDialog();

      expect(screen.queryByRole("textbox", { name: "开始日期" })).toBeNull();
      expect(screen.queryByRole("textbox", { name: "结束日期" })).toBeNull();
      expect(
        screen.getByRole("button", { name: "选择开始日期" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "选择结束日期" }),
      ).toBeInTheDocument();
    });

    it("通过日历选择开始日期", () => {
      const onChangeFilters = renderDialog();

      fireEvent.click(screen.getByRole("button", { name: "选择开始日期" }));
      fireEvent.click(screen.getByRole("button", { name: "2026年6月10日" }));

      expect(onChangeFilters).toHaveBeenCalledWith({
        dateFrom: "2026-06-10",
        recordType: "all",
      });
    });

    it("通过日历选择结束日期", () => {
      const onChangeFilters = renderDialog();

      fireEvent.click(screen.getByRole("button", { name: "选择结束日期" }));
      fireEvent.click(screen.getByRole("button", { name: "2026年6月20日" }));

      expect(onChangeFilters).toHaveBeenCalledWith({
        dateTo: "2026-06-20",
        recordType: "all",
      });
    });
  });
});
