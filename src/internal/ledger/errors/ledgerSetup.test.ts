import { describe, expect, it } from "vitest";

import {
  ledgerSetupErrorCodes,
  ledgerSetupErrorMessages,
  ledgerSetupLoadErrorMessages,
  ledgerSetupWriteErrorMessages,
} from "./ledgerSetup";

describe("ledgerSetupErrorMessages", () => {
  it("每个错误码都有可直接展示的文案", () => {
    for (const code of Object.values(ledgerSetupErrorCodes)) {
      expect(ledgerSetupErrorMessages[code]).toMatch(/。$/);
    }
  });

  it("已有创建中账本时提示继续创建", () => {
    expect(
      ledgerSetupErrorMessages[ledgerSetupErrorCodes.inProgressExists],
    ).toBe("你有一个账本还没创建完，请先继续创建。");
  });
});

describe("ledgerSetupLoadErrorMessages", () => {
  it("返回创建中账本与默认分类读取失败提示", () => {
    expect(ledgerSetupLoadErrorMessages).toEqual({
      defaultCategoriesLoadFailed: "默认分类加载失败，请稍后重试。",
      loadFailed: "创建中的账本加载失败，请稍后重试。",
    });
  });
});

describe("ledgerSetupWriteErrorMessages", () => {
  it("返回创建中账本写入失败提示", () => {
    expect(ledgerSetupWriteErrorMessages).toEqual({
      basicInfoUpdateFailed: "账本基本信息保存失败，请稍后重试。",
      completeFailed: "账本创建完成失败，请稍后重试。",
      createFailed: "账本创建失败，请稍后重试。",
      draftSaveFailed: "创建进度保存失败，请稍后重试。",
    });
  });
});
