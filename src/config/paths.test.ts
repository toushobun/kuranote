import { describe, expect, it } from "vitest";

import {
  merchantResultValues,
  merchantsNewHref,
  merchantsResultHref,
  accountResultValues,
  accountsNewHref,
  accountsResultHref,
  ledgerSwitchResultValues,
  ledgersResultHref,
  transactionEditHref,
  transactionEditPagePath,
  transactionResultValues,
  transactionsMonthHref,
  transactionsNewEntryHref,
  transactionsResultHref,
  withQueryParam,
  transactionsSearchHref,
} from "./paths";

describe("ledger list paths", () => {
  it("生成带切换成功结果的账本列表路由", () => {
    expect(ledgersResultHref(ledgerSwitchResultValues.switched)).toBe(
      "/ledgers?result=switched",
    );
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

describe("merchant paths", () => {
  it("生成带新增保存成功结果的商家列表路由", () => {
    expect(merchantsResultHref(merchantResultValues.created)).toBe(
      "/merchants?result=created",
    );
  });

  it("生成带保存成功结果的商家列表路由", () => {
    expect(merchantsResultHref(merchantResultValues.updated)).toBe(
      "/merchants?result=updated",
    );
  });
});

describe("transaction setup paths", () => {
  it("生成带 returnTo 的商家新增路由", () => {
    expect(
      merchantsNewHref(
        transactionsNewEntryHref({ method: "standard", type: "expense" }),
      ),
    ).toBe(
      "/merchants/new?returnTo=%2Ftransactions%2Fnew%3Fmethod%3Dstandard%26type%3Dexpense",
    );
  });

  it("商家新增路由可预填名称", () => {
    expect(merchantsNewHref("/transactions/new", "LIFE")).toBe(
      "/merchants/new?name=LIFE&returnTo=%2Ftransactions%2Fnew",
    );
  });

  it("没有 returnTo 时商家新增路由不带参数", () => {
    expect(merchantsNewHref()).toBe("/merchants/new");
  });

  it("生成带 returnTo 的账户新增路由", () => {
    expect(
      accountsNewHref(
        transactionsNewEntryHref({ method: "standard", type: "income" }),
      ),
    ).toBe(
      "/accounts/new?returnTo=%2Ftransactions%2Fnew%3Fmethod%3Dstandard%26type%3Dincome",
    );
  });

  it("没有 returnTo 时账户新增路由不带参数", () => {
    expect(accountsNewHref()).toBe("/accounts/new");
  });
});

describe("transaction entry paths", () => {
  it("从商家记账不带 method", () => {
    expect(transactionsNewEntryHref({ method: "merchant" })).toBe(
      "/transactions/new",
    );
  });

  it("账户周转只带 method，标准记账带页签", () => {
    expect(transactionsNewEntryHref({ method: "transfer" })).toBe(
      "/transactions/new?method=transfer",
    );
    expect(
      transactionsNewEntryHref({ method: "standard", type: "income" }),
    ).toBe("/transactions/new?method=standard&type=income");
  });

  it("追加查询参数时保留原有参数并覆盖同名参数", () => {
    expect(
      withQueryParam("/transactions/new?merchantId=a", "accountId", "b"),
    ).toBe("/transactions/new?merchantId=a&accountId=b");
    expect(
      withQueryParam("/transactions/new?accountId=a", "accountId", "b"),
    ).toBe("/transactions/new?accountId=b");
  });
});
