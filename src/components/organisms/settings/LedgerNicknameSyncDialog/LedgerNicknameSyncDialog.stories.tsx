import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import {
  familyLedgerId,
  profileLedgerDisplayNames,
} from "test/userProfileFixtures";

import { LedgerNicknameSyncDialog } from "./LedgerNicknameSyncDialog";

const meta = {
  title: "Organisms/Settings/LedgerNicknameSyncDialog",
  component: LedgerNicknameSyncDialog,
  args: {
    displayName: "新昵称",
    ledgers: profileLedgerDisplayNames,
    onClose: () => {},
    onConfirm: () => {},
    onOnlyPersonal: () => {},
    onSelectAll: () => {},
    onSelectNone: () => {},
    onToggle: () => {},
    open: true,
    pending: false,
    selectedLedgerIds: new Set([familyLedgerId]),
  },
} satisfies Meta<typeof LedgerNicknameSyncDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveSyncDialog(
  args: Parameters<typeof LedgerNicknameSyncDialog>[0],
) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    args.selectedLedgerIds,
  );

  return (
    <LedgerNicknameSyncDialog
      {...args}
      onSelectAll={() =>
        setSelected(new Set(args.ledgers.map((ledger) => ledger.ledgerId)))
      }
      onSelectNone={() => setSelected(new Set())}
      onToggle={(ledgerId) =>
        setSelected((current) => {
          const next = new Set(current);
          if (next.has(ledgerId)) next.delete(ledgerId);
          else next.add(ledgerId);
          return next;
        })
      }
      selectedLedgerIds={selected}
    />
  );
}

export const DefaultCurrentLedger: Story = {
  name: "默认只勾选当前账本",
  render: (args) => <InteractiveSyncDialog {...args} />,
};

export const Pending: Story = {
  name: "提交中",
  args: { pending: true },
};
