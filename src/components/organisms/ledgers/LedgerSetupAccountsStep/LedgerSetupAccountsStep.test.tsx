import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getChecklistGroup } from "molecules/ui/GroupedPresetChecklist/groupedPresetChecklistTestUtils";
import {
  clickNext,
  getCurrentStepItem,
  renderLedgerSetupWizard,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import {
  createLedgerSetupProgressFixture,
  ledgerSetupTemplateFixture,
} from "test/mocks/ledgerSetup";

describe("LedgerSetupAccountsStep", () => {
  it("账户勾选直接进入跨步草稿，切换步骤不写库", () => {
    const actions = renderLedgerSetupWizard({
      progress: createLedgerSetupProgressFixture(
        { step: 2 },
        ledgerSetupTemplateFixture,
      ),
    });
    expect(getChecklistGroup("银行卡")).toHaveTextContent("0 / 3");
    fireEvent.click(
      screen.getByRole("checkbox", { name: "选择「银行卡」的全部账户" }),
    );
    expect(
      screen.getByRole("button", { name: "下一步 · 已选 4 个" }),
    ).toBeInTheDocument();
    clickNext();
    expect(getCurrentStepItem()).toHaveTextContent("商家");
    fireEvent.click(screen.getByRole("button", { name: "上一步" }));
    expect(
      screen.getByRole("button", { name: "下一步 · 已选 4 个" }),
    ).toBeInTheDocument();
    expect(actions.persistSetup).not.toHaveBeenCalled();
  });

  it("无模板时不应写库", () => {
    const actions = renderLedgerSetupWizard({
      progress: createLedgerSetupProgressFixture({ step: 2 }, null),
    });
    clickNext();
    expect(getCurrentStepItem()).toHaveTextContent("商家");
    expect(actions.persistSetup).not.toHaveBeenCalled();
  });
});
