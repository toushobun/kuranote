// @vitest-environment node
import ExcelJS from "exceljs";
import { execFileSync } from "node:child_process";
import { getCategoryDisplayName } from "utils/categoryNames";
import type { DataExport } from "internal/dataExport";
import { describe, expect, it } from "vitest";
import {
  analyzeImportFile,
  importColumnsBySheetKind,
  importSheetKindLabels,
} from "internal/dataImport";
import {
  createDataExportFixture,
  createEmptyDataExport,
} from "test/mocks/dataExport";
import { buildDataExportWorkbook } from "./dataExportWorkbook";

async function loadWorkbook(data = createDataExportFixture()) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await buildDataExportWorkbook(data));
  return workbook;
}
function cell(sheet: ExcelJS.Worksheet, row: number, name: string) {
  const headers = sheet.getRow(1).values as string[];
  return sheet.getRow(row).getCell(headers.indexOf(name));
}

describe("dataExportWorkbook", () => {
  it("按原始明细导出多分类收支、真实记账人、分类层级和商家展示名", async () => {
    const sheet = (await loadWorkbook()).getWorksheet("收支")!;
    expect(sheet.rowCount).toBe(4);
    expect(cell(sheet, 2, "账单关联").value).toBe("normal");
    expect(cell(sheet, 3, "账单关联").value).toBe("normal");
    expect(cell(sheet, 2, "记账人").value).toBe("历史记账人");
    expect(cell(sheet, 2, "一级分类").value).toBe("饮食");
    expect(cell(sheet, 2, "二级分类").value).toBe("午餐");
    expect(cell(sheet, 3, "二级分类").value).toBe("");
    expect(cell(sheet, 2, "金额").value).toBe("123.45");
    expect(cell(sheet, 2, "交易类型").value).toBe("支出");
    expect(cell(sheet, 4, "交易类型").value).toBe("收入");
    expect(cell(sheet, 2, "商家").value).toBe("商家展示名");
    expect(cell(sheet, 2, "商家分类").value).toBe("餐饮、附近");
    expect(cell(sheet, 2, "备注").value).toBe("=原样备注");
    expect(cell(sheet, 2, "备注").type).toBe(ExcelJS.ValueType.String);
    const date = new Date("2026-09-19T01:02:03.000Z");
    const pad = (value: number) => String(value).padStart(2, "0");
    expect(cell(sheet, 2, "日期").value).toBe(
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    );
  });

  it("转账按余额方向选择两端账户并分别应用持有人颜色", async () => {
    const workbook = await loadWorkbook();
    const transfer = workbook.getWorksheet("转账")!;
    expect(transfer.rowCount).toBe(2);
    expect(cell(transfer, 2, "转出账户").value).toBe("现金");
    expect(cell(transfer, 2, "转入账户").value).toBe("存款");
    expect(cell(transfer, 2, "金额").value).toBe("300");
    for (const name of ["转出账户", "转出账户持有人"])
      expect(cell(transfer, 2, name).font.color).toEqual({ argb: "FF3F9FF4" });
    for (const name of ["转入账户", "转入账户持有人"])
      expect(cell(transfer, 2, name).font.color).toEqual({ argb: "FFE5576C" });
    const normal = workbook.getWorksheet("收支")!;
    for (const name of ["账户", "账户持有人"])
      expect(cell(normal, 2, name).font.color).toEqual({ argb: "FF3F9FF4" });
  });

  it("余额变更保留正负金额，无持有人不设置字体颜色", async () => {
    const data = createDataExportFixture();
    const adjustment = data.records[2];
    if (adjustment.type !== "balance_adjustment")
      throw new Error("测试数据不正确");
    data.records.push({
      ...adjustment,
      id: "positive",
      items: [
        {
          ...adjustment.items[0],
          accountId: "cash",
          balanceDelta: "7.00",
        },
      ],
    });
    const sheet = (await loadWorkbook(data)).getWorksheet("余额变更")!;
    expect(sheet.rowCount).toBe(3);
    expect(cell(sheet, 2, "金额").value).toBe("-12.34");
    expect(cell(sheet, 3, "金额").value).toBe("7.00");
    expect(cell(sheet, 2, "账户持有人").value).toBe("");
    expect(cell(sheet, 2, "账户").font?.color).toBeUndefined();
    expect(cell(sheet, 3, "账户").font.color).toEqual({ argb: "FF3F9FF4" });
  });

  it.each(["123.45", "-67.89"])(
    "初始余额 %s 按普通余额变更导出并保留创建时间和固定备注",
    async (balanceDelta) => {
      const data = createDataExportFixture();
      const record = data.records[2];
      if (record.type !== "balance_adjustment")
        throw new Error("测试数据不正确");
      record.note = "初始余额";
      record.items[0].balanceDelta = balanceDelta;
      record.items[0].amount = String(Math.abs(Number(balanceDelta)));
      data.records = [record];
      const workbook = await loadWorkbook(data);
      const sheet = workbook.getWorksheet("余额变更")!;
      expect(sheet.rowCount).toBe(2);
      expect(cell(sheet, 2, "交易类型").value).toBe("余额变更");
      expect(cell(sheet, 2, "金额").value).toBe(balanceDelta);
      expect(cell(sheet, 2, "备注").value).toBe("初始余额");
      expect(cell(sheet, 2, "记账人").value).toBe(record.recorderName);
      expect(cell(sheet, 2, "日期").value).toBe(
        cell((await loadWorkbook()).getWorksheet("余额变更")!, 2, "日期").value,
      );
      expect(workbook.getWorksheet("收支")!.rowCount).toBe(1);
      expect(workbook.getWorksheet("转账")!.rowCount).toBe(1);
    },
  );

  it("只含余额变更（含非零初始余额）的导出文件可直接导入，差值总和与导出前账户余额一致", async () => {
    const data = createDataExportFixture();
    const [, , adjustment] = data.records;
    const adjustmentOf = (
      id: string,
      accountId: string,
      balanceDelta: string,
      note: string,
    ) => ({
      ...adjustment,
      id,
      note,
      items: [
        {
          ...adjustment.items[0],
          accountId,
          amount: balanceDelta.replace("-", ""),
          balanceDelta,
        },
      ],
    });
    data.records = [
      adjustmentOf("initial", "cash", "1000", "初始余额"),
      adjustmentOf("plus", "cash", "7.00", "盘点"),
      adjustmentOf("minus", "cash", "-20.5", ""),
      adjustmentOf("no-holder", "none", "-12.34", ""),
    ];
    const file = new File([await buildDataExportWorkbook(data)], "export.xlsx");

    const { result, units } = await analyzeImportFile(file);

    expect(result).toMatchObject({
      ok: true,
      summary: {
        balanceAdjustmentCount: 4,
        incomeExpenseCount: 0,
        transferCount: 0,
      },
    });
    const balances = new Map<string, number>();
    for (const unit of units) {
      if (unit.kind !== "balanceAdjustment") throw new Error("意外的单元");
      const key = `${unit.row.accountName}/${unit.row.accountHolder}`;
      balances.set(key, (balances.get(key) ?? 0) + unit.row.amount);
    }
    expect(
      [...balances.values()].map((v) => Math.round(v * 100) / 100),
    ).toEqual([986.5, -12.34]);
    expect(units[0]).toMatchObject({
      row: { amount: 1000, note: "初始余额" },
    });
  });

  it("「收支」「转账」「余额变更」工作表都导出账户类型的中文标签（含「其他」），列名与导入模板一致", async () => {
    const workbook = await loadWorkbook();
    const transfer = workbook.getWorksheet("转账")!;
    expect(cell(workbook.getWorksheet("收支")!, 2, "账户类型").value).toBe(
      "现金",
    );
    expect(cell(transfer, 2, "转出账户类型").value).toBe("现金");
    expect(cell(transfer, 2, "转入账户类型").value).toBe("银行卡");
    expect(cell(workbook.getWorksheet("余额变更")!, 2, "账户类型").value).toBe(
      "其他",
    );
  });

  it("多账户分号格式真实往返保留账户、持有人、金额及顺序，后续行继承首行", async () => {
    const data = createDataExportFixture();
    const normal = data.records[0];
    if (normal.type !== "normal") throw new Error("测试数据不正确");
    normal.items = [
      { categoryId: "lunch", amount: "50" },
      { categoryId: "lunch", amount: "30" },
    ];
    normal.payments = [
      { accountId: "none", amount: "50" },
      { accountId: "bank", amount: "30" },
    ];
    data.accounts[2].currency = "JPY";
    data.records = [normal];
    const workbook = await loadWorkbook(data);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "收支",
      "转账",
      "余额变更",
    ]);
    const sheet = workbook.getWorksheet("收支")!;
    expect(cell(sheet, 2, "账户").value).toBe("公共账户；存款");
    expect(cell(sheet, 2, "账户持有人").value).toBe("；小红");
    expect(cell(sheet, 2, "付款金额").value).toBe("50；30");
    for (const name of [
      "账户",
      "账户持有人",
      "账户币种",
      "账户类型",
      "付款金额",
    ])
      expect(cell(sheet, 3, name).value).toBe("-");
    const { result, units } = await analyzeImportFile(
      new File([await buildDataExportWorkbook(data)], "export.xlsx"),
    );
    expect(result.ok).toBe(true);
    expect(units).toHaveLength(1);
    expect(units[0]).toMatchObject({
      group: {
        rowNumbers: [2, 3],
        items: [
          {
            payments: [
              {
                accountName: "公共账户",
                accountHolder: null,
                amount: "50",
                accountType: "other",
              },
              {
                accountName: "存款",
                accountHolder: "小红",
                amount: "30",
                accountType: "bank",
              },
            ],
          },
          { amount: 30 },
        ],
      },
    });
  });

  it("单账户收支混合记录真实往返仍为一笔且没有付款金额列", async () => {
    const data = createDataExportFixture();
    const sheet = (await loadWorkbook(data)).getWorksheet("收支")!;
    expect(sheet.getRow(1).values).not.toContain("付款金额");
    const { result, units } = await analyzeImportFile(
      new File([await buildDataExportWorkbook(data)], "export.xlsx"),
    );
    expect(result.ok).toBe(true);
    const normal = units.find((unit) => unit.kind === "incomeExpense");
    expect(normal).toMatchObject({ group: { rowNumbers: [2, 3, 4] } });
    if (normal?.kind !== "incomeExpense") throw new Error("意外的单元");
    expect(normal.group.items.map((item) => item.transactionType)).toEqual([
      "expense",
      "expense",
      "income",
    ]);
    expect(normal.group.items[0].payments).toMatchObject([
      { accountName: "现金", accountHolder: "小明", amount: null },
    ]);
  });

  it.each(["现金;钱包", "现金；钱包"])(
    "账户名包含分号 %s 时拒绝导出并提示",
    async (name) => {
      const data = createDataExportFixture();
      data.accounts[0].name = name;
      await expect(buildDataExportWorkbook(data)).rejects.toMatchObject({
        code: "data_export_account_separator",
      });
    },
  );

  it("引用缺失或转账方向无法判定时拒绝导出，而不是写出错误或空白数据", async () => {
    const broken = (
      mutate: (data: ReturnType<typeof createDataExportFixture>) => void,
    ) => {
      const data = createDataExportFixture();
      mutate(data);
      return buildDataExportWorkbook(data);
    };
    const error = { code: "data_export_incomplete" };
    await expect(
      broken((d) => {
        d.categories = [];
      }),
    ).rejects.toMatchObject(error);
    await expect(
      broken((d) => {
        d.categories = d.categories.filter((c) => c.id !== "food");
      }),
    ).rejects.toMatchObject(error);
    await expect(
      broken((d) => {
        d.accounts = d.accounts.filter((a) => a.id !== "cash");
      }),
    ).rejects.toMatchObject(error);
    await expect(
      broken((d) => {
        const transfer = d.records[1];
        if (transfer.type !== "transfer") throw new Error("测试数据不正确");
        transfer.items[0].balanceDelta = "0";
      }),
    ).rejects.toMatchObject(error);
    await expect(
      broken((d) => {
        const transfer = d.records[1];
        if (transfer.type !== "transfer") throw new Error("测试数据不正确");
        transfer.items = [];
      }),
    ).rejects.toMatchObject(error);
    await expect(
      broken((d) => {
        const normal = d.records[0];
        if (normal.type !== "normal") throw new Error("测试数据不正确");
        normal.payments = [];
      }),
    ).rejects.toMatchObject(error);
  });

  it("空账本也生成三个工作表，列名顺序复用导入定义且表头加粗填绿", async () => {
    const workbook = await loadWorkbook(createEmptyDataExport());
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "收支",
      "转账",
      "余额变更",
    ]);
    for (const kind of [
      "incomeExpense",
      "transfer",
      "balanceAdjustment",
    ] as const) {
      const sheet = workbook.getWorksheet(importSheetKindLabels[kind])!;
      expect(sheet.rowCount).toBe(1);
      expect((sheet.getRow(1).values as string[]).slice(1)).toEqual(
        importColumnsBySheetKind[kind]
          .filter((column) => column.name !== "付款金额")
          .map((column) => column.name),
      );
      sheet.getRow(1).eachCell((header) => {
        expect(header.font.bold).toBe(true);
        expect(header.fill).toMatchObject({
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF92D050" },
        });
      });
    }
  });
});

