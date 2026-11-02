import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MerchantForm } from "./MerchantForm";

afterEach(cleanup);

describe("MerchantForm", () => {
  it("编辑新增商家的各字段", () => {
    render(
      <MerchantForm
        action={vi.fn()}
        fetchIconAction={vi.fn()}
        ledgerId="ledger-1"
      />,
    );

    fireEvent.change(screen.getByLabelText(/商家名称/), {
      target: { value: "Amazon" },
    });
    fireEvent.change(screen.getByLabelText("商家网址"), {
      target: { value: "https://www.amazon.co.jp" },
    });
    fireEvent.change(screen.getByLabelText("备注（可选）"), {
      target: { value: "网购" },
    });

    expect(screen.getByLabelText(/商家名称/)).toHaveValue("Amazon");
    expect(screen.getByLabelText("商家网址")).toHaveValue(
      "https://www.amazon.co.jp",
    );
    expect(screen.getByLabelText("备注（可选）")).toHaveValue("网购");
  });

  it("从记一笔带来的关键词预填到商家名称", () => {
    render(
      <MerchantForm
        action={vi.fn()}
        fetchIconAction={vi.fn()}
        initialName="LIFE"
        ledgerId="ledger-1"
      />,
    );

    expect(screen.getByLabelText(/商家名称/)).toHaveValue("LIFE");
  });

  it("提交中禁用按钮并显示进度", () => {
    const { container } = render(
      <MerchantForm
        action={vi.fn()}
        fetchIconAction={vi.fn()}
        ledgerId="ledger-1"
        pending
      />,
    );

    expect(container.querySelector('button[type="submit"]')).toBeDisabled();
    expect(screen.getByLabelText("新增中")).toBeInTheDocument();
  });
  it("预填名称作为初值，可保存字段和分类修改后报告 dirty，全部还原恢复干净", () => {
    const dirty = vi.fn();
    render(
      <MerchantForm
        action={vi.fn()}
        fetchIconAction={vi.fn()}
        initialName="LIFE"
        ledgerId="ledger-1"
        id="merchant-create"
        onDirtyChange={dirty}
        tags={[
          {
            id: "market",
            icon: "🛒",
            name: "超市",
            sort_order: 0,
            merchant_count: 0,
          },
        ]}
      />,
    );
    expect(dirty).toHaveBeenLastCalledWith(false);
    for (const [label, initial] of [
      [/商家名称/, "LIFE"],
      ["商家网址", ""],
      ["备注（可选）", ""],
    ] as const) {
      const field = screen.getByLabelText(label);
      fireEvent.change(field, { target: { value: "修改内容" } });
      expect(dirty).toHaveBeenLastCalledWith(true);
      fireEvent.change(field, { target: { value: initial } });
      expect(dirty).toHaveBeenLastCalledWith(false);
    }
    fireEvent.click(screen.getByText("🛒 超市"));
    expect(dirty).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByText("🛒 超市"));
    expect(dirty).toHaveBeenLastCalledWith(false);
    expect(screen.getByLabelText(/商家名称/).closest("form")).toHaveAttribute(
      "id",
      "merchant-create",
    );
  });
});
