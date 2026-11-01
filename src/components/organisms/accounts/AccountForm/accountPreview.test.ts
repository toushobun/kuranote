import { describe, expect, it } from "vitest";

import type { AccountHolderSelection } from "molecules/accounts/accountHolderSelection";

import {
  buildAccountPreviewHolders,
  getAccountPreviewBalance,
} from "./accountPreview";

const holderOptions = [
  {
    display_color: "sakura" as const,
    display_name: "妻子",
    email: null,
    user_id: "user-b",
  },
];
const placeholderOptions = [{ display_name: "奶奶", placeholder_id: "p-1" }];

describe("buildAccountPreviewHolders", () => {
  it("选择成员时带上该成员的个性色", () => {
    expect(
      buildAccountPreviewHolders({
        holderOptions,
        placeholderOptions,
        selection: { id: "user-b", kind: "member" },
      }),
    ).toEqual([
      expect.objectContaining({
        display_color: "sakura",
        display_name: "妻子",
        kind: "member",
        user_id: "user-b",
      }),
    ]);
  });

  it("选择待邀请成员时转成占位持有人", () => {
    expect(
      buildAccountPreviewHolders({
        holderOptions,
        placeholderOptions,
        selection: { id: "p-1", kind: "placeholder" },
      }),
    ).toEqual([
      expect.objectContaining({
        display_name: "奶奶",
        kind: "placeholder",
        placeholder_id: "p-1",
      }),
    ]);
  });

  it("未选择或候选里找不到时没有持有人", () => {
    expect(
      buildAccountPreviewHolders({
        holderOptions,
        placeholderOptions,
        selection: null,
      }),
    ).toEqual([]);
    expect(
      buildAccountPreviewHolders({
        holderOptions,
        placeholderOptions,
        selection: { id: "user-x", kind: "member" },
      }),
    ).toEqual([]);
  });

  describe("编辑时有非活跃成员持有人", () => {
    const preserved = {
      display_color: "amber" as const,
      display_name: "前成员",
      email: null,
      user_id: "user-x",
    };

    function previewNames(selection: AccountHolderSelection) {
      return buildAccountPreviewHolders({
        holderOptions,
        placeholderOptions,
        preservedHolderOptions: [preserved],
        selection,
      }).map((holder) => holder.display_name);
    }

    it("没选新持有人时保留显示非活跃持有人", () => {
      expect(previewNames(null)).toEqual(["前成员"]);
    });

    it.each<[string, AccountHolderSelection, string]>([
      ["成员", { id: "user-b", kind: "member" }, "妻子"],
      ["待邀请成员", { id: "p-1", kind: "placeholder" }, "奶奶"],
    ])("选了新的%s时按保存结果只显示新持有人", (_, selection, name) => {
      expect(previewNames(selection)).toEqual([name]);
    });
  });
});

describe("getAccountPreviewBalance", () => {
  it.each([
    ["-12800", -12800],
    ["0.5", 0.5],
    ["", 0],
    ["-", 0],
    ["abc", 0],
  ])("「%s」预览为 %s", (text, expected) => {
    expect(getAccountPreviewBalance(text)).toBe(expected);
  });
});
