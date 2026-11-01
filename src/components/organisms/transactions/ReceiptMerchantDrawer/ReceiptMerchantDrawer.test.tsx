import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FlowMerchant } from "organisms/transactions/MerchantStep/MerchantStep.types";
import { flowFixture } from "test/mocks/transactionStepFlow";
import {
  ReceiptCreationTestProviders,
  submitReceiptCreation,
  waitMerchantDrawerClosed,
} from "test/receiptCreation";
import { expectFeedbackInBodyPortal } from "test/feedbackPortal";
import { ReceiptMerchantDrawer } from "./ReceiptMerchantDrawer";
import { useReceiptMerchantPicker } from "./useReceiptMerchantPicker";

function Harness({ onSelect }: { onSelect: (merchant: FlowMerchant) => void }) {
  const picker = useReceiptMerchantPicker(onSelect);
  return (
    <main style={{ position: "relative", zIndex: 1 }}>
      <button onClick={picker.openPicker}>换商家</button>
      <ReceiptMerchantDrawer
        merchants={flowFixture.merchants}
        merchantTags={flowFixture.merchantTags}
        frequentMerchants={flowFixture.frequentMerchants}
        open={picker.open}
        suspended={picker.suspended}
        onClose={picker.closePicker}
        onSelect={picker.selectMerchant}
        onAddMerchant={picker.onAddMerchant}
      />
    </main>
  );
}

function setup() {
  const onSelect = vi.fn();
  const view = render(<Harness onSelect={onSelect} />, {
    wrapper: ReceiptCreationTestProviders,
  });
  fireEvent.click(screen.getByRole("button", { name: "换商家" }));
  return { ...view, onSelect };
}

describe("ReceiptMerchantDrawer", () => {
  it("抽屉通过 body Portal 打开，取消不选择商家，选中后关闭", async () => {
    const { container, onSelect } = setup();
    const drawer = screen
      .getByRole("heading", { name: "商家" })
      .closest(".MuiDrawer-root");
    expect(drawer?.parentElement).toBe(document.body);
    expect(container).not.toContainElement(drawer as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "关闭商家编辑" }));
    await waitMerchantDrawerClosed();
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "换商家" }));
    fireEvent.click(screen.getByRole("button", { name: "LIFE超市" }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(flowFixture.merchants[0]);
    await waitMerchantDrawerClosed();
  });

  it("新增弹层通过 Portal 打开，取消恢复搜索，保存自动选中且成功提示在最上层", async () => {
    const { container, onSelect } = setup();
    fireEvent.change(screen.getByRole("textbox", { name: "搜索商家" }), {
      target: { value: "新商家" },
    });
    fireEvent.click(screen.getByRole("button", { name: "新增商家" }));
    const dialog = await screen.findByRole("dialog", { name: /新增商家/ });
    expect(dialog.closest(".MuiDialog-root")?.parentElement).toBe(
      document.body,
    );
    expect(await screen.findByLabelText(/商家名称/)).toHaveValue("新商家");
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(
      await screen.findByRole("textbox", { name: "搜索商家" }),
    ).toHaveValue("新商家");
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "新增商家" }));
    const feedback = await submitReceiptCreation("merchant", "新商家");
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      id: "new-merchant",
      name: "新商家",
    });
    expectFeedbackInBodyPortal(feedback, container);
    await waitMerchantDrawerClosed();
  });
});
