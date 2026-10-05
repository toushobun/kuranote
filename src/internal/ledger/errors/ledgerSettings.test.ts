import { describe, expect, it } from "vitest";

import {
  ledgerSettingsErrorCodes,
  ledgerSettingsErrorMessages,
  ledgerSettingsLoadErrorMessages,
  ledgerSettingsWriteErrorMessages,
} from "./ledgerSettings";

describe("ledgerSettingsErrorMessages", () => {
  it("返回账本基础信息校验提示", () => {
    expect(
      ledgerSettingsErrorMessages[ledgerSettingsErrorCodes.nameRequired],
    ).toBe("请输入账本名称。");
    expect(
      ledgerSettingsErrorMessages[ledgerSettingsErrorCodes.currencyInvalid],
    ).toBe("默认货币必须是 3 位大写字母，例如 JPY。");
  });

  it("返回成员设置与权限提示", () => {
    expect(
      ledgerSettingsErrorMessages[ledgerSettingsErrorCodes.displayNameTooLong],
    ).toBe("当前账本昵称不能超过 100 个字符。");
    expect(
      ledgerSettingsErrorMessages[ledgerSettingsErrorCodes.permissionDenied],
    ).toBe("你没有权限修改该账本或成员设置。");
  });

  it("返回关闭特殊状态功能前需要清理关联和明细的提示", () => {
    expect(
      ledgerSettingsErrorMessages[
        ledgerSettingsErrorCodes.specialStatusHasActiveItems
      ],
    ).toBe(
      "账本内仍有退款/报销关联或处于报销流程的明细，请先处理完成后再关闭该功能。",
    );
  });

  it("与账本创建、待邀请成员同一业务概念的文案引用同一定义", () => {
    expect(
      ledgerSettingsErrorMessages[ledgerSettingsErrorCodes.authRequired],
    ).toBe("登录状态已失效，请重新登录。");
    expect(
      ledgerSettingsErrorMessages[ledgerSettingsErrorCodes.displayColorInvalid],
    ).toBe("个性色指定不正确。");
    expect(
      ledgerSettingsErrorMessages[ledgerSettingsErrorCodes.nameTooLong],
    ).toBe("账本名称不能超过 100 个字符。");
    expect(
      ledgerSettingsErrorMessages[
        ledgerSettingsErrorCodes.displayNamePlaceholderConflict
      ],
    ).toBe("当前账本已有同名的待邀请成员，请换一个名字。");
  });
});

describe("ledgerSettingsLoadErrorMessages", () => {
  it("返回账本设置与成员读取失败提示", () => {
    expect(ledgerSettingsLoadErrorMessages).toEqual({
      ledgerLoadFailed: "账本信息读取失败，请稍后重试。",
      memberDisplaySettingsLoadFailed: "账本成员显示设置加载失败，请稍后重试。",
      memberProfilesLoadFailed: "账本成员资料加载失败，请稍后重试。",
      memberRoleInvalid: "账本成员资料格式异常，请稍后重试。",
      memberRoleLoadFailed: "账本成员权限读取失败，请稍后重试。",
      membersLoadFailed: "账本成员加载失败，请稍后重试。",
    });
  });
});

describe("ledgerSettingsWriteErrorMessages", () => {
  it("返回账本设置写入失败提示", () => {
    expect(ledgerSettingsWriteErrorMessages).toEqual({
      baseSettingsUpdateFailed: "账本设置保存失败，请稍后重试。",
      memberSettingsUpdateFailed: "账本成员设置保存失败，请稍后重试。",
    });
  });
});
