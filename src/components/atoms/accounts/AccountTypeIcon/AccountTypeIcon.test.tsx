import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AccountType } from "types/accounts";

import { AccountTypeIcon } from "./AccountTypeIcon";

describe("AccountTypeIcon", () => {
  it.each<[AccountType, string]>([
    ["cash", "PaymentsOutlinedIcon"],
    ["bank", "AccountBalanceOutlinedIcon"],
    ["credit_card", "CreditCardOutlinedIcon"],
    ["e_money", "AccountBalanceWalletOutlinedIcon"],
    ["other", "MoreHorizRoundedIcon"],
  ])("%s 类型显示对应图标", (type, testId) => {
    render(<AccountTypeIcon type={type} />);

    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
});