/** 需本地 Supabase seed；所有写入都在事务内回滚，不修改开发数据。 */
describe.runIf(process.env.KURANOTE_DB_ROUNDTRIP === "1")(
  "dataExportWorkbook 数据库往返",
  () => {
    const ledgerId = "00000000-0000-4000-8000-000000000032";
    const accountId = "00000000-0000-4000-8000-000000000043";
    const merchantId = "00000000-0000-4000-8000-000000001001";
    const expenseCategoryId = "00000000-0000-4000-8000-000000005021";
    const incomeCategoryId = "00000000-0000-4000-8000-000000005002";

    function databaseSql(sql: string): string {
      return execFileSync(
        "docker",
        [
          "exec",
          "-i",
          "supabase_db_kuranote",
          "psql",
          "-X",
          "-qAt",
          "-v",
          "ON_ERROR_STOP=1",
          "-U",
          "postgres",
          "-d",
          "postgres",
        ],
        {
          input: `begin;
        set local role authenticated;
        do $$ begin perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}', true); end $$;
        ${sql}
        rollback;`,
          encoding: "utf8",
        },
      ).trim();
    }

    function createRecordSql(
      items: { amount: number; categoryId: string | undefined }[],
    ) {
      return `create temp table roundtrip_record as select public.create_transaction('${ledgerId}', 'expense', '2099-05-01T00:00:00Z', '${JSON.stringify(items)}'::jsonb, '[{"accountId":"${accountId}","amount":null}]'::jsonb, '${merchantId}', '#921 往返') as id;`;
    }

    it.each([false, true])(
      "真实 RPC 记录经 XLSX 导出导入仍为一笔且付款余额一致（混合=%s）",
      async (mixed) => {
        const sourceItems = [
          { categoryId: expenseCategoryId, amount: 100 },
          ...(mixed ? [{ categoryId: incomeCategoryId, amount: 30 }] : []),
        ];
        const source = JSON.parse(
          databaseSql(`
      ${createRecordSql(sourceItems)}
      select jsonb_build_object(
        'accounts', (select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'currency', currency, 'type', type, 'holder', null)) from public.account where id = '${accountId}'),
        'categories', (select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'parent_id', parent_id, 'type', type)) from public.category where ledger_id = '${ledgerId}'),
        'merchants', (select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'tagNames', '[]'::jsonb)) from public.merchant where id = '${merchantId}'),
        'records', (select jsonb_agg(jsonb_build_object('id', r.id, 'type', r.type, 'transactionAt', r.transaction_at, 'recorderName', '往返测试', 'note', r.note, 'merchantId', r.merchant_id,
          'items', (select jsonb_agg(jsonb_build_object('categoryId', category_id, 'amount', amount::text) order by sort_order) from public.transaction_item where transaction_record_id = r.id),
          'payments', (select jsonb_agg(jsonb_build_object('accountId', account_id, 'amount', amount::text) order by sort_order) from public.transaction_payment where transaction_record_id = r.id))) from public.transaction_record r join roundtrip_record t on t.id = r.id)
      );
    `),
        ) as DataExport;
        const { result, units } = await analyzeImportFile(
          new File([await buildDataExportWorkbook(source)], "roundtrip.xlsx"),
        );
        expect(result.ok).toBe(true);
        expect(units).toHaveLength(1);
        const unit = units[0];
        if (unit.kind !== "incomeExpense") throw new Error("意外的单元");
        expect(unit.group.items).toHaveLength(sourceItems.length);
        const importedItems = unit.group.items.map((item) => ({
          amount: item.amount,
          categoryId: source.categories.find(
            (category) =>
              category.type === item.transactionType &&
              category.parent_id !== null &&
              getCategoryDisplayName(category.name, undefined) ===
                item.childCategoryName,
          )?.id,
        }));
        expect(importedItems).toEqual(sourceItems);
        const payment = unit.group.items[0].payments[0];
        expect(payment).toMatchObject({
          accountName: source.accounts[0].name,
          amount: null,
        });
        const net = mixed ? -70 : -100;
        const restored = JSON.parse(
          databaseSql(`
      create temp table roundtrip_balance as select current_balance from public.account where id = '${accountId}';
      ${createRecordSql(importedItems)}
      select jsonb_build_object('records', (select count(*) from public.transaction_record where id = (select id from roundtrip_record)),
        'items', (select count(*) from public.transaction_item where transaction_record_id = (select id from roundtrip_record)),
        'delta', (select current_balance - (select current_balance from roundtrip_balance) from public.account where id = '${accountId}'),
        'paymentDelta', (select balance_delta from public.transaction_payment where transaction_record_id = (select id from roundtrip_record)));
    `),
        );
        expect(restored).toEqual({
          records: 1,
          items: sourceItems.length,
          delta: net,
          paymentDelta: net,
        });
      },
    );
  },
);
