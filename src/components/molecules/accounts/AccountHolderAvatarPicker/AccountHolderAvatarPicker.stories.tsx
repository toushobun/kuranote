import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import {
  accountHolderOptionsFixture,
  accountPlaceholderHolderOptionsFixture,
  inactiveAccountHolderOptionFixture,
} from "test/mocks/accountHolders";
import type {
  AccountHolderOption,
  AccountPlaceholderHolderOption,
} from "types/accounts";

import type { AccountHolderSelection } from "../accountHolderSelection";
import { AccountHolderAvatarPicker } from "./AccountHolderAvatarPicker";

function AccountHolderAvatarPickerPreview({
  holderOptions,
  initialSelection,
  placeholderOptions,
  preservedHolderOptions,
}: {
  holderOptions: AccountHolderOption[];
  initialSelection: AccountHolderSelection;
  placeholderOptions: AccountPlaceholderHolderOption[];
  preservedHolderOptions?: AccountHolderOption[];
}) {
  const [selection, setSelection] = useState(initialSelection);
  return (
    <AccountHolderAvatarPicker
      holderOptions={holderOptions}
      onChange={setSelection}
      placeholderOptions={placeholderOptions}
      preservedHolderOptions={preservedHolderOptions}
      selection={selection}
    />
  );
}

const meta = {
  title: "Molecules/Accounts/AccountHolderAvatarPicker",
  component: AccountHolderAvatarPickerPreview,
  args: {
    holderOptions: accountHolderOptionsFixture,
    initialSelection: null,
    placeholderOptions: accountPlaceholderHolderOptionsFixture,
  },
} satisfies Meta<typeof AccountHolderAvatarPickerPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = { name: "未选择" };
export const MemberSelected: Story = {
  name: "已选择成员",
  args: {
    initialSelection: {
      id: accountHolderOptionsFixture[1]?.user_id ?? "",
      kind: "member",
    },
  },
};
export const MembersOnly: Story = {
  name: "没有待邀请成员",
  args: { placeholderOptions: [] },
};
export const NoOptions: Story = {
  name: "没有可选持有人",
  args: { holderOptions: [], placeholderOptions: [] },
};
export const WithInactiveHolder: Story = {
  name: "编辑时有非活跃成员持有人",
  args: { preservedHolderOptions: [inactiveAccountHolderOptionFixture] },
};
