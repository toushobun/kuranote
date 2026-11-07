import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ledgerFeatureSettingMessages } from "config/ledgerMessages";
import {
  clickNext,
  getCurrentStepItem,
  renderLedgerSetupWizard,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

describe("LedgerSetupFeaturesStep", () => {
  it("更新特殊状态和多账户付款，仅在父草稿中保存", () => {
    const actions = renderLedgerSetupWizard({
      progress: createLedgerSetupProgressFixture({ step: 4 }),
    });
    const special = screen.getByRole("switch", { name: "启用特殊状态" });
    const multi = screen.getByRole("switch", {
      name: ledgerFeatureSettingMessages.multiAccountPayment.switchLabel,
    });
    expect(special).not.toBeChecked();
    expect(multi).not.toBeChecked();
    fireEvent.click(special);
    fireEvent.click(multi);
    clickNext();
    expect(getCurrentStepItem()).toHaveTextContent("确认");
    expect(screen.getByText("报销与退款状态 · 已开启")).toBeInTheDocument();
    expect(screen.getByText("多账户付款 · 已开启")).toBeInTheDocument();
    expect(actions.persistSetup).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "上一步" }));
    expect(special).toBeChecked();
    expect(multi).toBeChecked();
  });
});
