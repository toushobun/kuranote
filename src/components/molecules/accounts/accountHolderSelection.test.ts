import { describe, expect, it } from "vitest";

import {
  getInitialAccountHolderSelection,
  isAccountHolderSelected,
  toggleAccountHolderSelection,
} from "./accountHolderSelection";

const placeholderOptions = [{ display_name: "奶奶", placeholder_id: "p-1" }];

describe("accountHolderSelection", () => {
  it("初始值优先取仍可选的占位持有人", () => {
    expect(
      getInitialAccountHolderSelection({
        holderUserIds: ["user-a"],
        placeholderOptions,
        selectedPlaceholderId: "p-1",
        selectedUserIds: ["user-a"],
      }),
    ).toEqual({ id: "p-1", kind: "placeholder" });
  });

  it("占位不在候选里时取候选中的已选成员，都没有则为未选择", () => {
    expect(
      getInitialAccountHolderSelection({
        holderUserIds: ["user-a", "user-b"],
        placeholderOptions,
        selectedPlaceholderId: "p-9",
        selectedUserIds: ["user-b"],
      }),
    ).toEqual({ id: "user-b", kind: "member" });
    expect(
      getInitialAccountHolderSelection({
        holderUserIds: ["user-a"],
        placeholderOptions: [],
        selectedPlaceholderId: null,
        selectedUserIds: ["user-x"],
      }),
    ).toBeNull();
  });

  it("点击未选中项切换过去，再次点击取消选择", () => {
    const selected = toggleAccountHolderSelection(null, "member", "user-a");

    expect(isAccountHolderSelected(selected, "member", "user-a")).toBe(true);
    expect(
      toggleAccountHolderSelection(selected, "placeholder", "p-1"),
    ).toEqual({ id: "p-1", kind: "placeholder" });
    expect(
      toggleAccountHolderSelection(selected, "member", "user-a"),
    ).toBeNull();
  });
});
