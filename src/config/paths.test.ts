import { describe, expect, it } from "vitest";

import {
  accountResultValues,
  accountsResultHref,
  ledgerSwitchResultValues,
  ledgersErrorHref,
  ledgersResultHref,
  transactionEditHref,
  transactionEditPagePath,
  transactionResultValues,
  transactionsMonthHref,
  transactionsResultHref,
  transactionsSearchHref,
} from "./paths";

describe("ledger list paths", () => {
  it("生成带切换成功结果的账本列表路由", () => {
    expect(ledgersResultHref(ledgerSwitchResultValues.switched)).toBe(
      "/ledgers?result=switched",
    );
  });

  it("生成带错误码和唯一 errorKey 的账本列表路由", () => {
    const href = ledgersErrorHref("ledger_invalid");
    const url = new URL(href, "http://localhost");

    expect(url.searchParams.get("error")).toBe("ledger_invalid");
    expect(url.searchParams.get("errorKey")).toBeTruthy();
  });
});

describe("account paths", () => {
  it("生成带保存成功结果的账户路由", () => {
    expect(accountsResultHref(accountResultValues.updated)).toBe(
      "/accounts?result=updated",
    );
  });
});

describe("transaction list paths", () => {
  it("生成带保存结果的月份列表路由", () => {
    expect(
      transactionsMonthHref("2026-06", transactionResultValues.updated),
    ).toBe("/transactions?month=2026-06&result=updated");
  });

  it("生成带记账成功结果的月份列表路由", () => {
    expect(
      transactionsMonthHref("2026-06", transactionResultValues.created),
    ).toBe("/transactions?month=2026-06&result=created");
  });

  it("生成带删除成功结果的列表路由", () => {
    expect(transactionsResultHref(transactionResultValues.deleted)).toBe(
      "/transactions?result=deleted",
    );
  });

  it("生成明细搜索路由", () => {
    expect(transactionsSearchHref("便利店 午餐")).toBe(
      "/transactions/search?q=%E4%BE%BF%E5%88%A9%E5%BA%97+%E5%8D%88%E9%A4%90",
    );
  });
});

describe("transaction edit paths", () => {
  it("生成编辑记账专用路由", () => {
    expect(transactionEditHref("00000000-0000-4000-8000-000000009001")).toBe(
      "/transactions/00000000-0000-4000-8000-000000009001/edit",
    );
  });

  it("编码编辑记账路由参数", () => {
    expect(transactionEditHref("record/id with space")).toBe(
      "/transactions/record%2Fid%20with%20space/edit",
    );
  });

  it("生成带返回地址的编辑记账路由", () => {
    expect(
      transactionEditHref(
        "00000000-0000-4000-8000-000000009001",
        "/transactions/search?q=%E4%BE%BF%E5%88%A9%E5%BA%97",
      ),
    ).toBe(
      "/transactions/00000000-0000-4000-8000-000000009001/edit?returnTo=%2Ftransactions%2Fsearch%3Fq%3D%25E4%25BE%25BF%25E5%2588%25A9%25E5%25BA%2597",
    );
  });

  it("暴露 App Router 动态编辑页路径", () => {
    expect(transactionEditPagePath).toBe(
      "/transactions/[transactionRecordId]/edit",
    );
  });
});
