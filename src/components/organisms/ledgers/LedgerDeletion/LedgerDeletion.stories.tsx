import { alpha } from "@mui/material/styles";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  ledgerDeletionFixture,
  emptyLedgerDeletionImpact,
  loadLedgerDeletionImpactWith,
} from "test/ledgerDeletion";
import { theme } from "theme/theme";
import { LedgerDeletion } from "./LedgerDeletion";

const meta = {
  title: "Organisms/Ledgers/LedgerDeletion",
  component: LedgerDeletion,
  args: {
    ledger: ledgerDeletionFixture.ledger,
    action: async () => ({}),
    loadImpact: loadLedgerDeletionImpactWith(),
  },
} satisfies Meta<typeof LedgerDeletion>;
export default meta;
type Story = StoryObj<typeof meta>;
async function open(canvasElement: HTMLElement, step = 1, matched = false) {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "删除" }),
  );
  const page = within(canvasElement.ownerDocument.body);
  if (step === 2) {
    const next = await page.findByRole("button", { name: "继续删除" });
    await waitFor(() => expect(next).toBeEnabled());
    await userEvent.click(next);
  }
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
  args: { loadImpact: loadLedgerDeletionImpactWith(emptyLedgerDeletionImpact) },
  play: FirstWithMembers.play,
};
export const FirstWithPlaceholders: Story = {
  name: "第一步·有待邀请成员",
  args: {
    loadImpact: loadLedgerDeletionImpactWith({
      ...ledgerDeletionFixture.impact,
      placeholderNames: ["爷爷"],
    }),
  },
  play: FirstWithMembers.play,
};
export const FirstLoading: Story = {
  name: "第一步·读取中",
  args: { loadImpact: () => new Promise(() => {}) },
  play: FirstWithMembers.play,
};
export const FirstLoadFailed: Story = {
  name: "第一步·读取失败",
  args: {
    loadImpact: async () => ({ error: "删除影响读取失败，请稍后重试。" }),
  },
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
    // 提交中保持淡红禁用按钮并显示转圈，而不是默认灰色禁用样式。
    const pending = await page.findByRole("button", { name: "正在删除…" });
    await expect(pending).toBeDisabled();
    await expect(within(pending).getByRole("progressbar")).toBeVisible();
    // 按钮背景色有过渡动画，等动画结束后再比较
    await waitFor(() =>
      expect(getComputedStyle(pending).backgroundColor).toBe(
        alpha(theme.palette.error.main, 0.5),
      ),
    );
  },
};
