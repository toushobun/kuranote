import ExcelJS from "exceljs";

import type { AccountExportSummary } from "internal/account";
import {
  IncompleteDataExportError,
  type DataExport,
} from "internal/dataExport";
import {
  incomeExpenseColumns,
  transferColumns,
  balanceAdjustmentColumns,
  importSheetKindLabels,
  type ImportColumnDef,
} from "internal/dataImport";
import { themeColorTokens } from "theme/themeColorTokens";
import { getAccountTypeLabel } from "utils/accounts";
import { getCategoryDisplayName } from "utils/categoryNames";
import { formatDateTimeLocalInputValue } from "utils/transactions";

export async function buildDataExportWorkbook(
  data: DataExport,
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  function createSheet(name: string, columns: ImportColumnDef[]) {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns.map(({ name }) => ({
      header: name,
      key: name,
      width: name === "备注" ? 36 : 22,
    }));
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF92D050" },
      };
    });
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    return sheet;
  }
  const incomeExpense = createSheet(
    importSheetKindLabels.incomeExpense,
    incomeExpenseColumns,
  );
  const transfer = createSheet(importSheetKindLabels.transfer, transferColumns);
  const adjustment = createSheet(
    importSheetKindLabels.balanceAdjustment,
    balanceAdjustmentColumns,
  );
  const accounts = new Map(
    data.accounts.map((account) => [account.id, account]),
  );
  const categories = new Map(
    data.categories.map((category) => [category.id, category]),
  );
  const merchants = new Map(
    data.merchants.map((merchant) => [merchant.id, merchant]),
  );

  function writeAccount(
    row: ExcelJS.Row,
    account: AccountExportSummary | undefined,
    prefix = "",
  ) {
    if (!account) throw new IncompleteDataExportError();
    const accountColumn = `${prefix}账户`;
    row.getCell(accountColumn).value = account.name;
    row.getCell(`${accountColumn}币种`).value = account.currency;
    row.getCell(`${accountColumn}持有人`).value = account.holder?.name ?? "";
    row.getCell(`${accountColumn}类型`).value = getAccountTypeLabel(
      account.type,
    );
    if (account.holder?.displayColor) {
      const argb = `FF${themeColorTokens[account.holder.displayColor].accent.slice(1).toUpperCase()}`;
      for (const name of [accountColumn, `${accountColumn}持有人`]) {
        row.getCell(name).font = { color: { argb } };
      }
    }
  }

  for (const record of data.records) {
    if (record.items.length === 0) throw new IncompleteDataExportError();
    const common = {
      日期: formatDateTimeLocalInputValue(record.transactionAt).replace(
        "T",
        " ",
      ),
      记账人: record.recorderName,
      备注: record.note,
    };
    if (record.type === "transfer") {
      const from = record.items.find((item) => Number(item.balanceDelta) < 0);
      const to = record.items.find((item) => Number(item.balanceDelta) > 0);
      if (
        record.items.length !== 2 ||
        !from ||
        !to ||
        from.accountId === to.accountId
      ) {
        throw new IncompleteDataExportError();
      }
      const row = transfer.addRow({
        ...common,
        交易类型: "转账",
        金额: from.amount,
      });
      writeAccount(row, accounts.get(from.accountId), "转出");
      writeAccount(row, accounts.get(to.accountId), "转入");
    } else if (record.type === "balance_adjustment") {
      for (const item of record.items) {
        const row = adjustment.addRow({
          ...common,
          交易类型: "余额变更",
          金额: item.balanceDelta,
        });
        writeAccount(row, accounts.get(item.accountId));
      }
    } else {
      const merchant = record.merchantId
        ? merchants.get(record.merchantId)
        : undefined;
      for (const item of record.items) {
        const category = item.categoryId
          ? categories.get(item.categoryId)
          : undefined;
        if (!category) throw new IncompleteDataExportError();
        const parent = category.parent_id
          ? categories.get(category.parent_id)
          : undefined;
        if (category.parent_id && !parent)
          throw new IncompleteDataExportError();
        const row = incomeExpense.addRow({
          ...common,
          账单关联: record.id,
          商家分类: merchant?.tagNames.join("、") ?? "",
          商家: merchant?.name ?? "",
          交易类型: category.type === "income" ? "收入" : "支出",
          一级分类: getCategoryDisplayName(
            parent?.name ?? category.name,
            undefined,
          ),
          二级分类: category.parent_id
            ? getCategoryDisplayName(category.name, undefined)
            : "",
          金额: item.amount,
        });
        writeAccount(row, accounts.get(item.accountId));
      }
    }
  }
  return (await workbook.xlsx.writeBuffer()) as unknown as ArrayBuffer;
}
