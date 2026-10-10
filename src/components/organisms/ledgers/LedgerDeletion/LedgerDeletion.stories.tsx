import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import {
  ledgerDeletionFixture,
  emptyLedgerDeletionImpact,
} from "test/ledgerDeletion";
import { LedgerDeletion } from "./LedgerDeletion";

const meta = {
  title: "Organisms/Ledgers/LedgerDeletion",
  component: LedgerDeletion,
  args: { ...ledgerDeletionFixture, action: async () => ({}) },
} satisfies Meta<typeof LedgerDeletion>;
export default meta;
type Story = StoryObj<typeof meta>;
async function open(canvasElement: HTMLElement, step = 1, matched = false) {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "删除" }),
  );
  const page = within(canvasElement.ownerDocument.body);
  if (step === 2)
    await userEvent.click(
      await page.findByRole("button", { name: "继续删除" }),
    );
  if (matched)
    await userEvent.type(
      await page.findByRole("textbox", { name: "账本名" }),
      ledgerDeletionFixture.ledger.name,
    );
  return page;
}
export const Default: Story = { name: "删除入口" };
export const FirstWithMembers: Story = {
  name: "第一步·有成员",
  play: async ({ canvasElement }) => {
    await open(canvasElement);
  },
};
export const FirstWithoutMembers: Story = {
  name: "第一步·无成员",
  args: { impact: emptyLedgerDeletionImpact },
  play: FirstWithMembers.play,
};
export const SecondEmpty: Story = {
  name: "第二步·未输入",
  play: async ({ canvasElement }) => {
    await open(canvasElement, 2);
  },
};
export const SecondMatched: Story = {
  name: "第二步·已匹配",
  play: async ({ canvasElement }) => {
    await open(canvasElement, 2, true);
  },
};
export const Pending: Story = {
  name: "第二步·提交中",
  args: { action: () => new Promise(() => {}) },
  play: async ({ canvasElement }) => {
    const page = await open(canvasElement, 2, true);
    await userEvent.click(page.getByRole("button", { name: "永久删除" }));
  },
};
