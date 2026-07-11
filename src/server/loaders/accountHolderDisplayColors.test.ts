import { describe, expect, it } from "vitest";

import { buildSingleHolderAccountColorById } from "./accountHolderDisplayColors";

const activeMemberUserIds = new Set(["user-a", "user-b"]);

describe("buildSingleHolderAccountColorById", () => {
  it("唯一有效持有人账户使用该成员在当前账本内的颜色", () => {
    const colors = buildSingleHolderAccountColorById({
      activeMemberUserIds,
      holders: [{ account_id: "account-a", user_id: "user-a" }],
      settings: [{ display_color: "sakura", user_id: "user-a" }],
    });

    expect(colors.get("account-a")).toBe("sakura");
  });

  it("多个有效持有人账户不设置成员颜色", () => {
    const colors = buildSingleHolderAccountColorById({
      activeMemberUserIds,
      holders: [
        { account_id: "account-a", user_id: "user-a" },
        { account_id: "account-a", user_id: "user-b" },
      ],
      settings: [
        { display_color: "sakura", user_id: "user-a" },
        { display_color: "amber", user_id: "user-b" },
      ],
    });

    expect(colors.has("account-a")).toBe(false);
  });

  it("已移除的历史持有人不参与唯一持有人判断", () => {
    const colors = buildSingleHolderAccountColorById({
      activeMemberUserIds: new Set(["user-a"]),
      holders: [
        { account_id: "account-a", user_id: "user-a" },
        { account_id: "account-a", user_id: "removed-user" },
      ],
      settings: [
        { display_color: "sakura", user_id: "user-a" },
        { display_color: "amber", user_id: "removed-user" },
      ],
    });

    expect(colors.get("account-a")).toBe("sakura");
  });

  it("成员颜色缺失或无效时保持默认账户颜色", () => {
    const colors = buildSingleHolderAccountColorById({
      activeMemberUserIds,
      holders: [
        { account_id: "account-a", user_id: "user-a" },
        { account_id: "account-b", user_id: "user-b" },
      ],
      settings: [
        { display_color: null, user_id: "user-a" },
        { display_color: "unknown", user_id: "user-b" },
      ],
    });

    expect(colors.size).toBe(0);
  });
});
