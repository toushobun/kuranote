import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { mockIntlTimeZone } from "test/mockIntlTimeZone";
import {
  clickNext,
  getCurrentStepItem,
  renderLedgerSetupWizard,
} from "organisms/ledgers/LedgerSetupWizard/ledgerSetupWizardTestUtils";
import { createLedgerSetupProgressFixture } from "test/mocks/ledgerSetup";

beforeEach(() => mockIntlTimeZone("Asia/Tokyo"));
afterEach(() => vi.restoreAllMocks());

describe("LedgerSetupBasicInfoStep", () => {
  it("默认值与时区预选只用于初始化", () => {
    renderLedgerSetupWizard();
    expect(screen.getByLabelText("账本名称")).toHaveValue("家庭账本");
    expect(screen.getByRole("radio", { name: "日本" })).toBeChecked();
    expect(screen.getByRole("combobox", { name: "默认货币" })).toHaveTextContent("JPY 日元");
  });

  it("无地区不允许前进，前端拒绝且不提交 Action", () => {
    mockIntlTimeZone("UTC");
    const actions = renderLedgerSetupWizard();
    expect(screen.getByRole("radio", { name: "日本" })).not.toBeChecked();
    clickNext();
    expect(getCurrentStepItem()).toHaveTextContent("基本信息");
    expect(actions.persistSetup).not.toHaveBeenCalled();
  });

  it("无账本名称时不能前进", () => {
    const actions = renderLedgerSetupWizard();
    fireEvent.change(screen.getByLabelText("账本名称"), {
      target: { value: "" },
    });
    clickNext();
    expect(getCurrentStepItem()).toHaveTextContent("基本信息");
    expect(actions.persistSetup).not.toHaveBeenCalled();
  });

  it("从保存的创建中记录恢复基本信息，并保留编辑结果", async () => {
    renderLedgerSetupWizard({
      progress: createLedgerSetupProgressFixture({
        step: 1,
        name: "旅行账本",
        displayName: "旅人",
      }),
    });
    expect(screen.getByLabelText("账本名称")).toHaveValue("旅行账本");
    fireEvent.change(screen.getByLabelText("账本名称"), {
      target: { value: "新旅行账本" },
    });
    clickNext();
    await waitFor(() => expect(getCurrentStepItem()).toHaveTextContent("账户"));
    fireEvent.click(screen.getByRole("button", { name: "上一步" }));
    expect(screen.getByLabelText("账本名称")).toHaveValue("新旅行账本");
  });
});
