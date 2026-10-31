import type {
  AccountHolder,
  AccountHolderOption,
  AccountPlaceholderHolderOption,
} from "types/accounts";

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

/** 测试与 Story 共用的持有人候选：每位成员带各自的个性色。 */
export const accountHolderOptionsFixture: AccountHolderOption[] = [
  {
    display_color: "sky",
    display_name: "我",
    email: "me@example.test",
    user_id: "00000000-0000-4000-8000-000000000041",
  },
  {
    display_color: "sakura",
    display_name: "妻子",
    email: "wife@example.test",
    user_id: "00000000-0000-4000-8000-000000000042",
  },
  {
    display_color: "lime",
    display_name: "孩子",
    email: null,
    user_id: "00000000-0000-4000-8000-000000000043",
  },
];

export const accountPlaceholderHolderOptionsFixture: AccountPlaceholderHolderOption[] =
  [
    {
      display_name: "奶奶",
      placeholder_id: "00000000-0000-4000-8000-000000000061",
    },
  ];
