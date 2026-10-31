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

type MemberAccountHolder = Extract<AccountHolder, { kind: "member" }>;

/** 把持有人候选转成账户上的成员持有人（测试与 Story 共用）。 */
export function createMemberAccountHolder(
  option: AccountHolderOption,
): MemberAccountHolder {
  return {
    display_color: option.display_color,
    display_name: option.display_name,
    email: option.email,
    id: `holder-${option.user_id}`,
    kind: "member",
    placeholder_id: null,
    role: "owner",
    share_ratio: null,
    user_id: option.user_id,
  };
}

/** 已离开账本的成员：不在持有人候选里，编辑账户时只显示并在保存时保留。 */
export const inactiveAccountHolderOptionFixture: AccountHolderOption = {
  display_color: "amber",
  display_name: "前成员",
  email: null,
  user_id: "00000000-0000-4000-8000-000000000049",
};

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
