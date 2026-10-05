import { describe, expect, it } from "vitest";

import {
  balanceAdjustmentImportErrorMessages,
  dataImportErrorMessages,
  importRowErrorMessages,
  importStructuralErrorMessages,
  incomeExpenseImportErrorMessages,
  transferImportErrorMessages,
} from "internal/dataImport/errors";

describe("dataImport errors", () => {
  it("错误码对照表返回对应文案", () => {
    expect(dataImportErrorMessages).toEqual({
      execution_failed: "数据导入失败，请稍后重试。",
      execution_invalid: "导入文件或进度信息已变化，请重新检查格式后再导入。",
      file_too_large: "文件大小不能超过 50MB。",
      holder_mapping_conflict:
        "持有人映射与账本当前的成员或待邀请成员冲突，请重新检查后再导入。",
      ledger_invalid: "账本不存在、已停用或您无法访问。",
      reference_invalid: "导入数据引用的基础资料不正确。",
      validation_failed: "文件检查失败，请稍后重试。",
    });
  });

  it("结构性错误的固定文案", () => {
    expect(importStructuralErrorMessages.fileTypeUnsupported).toBe(
      "仅支持 xlsx 文件。",
    );
    expect(importStructuralErrorMessages.fileUnreadable).toBe(
      "文件无法解析，请确认文件未损坏且是有效的 xlsx 文件。",
    );
    expect(importStructuralErrorMessages.sheetNotFound).toBe(
      "未找到「收支」「转账」或「余额变更」表，无法导入。",
    );
    expect(importStructuralErrorMessages.workbookEmpty).toBe(
      "文件为空或没有可识别的数据表。",
    );
  });

  it("结构性错误按表名与列名拼出完整文案", () => {
    expect(
      importStructuralErrorMessages.missingRequiredColumns("转账", [
        "转出账户类型",
        "转入账户类型",
      ]),
    ).toBe("「转账」表缺少必填列：转出账户类型、转入账户类型。");
    expect(
      importStructuralErrorMessages.unknownColumns("收支", ["多余列", "备用"]),
    ).toBe("「收支」表存在无法识别的列：多余列、备用，请确认列名是否正确。");
  });

  it("多种表共用的行校验文案（备注上限由常量拼出）", () => {
    expect(importRowErrorMessages).toEqual({
      accountRequired: "账户不能为空。",
      currencyInvalid: "账户币种必须是 3 位字母代码，例如 CNY。",
      dateInvalid: "日期格式不正确，应为 YYYY-MM-DD HH:MM:SS。",
      holderInvalid:
        "账户持有人只能填写 0 个或 1 个持有人姓名，不支持填写多个持有人。",
      noteTooLong: "备注不能超过 2000 个字符。",
    });
  });

  it("余额变更表的行校验文案", () => {
    expect(balanceAdjustmentImportErrorMessages).toEqual({
      amountInvalid:
        "金额必须是非零、绝对值小于 1 万亿且不超过两位小数的数字。",
      typeInvalid: "交易类型必须是「余额变更」。",
    });
  });

  it("收支表的行校验固定文案", () => {
    expect(incomeExpenseImportErrorMessages.amountInvalid).toBe(
      "金额必须是不超过两位小数的非负数字。",
    );
    expect(incomeExpenseImportErrorMessages.merchantRequired).toBe(
      "商家不能为空。",
    );
    expect(incomeExpenseImportErrorMessages.parentCategoryRequired).toBe(
      "一级分类不能为空。",
    );
    expect(incomeExpenseImportErrorMessages.typeInvalid).toBe(
      "交易类型必须是「支出」或「收入」。",
    );
  });

  it("收支表的账单关联错误按账单关联、行号与列名拼出完整文案", () => {
    expect(
      incomeExpenseImportErrorMessages.billRefFirstRowPlaceholder("A1", 5, [
        "日期",
        "账户",
      ]),
    ).toBe(
      "账单关联「A1」下第 5 行是该账单关联首次出现的行，日期、账户 不能填写「-」，需提供实际值。",
    );
    expect(
      incomeExpenseImportErrorMessages.billRefSharedMismatch("7", 2, 3, [
        "日期",
        "备注",
      ]),
    ).toBe(
      "账单关联「7」下第 2 行与第 3 行的 日期、备注 不一致，无法合并为同一笔交易。",
    );
  });

  it("转账表的行校验文案（交易类型由常量拼出）", () => {
    expect(transferImportErrorMessages).toEqual({
      amountInvalid: "金额必须是大于 0、不超过两位小数的数字。",
      fromAccountCurrencyInvalid: "转出账户币种必须是 3 位字母代码，例如 CNY。",
      fromAccountRequired: "转出账户不能为空。",
      sameAccount: "转出账户与转入账户不能是同一个账户。",
      toAccountCurrencyInvalid: "转入账户币种必须是 3 位字母代码，例如 CNY。",
      toAccountRequired: "转入账户不能为空。",
      typeInvalid: "交易类型必须是「转账」。",
    });
  });
});
