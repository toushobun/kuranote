import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReceiptAmountButton, ReceiptLine } from "./ReceiptLine";

describe("ReceiptLine", () => {
  it.each(["待报销", "新币种不支持这么多位小数，请重新输入"])(
    "将分类名、金额和操作放在第一排，%s 放在第二排",
    (subline) => {
      render(
        <ReceiptLine
          label="🍽️ 饮食 · 🍙 早餐"
          subline={<span>{subline}</span>}
          amount={
            <ReceiptAmountButton
              label="修改金额"
              amount="¥1200"
              onClick={vi.fn()}
            />
          }
          editLabel="编辑明细"
          onEdit={vi.fn()}
          removeLabel="删除明细"
          onRemove={vi.fn()}
        />,
      );
      const label = screen.getByText("🍽️ 饮食 · 🍙 早餐");
      const row = screen.getByRole("button", {
        name: "编辑明细",
      }).parentElement!;
      expect(row).toContainElement(label);
      for (const name of ["修改金额", "编辑明细", "删除明细"]) {
        expect(screen.getByRole("button", { name }).parentElement).toBe(row);
      }
      expect(getComputedStyle(row).display).toBe("flex");
      expect(getComputedStyle(row).alignItems).toBe("center");
      const secondRow = screen.getByText(subline).parentElement!;
      expect(row.nextElementSibling).toBe(secondRow);
      expect(secondRow.parentElement).toBe(row.parentElement);
      expect(label).not.toHaveClass("MuiTypography-noWrap");
    },
  );
  it("没有标签时只显示第一排", () => {
    const { container } = render(
      <ReceiptLine label="早餐" editLabel="编辑明细" onEdit={vi.fn()} />,
    );
    expect(container.firstElementChild?.children).toHaveLength(1);
  });
});
