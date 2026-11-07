import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  clickNext,
  getCurrentStepItem,
  renderLedgerSetupWizard,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import {
  createLedgerSetupProgressFixture,
  ledgerSetupMerchantTemplateFixture,
} from "test/mocks/ledgerSetup";

describe("LedgerSetupMerchantsStep", () => {
  it("勾选商家写入本地草稿并跨步骤保留，不调用 RPC", () => {
    const base = createLedgerSetupProgressFixture({ step: 3 });
    const progress = createLedgerSetupProgressFixture({
      ...base.setup,
      draft: {
        ...base.setup.draft,
        merchants: { selectedKeys: [], skipped: false },
      },
      step: 3,
    }, ledgerSetupMerchantTemplateFixture);
    const actions = renderLedgerSetupWizard({ progress });
    fireEvent.click(screen.getByRole("checkbox", {
      name: "选择「餐饮」的全部商家",
    }));
    expect(screen.getByRole("button", { name: /下一步 · 已选 3 家/ })).toBeInTheDocument();
    clickNext();
    expect(getCurrentStepItem()).toHaveTextContent("功能");
    fireEvent.click(screen.getByRole("button", { name: "上一步" }));
    expect(screen.getByRole("button", { name: /下一步 · 已选 3 家/ })).toBeInTheDocument();
    expect(actions.persistSetup).not.toHaveBeenCalled();
  });
});
