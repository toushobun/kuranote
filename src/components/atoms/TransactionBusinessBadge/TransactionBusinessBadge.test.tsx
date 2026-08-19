import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TransactionBusinessBadge } from "./TransactionBusinessBadge";

afterEach(() => {
  cleanup();
});

describe("TransactionBusinessBadge", () => {
  it("分别展示结算状态与退款、报销核销金额", () => {
    render(
      <TransactionBusinessBadge
        currency="JPY"
        status={{
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "400",
            reimbursementAmount: "600",
          },
          settlementStatus: "reimbursed",
        }}
      />,
    );

    expect(screen.getByText("已结清")).toBeInTheDocument();
    expect(screen.getByText("退款核销 ¥400")).toBeInTheDocument();
    expect(screen.getByText("报销核销 ¥600")).toBeInTheDocument();
    expect(screen.queryByText("已报销 + 已退款")).not.toBeInTheDocument();
  });

  it("核销超过原始支出时显示倒赚标签并保留核销来源金额", () => {
    render(
      <TransactionBusinessBadge
        currency="JPY"
        status={{
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "400",
            reimbursementAmount: "1600",
          },
          settlementStatus: "reimbursementSurplus",
        }}
      />,
    );

    expect(screen.getByText("已倒赚")).toBeInTheDocument();
    expect(screen.getByText("退款核销 ¥400")).toBeInTheDocument();
    expect(screen.getByText("报销核销 ¥1,600")).toBeInTheDocument();
    expect(screen.queryByText("已结清")).not.toBeInTheDocument();
    expect(screen.queryByText("已报销")).not.toBeInTheDocument();
  });

  it("普通支出被退款时只展示核销来源，不派生报销结算状态", () => {
    render(
      <TransactionBusinessBadge
        currency="JPY"
        status={{
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "1000",
            reimbursementAmount: "0",
          },
          settlementStatus: null,
        }}
      />,
    );

    expect(screen.getByText("退款核销 ¥1,000")).toBeInTheDocument();
    expect(screen.queryByText("已结清")).not.toBeInTheDocument();
    expect(screen.queryByText("待报销")).not.toBeInTheDocument();
  });

  it.each([
    ["1000", "0", "已退款"],
    ["0", "1000", "已报销"],
    ["400", "600", "已结清"],
  ] as const)(
    "结清时退款 %s、报销 %s 显示为 %s",
    (refundAmount, reimbursementAmount, label) => {
      render(
        <TransactionBusinessBadge
          status={{
            incomeLinkRole: null,
            offsetComposition: { refundAmount, reimbursementAmount },
            settlementStatus: "reimbursed",
          }}
        />,
      );

      expect(screen.getByText(label)).toBeInTheDocument();
    },
  );

  it.each([
    ["refund", "退款收入"],
    ["reimbursement", "报销收入"],
  ] as const)("%s 收入角色显示为 %s", (incomeLinkRole, label) => {
    render(
      <TransactionBusinessBadge
        status={{
          incomeLinkRole,
          offsetComposition: {
            refundAmount: "0",
            reimbursementAmount: "0",
          },
          settlementStatus: null,
        }}
      />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
