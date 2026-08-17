import { describe, expect, it } from "vitest";

import {
  getLedgerSettingsErrorMessage,
  ledgerSettingsErrorCodes,
} from "./ledgerSettings";

describe("getLedgerSettingsErrorMessage", () => {
  it("返回账本基础信息校验提示", () => {
    expect(
      getLedgerSettingsErrorMessage(ledgerSettingsErrorCodes.nameRequired),
    ).toBe("请输入账本名称。");
    expect(
      getLedgerSettingsErrorMessage(ledgerSettingsErrorCodes.currencyInvalid),
    ).toBe("默认货币必须是 3 位大写字母，例如 JPY。");
  });

  it("返回成员设置与权限提示", () => {
    expect(
      getLedgerSettingsErrorMessage(
        ledgerSettingsErrorCodes.displayNameTooLong,
      ),
    ).toBe("当前账本昵称不能超过 100 个字符。");
    expect(
      getLedgerSettingsErrorMessage(ledgerSettingsErrorCodes.permissionDenied),
    ).toBe("你没有权限修改该账本或成员设置。");
  });

  it("返回关闭特殊状态功能前需要清理明细的提示", () => {
    expect(
      getLedgerSettingsErrorMessage(
        ledgerSettingsErrorCodes.specialStatusHasActiveItems,
      ),
    ).toBe(
      "账本内还有处于报销流程的明细，需要先处理完这些明细才能关闭该功能。",
    );
  });

  it("未知或空错误码返回 null", () => {
    expect(getLedgerSettingsErrorMessage("unknown")).toBeNull();
    expect(getLedgerSettingsErrorMessage()).toBeNull();
  });
});
