import { expect, userEvent, within } from "storybook/test";
import type { Decorator } from "@storybook/nextjs-vite";
import { ReceiptCreationProvider } from "organisms/transactions/ReceiptCreationProvider/ReceiptCreationProvider";
import { receiptCreationData } from "test/mocks/receiptCreation";
import { ConfirmDialogProvider } from "providers/ConfirmDialogProvider/ConfirmDialogProvider";

export const transactionEntryStoryDecorators: Decorator[] = [
  (Story) => (
    <ConfirmDialogProvider>
      <Story />
    </ConfirmDialogProvider>
  ),
];

export const receiptCreationStoryDecorator: Decorator = (Story) => (
  <ReceiptCreationProvider data={receiptCreationData()}>
    <Story />
  </ReceiptCreationProvider>
);

export async function openMerchantStoryDrawer(
  canvasElement: HTMLElement,
  currentMerchant = "请选择商家",
) {
  const body = within(canvasElement.ownerDocument.body);
  await userEvent.click(
    await body.findByRole("button", { name: `修改商家：${currentMerchant}` }),
  );
  return body;
}

// 读取中的两处行由同一小票组件渲染，Storybook 共用相同的断言。
export async function expectSuggestionLoadingRows(canvasElement: HTMLElement) {
  const body = within(canvasElement.ownerDocument.body);
  for (const message of ["正在按习惯准备明细…", "正在读取常用账户…"]) {
    const text = await body.findByText(message);
    await expect(text.closest('[role="status"]')).toBeVisible();
  }
  await expect(body.queryByRole("progressbar")).not.toBeInTheDocument();
  await expect(
    body.queryByRole("button", { name: "添加明细" }),
  ).not.toBeInTheDocument();
  await expect(
    body.queryByRole("button", { name: "添加付款账户" }),
  ).not.toBeInTheDocument();
}
