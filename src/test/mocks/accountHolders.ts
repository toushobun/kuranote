import type { AccountHolder } from "types/accounts";

/** 测试与 Story 共用的待邀请成员（占位）持有人。 */
type PlaceholderAccountHolder = Extract<AccountHolder, { kind: "placeholder" }>;

export function createPlaceholderAccountHolder(
  overrides: Partial<
    Pick<PlaceholderAccountHolder, "display_name" | "id" | "placeholder_id">
  > = {},
): PlaceholderAccountHolder {
  return {
    display_color: null,
    display_name: "奶奶",
    email: null,
    id: "00000000-0000-4000-8000-000000000071",
    kind: "placeholder",
    placeholder_id: "00000000-0000-4000-8000-000000000061",
    role: "owner",
    share_ratio: null,
    user_id: null,
    ...overrides,
  };
}
