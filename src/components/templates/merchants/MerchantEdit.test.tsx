import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  createMerchantAliasRow,
  createMerchantRow,
} from "@/test/mocks/merchants";
import { UserThemeProvider } from "theme/UserThemeProvider";

import { MerchantEditTemplate } from "./MerchantEdit";

const action = vi.fn(async () => ({}));

function renderTemplate() {
  const merchant = createMerchantRow({
    aliases: [createMerchantAliasRow({ is_preferred: true })],
  });

  render(
    <UserThemeProvider storageScope="merchant-edit-test">
      <MerchantEditTemplate
        archiveMerchantAction={action}
        archiveMerchantAliasAction={action}
        createMerchantAliasAction={action}
        ledgerId="ledger-1"
        ledgerName="家庭账本"
        merchant={merchant}
        setPreferredMerchantAliasAction={action}
        tags={[]}
        updateMerchantAction={action}
      />
    </UserThemeProvider>,
  );
}

describe("MerchantEditTemplate", () => {
  it("只显示一套可编辑的商家基础信息", () => {
    renderTemplate();

    expect(screen.getAllByLabelText(/商家名称/)).toHaveLength(1);
    expect(screen.queryByText(/商家名称　/)).not.toBeInTheDocument();
  });

  it("未保存的名称不会提前成为正式名候选", () => {
    renderTemplate();

    fireEvent.change(screen.getByLabelText(/商家名称/), {
      target: { value: "尚未保存的新名称" },
    });

    expect(
      screen.getByRole("button", { name: "将LIFE超市设为展示名" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "将尚未保存的新名称设为展示名" }),
    ).not.toBeInTheDocument();
  });

  it("归档商家前要求二次确认", () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => {});
    renderTemplate();

    fireEvent.click(screen.getByRole("button", { name: "归档商家" }));

    expect(
      screen.getByRole("heading", { name: "归档商家？" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/既有记录仍会保留/)).toBeInTheDocument();
    expect(requestSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "归档商家" }));

    expect(requestSubmit).toHaveBeenCalledOnce();
    requestSubmit.mockRestore();
  });
});
