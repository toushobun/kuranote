import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TransactionBusinessBadge } from "./TransactionBusinessBadge";

afterEach(() => {
  cleanup();
});

describe("TransactionBusinessBadge", () => {
  it.each([
    ["pendingReimbursement", "待报销"],
    ["reimbursed", "已报销"],
    ["refund", "退款"],
    ["reimbursement", "报销"],
  ] as const)("%s 显示 %s 标签", (status, label) => {
    render(<TransactionBusinessBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("允许覆盖标签文案", () => {
    render(
      <TransactionBusinessBadge
        label="公司报销中"
        status="pendingReimbursement"
      />,
    );

    expect(screen.getByText("公司报销中")).toBeInTheDocument();
  });
});
