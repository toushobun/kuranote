import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { screen, userEvent, within } from "storybook/test";

import { TransactionRefundLinkPicker } from "./TransactionRefundLinkPicker";

const meta = {
  title: "Organisms/Transactions/TransactionRefundLinkPicker",
  component: TransactionRefundLinkPicker,
  args: { onChange() {}, value: null },
} satisfies Meta<typeof TransactionRefundLinkPicker>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

function SimulatedSafeArea({ children }: { children: ReactNode }) {
  useEffect(() => {
    const rootStyle = document.documentElement.style;
    const previousTop = rootStyle.getPropertyValue("--app-safe-area-inset-top");
    const previousBottom = rootStyle.getPropertyValue(
      "--app-safe-area-inset-bottom",
    );

    rootStyle.setProperty("--app-safe-area-inset-top", "3rem");
    rootStyle.setProperty("--app-safe-area-inset-bottom", "1.5rem");

    return () => {
      if (previousTop) {
        rootStyle.setProperty("--app-safe-area-inset-top", previousTop);
      } else {
        rootStyle.removeProperty("--app-safe-area-inset-top");
      }
      if (previousBottom) {
        rootStyle.setProperty("--app-safe-area-inset-bottom", previousBottom);
      } else {
        rootStyle.removeProperty("--app-safe-area-inset-bottom");
      }
    };
  }, []);

  return children;
}

export const FullScreenSafeArea: Story = {
  name: "全屏弹框安全区",
  decorators: [
    (Story) => (
      <SimulatedSafeArea>
        <Story />
      </SimulatedSafeArea>
    ),
  ],
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "选择退款明细" }),
    );
    await screen.findByRole("button", { name: "关闭退款关联选择器" });
  },
};
