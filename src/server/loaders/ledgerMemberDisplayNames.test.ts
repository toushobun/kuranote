import { describe, expect, it } from "vitest";

import { mergeLedgerMemberDisplayNames } from "./ledgerMemberDisplayNames";

describe("mergeLedgerMemberDisplayNames", () => {
  it("账本成员昵称存在时优先使用当前账本内昵称", () => {
    const recorders = mergeLedgerMemberDisplayNames(
      [
        { display_name: "全局淞文", id: "user-a" },
        { display_name: "全局成员", id: "user-b" },
      ],
      [
        { display_name: "家庭账本淞文", user_id: "user-a" },
        { display_name: "旅行账本成员", user_id: "user-b" },
      ],
    );

    expect(recorders).toEqual([
      { display_name: "家庭账本淞文", id: "user-a" },
      { display_name: "旅行账本成员", id: "user-b" },
    ]);
  });

  it("账本成员昵称为空或不存在时回退到全局用户名", () => {
    const recorders = mergeLedgerMemberDisplayNames(
      [
        { display_name: "全局淞文", id: "user-a" },
        { display_name: "全局成员", id: "user-b" },
        { display_name: "全局只读", id: "user-c" },
      ],
      [
        { display_name: null, user_id: "user-a" },
        { display_name: "   ", user_id: "user-b" },
      ],
    );

    expect(recorders).toEqual([
      { display_name: "全局淞文", id: "user-a" },
      { display_name: "全局成员", id: "user-b" },
      { display_name: "全局只读", id: "user-c" },
    ]);
  });
});
