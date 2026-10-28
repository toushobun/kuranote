import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  renderEntryComponent,
  clickEntryButton as click,
} from "test/transactionStepFlow";
import { summaryCardFixture } from "test/mocks/transactionStepFlow";
import { MerchantAccountSummaryCard } from "./MerchantAccountSummaryCard";
function setup(withAccount = true) {
  const props = {
    ...summaryCardFixture,
    account: withAccount ? summaryCardFixture.account : undefined,
    onMerchantChange: vi.fn(),
    onAccountChange: vi.fn(),
  };
  renderEntryComponent(<MerchantAccountSummaryCard {...props} />);
  return props;
}
describe("MerchantAccountSummaryCard", () => {
  it("合并显示商家账户与币种，并分别通知更换", () => {
    const props = setup();
    click("7-Eleven 更换");
    expect(props.onMerchantChange).toHaveBeenCalledOnce();
    click("PayPay JPY 更换");
    expect(props.onAccountChange).toHaveBeenCalledOnce();
  });
  it("未选账户时只显示商家行", () => {
    setup(false);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByText("PayPay")).not.toBeInTheDocument();
  });
});
